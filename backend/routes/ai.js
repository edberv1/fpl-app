const express = require('express');
const router = express.Router();
const axios = require('axios');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/ai/next-week
router.post('/next-week', async (req, res) => {
  try {
    const { fplId, lastEvent, bank } = req.body;

    if (!fplId || !lastEvent) {
      return res.status(400).json({ error: 'fplId and lastEvent are required' });
    }

    // Bootstrap: all players + teams
    const { data: bootstrap } = await axios.get(
      'https://fantasy.premierleague.com/api/bootstrap-static/'
    );
    const players = bootstrap.elements;
    const teams = bootstrap.teams;

    // Last GW team
    const { data: lastGWData } = await axios.get(
      `https://fantasy.premierleague.com/api/entry/${fplId}/event/${lastEvent}/picks/`
    );

    // Entry info → free transfers
    const { data: entryData } = await axios.get(
      `https://fantasy.premierleague.com/api/entry/${fplId}/`
    );
    const freeTransfers = entryData.transfers_limit || 1;

    const lastTeam = lastGWData.picks.map((pick) => {
      const player = players.find((p) => p.id === pick.element);
      const team = teams.find((t) => t.id === player.team);
      return {
        id: player.id,
        name: `${player.first_name} ${player.second_name}`,
        team: team?.name || 'Unknown',
        position: player.element_type,
        cost: player.now_cost / 10,
        total_points: player.total_points,
        is_captain: pick.is_captain,
        is_vice_captain: pick.is_vice_captain,
      };
    });

    // Fixtures for next GW
    const nextGW = lastEvent + 1;
    const { data: fixtures } = await axios.get(
      'https://fantasy.premierleague.com/api/fixtures/'
    );
    const nextGWFixtures = fixtures.filter((f) => f.event === nextGW);

    // Attach fixtures to teams
    const teamNextFixtureMap = {};
    nextGWFixtures.forEach((fix) => {
      teamNextFixtureMap[fix.team_h] = {
        opponent: teams.find((t) => t.id === fix.team_a).name,
        homeAway: 'Home',
        difficulty: fix.team_h_difficulty,
      };
      teamNextFixtureMap[fix.team_a] = {
        opponent: teams.find((t) => t.id === fix.team_h).name,
        homeAway: 'Away',
        difficulty: fix.team_a_difficulty,
      };
    });

    // Relevant players (your team + those in fixtures)
    const relevantPlayers = players
      .filter((p) => lastTeam.some((t) => t.id === p.id))
      .map((p) => {
        const team = teams.find((t) => t.id === p.team);
        const fixture = teamNextFixtureMap[p.team];
        return {
          id: p.id,
          name: `${p.first_name} ${p.second_name}`,
          team: team?.name || 'Unknown',
          position: p.element_type,
          cost: p.now_cost / 10,
          total_points: p.total_points,
          form: p.form,
          fixture: fixture || null,
        };
      });

    // Strict JSON schema for AI
    const prompt = `
You are an FPL expert. Recommend changes ONLY for the next gameweek using the data below.
Do NOT invent fixtures or players not provided. Output must be valid JSON.

INPUT:
- Last GW team: ${JSON.stringify(lastTeam)}
- Next GW fixtures: ${JSON.stringify(nextGWFixtures)}
- Relevant players: ${JSON.stringify(relevantPlayers)}
- Free transfers: ${freeTransfers}
- Bank: £${bank || 0}

OUTPUT JSON format:
{
  "out": ["Player A", "Player B"],
  "in": ["Player X", "Player Y"],
  "captain": "Player Name",
  "viceCaptain": "Player Name",
  "chips": ["Wildcard" | "Free Hit" | "Bench Boost" | "None"],
  "notes": "Any extra advice"
}
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 800,
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);

    res.json({ recommendations: aiResponse, nextGW, freeTransfers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

module.exports = router;
