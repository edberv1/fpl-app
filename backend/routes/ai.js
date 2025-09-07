const express = require('express');
const router = express.Router();
const axios = require('axios');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/ai/next-week
// Receives: { fplId, lastEvent }
router.post('/next-week', async (req, res) => {
  try {
    const { fplId, lastEvent } = req.body;

    if (!fplId || !lastEvent) {
      return res.status(400).json({ error: 'fplId and lastEvent are required' });
    }

    // 1️⃣ Fetch bootstrap for player info
    const { data: bootstrap } = await axios.get('https://fantasy.premierleague.com/api/bootstrap-static/');
    const players = bootstrap.elements;
    const teams = bootstrap.teams;

    // 2️⃣ Fetch your previous gameweek team
    const { data: lastGWData } = await axios.get(
      `https://fantasy.premierleague.com/api/entry/${fplId}/event/${lastEvent}/picks/`
    );
    const lastTeam = lastGWData.picks.map(pick => {
      const player = players.find(pl => pl.id === pick.element);
      return {
        id: player.id,
        name: `${player.first_name} ${player.second_name}`,
        position: player.element_type,
        team: teams.find(t => t.id === player.team).name,
        now_cost: player.now_cost / 10,
        total_points: player.total_points,
        event_points: player.event_points,
        is_captain: pick.is_captain,
        is_vice_captain: pick.is_vice_captain,
        multiplier: pick.multiplier
      };
    });

    // 3️⃣ Get next gameweek fixtures
    const nextGW = lastEvent + 1;
    const { data: fixtures } = await axios.get('https://fantasy.premierleague.com/api/fixtures/');
    const nextGWFixtures = fixtures.filter(f => f.event === nextGW);

    // 4️⃣ Prepare relevant players for next GW
    const nextGWTeamIds = nextGWFixtures.flatMap(f => [f.team_h, f.team_a]);
    const relevantPlayers = players.filter(p => 
      lastTeam.some(t => t.id === p.id) || nextGWTeamIds.includes(p.team)
    );

    // 5️⃣ Create AI prompt
    const prompt = `
You are a Fantasy Premier League assistant. 
I provide you my last gameweek team: ${JSON.stringify(lastTeam)}.
The next gameweek fixtures: ${JSON.stringify(nextGWFixtures)}.
Player info for relevant players: ${JSON.stringify(relevantPlayers)}.

Analyze the following:
- Injuries, suspensions, and rotation risk
- Team strength and matchup probabilities
- Players likely to perform well
- Transfers I should make
- Who should be in my starting 11
- Captain & Vice-Captain choice

Give me clear recommendations for the next gameweek only.
Explain why each change or recommendation is suggested.
Be concise, human-readable, and focus on actionable advice.
`;

    // 6️⃣ Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600, // keep output concise
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
