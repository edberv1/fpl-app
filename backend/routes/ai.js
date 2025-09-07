const express = require('express');
const router = express.Router();
const axios = require('axios');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/ai/next-week
// Receives: { fplId, lastEvent, bank, optionalNotes }
router.post('/next-week', async (req, res) => {
  try {
    const { fplId, lastEvent, bank, optionalNotes } = req.body;

    if (!fplId || !lastEvent) {
      return res.status(400).json({ error: 'fplId and lastEvent are required' });
    }

    // 1️⃣ Fetch bootstrap for player info
    const { data: bootstrap } = await axios.get('https://fantasy.premierleague.com/api/bootstrap-static/');
    const players = bootstrap.elements;
    const teams = bootstrap.teams;

    // 2️⃣ Fetch previous gameweek team
    const { data: lastGWData } = await axios.get(
      `https://fantasy.premierleague.com/api/entry/${fplId}/event/${lastEvent}/picks/`
    );

    const lastTeam = lastGWData.picks.map(pick => {
      const player = players.find(p => p.id === pick.element);
      const team = teams.find(t => t.id === player.team);
      return {
        id: player.id,
        name: `${player.first_name} ${player.second_name}`,
        position: player.element_type,
        team: team ? team.name : 'Unknown',
        now_cost: player.now_cost / 10, // cost in millions
        total_points: player.total_points,
        event_points: player.event_points,
        is_captain: pick.is_captain,
        is_vice_captain: pick.is_vice_captain,
        multiplier: pick.multiplier
      };
    });

    // 3️⃣ Fetch next gameweek fixtures
    const nextGW = lastEvent + 1;
    const { data: fixtures } = await axios.get('https://fantasy.premierleague.com/api/fixtures/');
    const nextGWFixtures = fixtures.filter(f => f.event === nextGW);

    // 4️⃣ Determine relevant players: last GW team + next GW fixtures teams
    const nextGWTeamIds = nextGWFixtures.flatMap(f => [f.team_h, f.team_a]);
    const relevantPlayers = players.filter(p =>
      lastTeam.some(t => t.id === p.id) || nextGWTeamIds.includes(p.team)
    ).map(player => {
      const team = teams.find(t => t.id === player.team);
      return {
        id: player.id,
        name: `${player.first_name} ${player.second_name}`,
        position: player.element_type,
        team: team ? team.name : 'Unknown',
        now_cost: player.now_cost / 10,
        total_points: player.total_points,
        form: player.form,
        minutes: player.minutes,
        selected_by_percent: player.selected_by_percent,
        injuries: player.status || 'Available', // basic injury status
      };
    });

    // 5️⃣ Create AI prompt
    const prompt = `
You are an expert Fantasy Premier League assistant. Your task is to analyze a user's team and provide the most accurate and actionable recommendations for the next gameweek ONLY.

Input data:
1️⃣ Last gameweek team: ${JSON.stringify(lastTeam)}
   - Includes: player name, position, team, cost in millions, total points, points this gameweek, captain/vice-captain, multiplier
2️⃣ Next gameweek fixtures: ${JSON.stringify(nextGWFixtures)}
   - Includes: home/away, teams playing, difficulty rating if available
3️⃣ Player stats: ${JSON.stringify(relevantPlayers)}
   - Includes: minutes played, form, selected_by_percent, injuries, suspensions, rotation risk, expected points if known
4️⃣ Available bank funds: £${bank}m
5️⃣ Optional notes: ${JSON.stringify(optionalNotes || [])}

Your instructions:
- Recommend transfers in/out **from the players provided only**, respecting budget constraints.
- Never suggest transfers exceeding the available bank + value of selling players.
- Recommend optimal starting 11, substitutes, captain, and vice-captain.
- Suggest best use of chips if applicable (Wildcard, Free Hit, Bench Boost, Triple Captain).
- Consider fixture difficulty, player form, rotation risk, injuries, suspensions, team strength, and probability of winning.
- Justify each recommendation clearly with examples like "Transfer in X because of form, fixture, and expected points."
- Only output advice for next gameweek.
- Output must be human-readable, concise, and actionable.

Format output clearly:
- Transfers: who to sell, who to buy, with reasoning
- Starting 11: with captain & vice-captain
- Bench: who to place on bench
- Chips: which to use and why
- Additional strategic advice
`;

    // 6️⃣ Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800, // slightly larger output
    });

    const aiResponse = completion.choices[0].message.content;

    // 7️⃣ Return AI recommendations
    res.json({ recommendations: aiResponse, nextGW });

  } catch (error) {
    console.error(error);

    if (error.code === 'rate_limit_exceeded') {
      res.status(429).json({ error: 'OpenAI rate limit exceeded. Try again later.' });
    } else {
      res.status(500).json({ error: 'AI analysis failed.' });
    }
  }
});

module.exports = router;
