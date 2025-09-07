const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/team/:id', async (req, res) => {
  const id = req.params.id;
  const customEventId = parseInt(req.query.eventId); // optional query param

  try {
    const { data: bootstrap } = await axios.get('https://fantasy.premierleague.com/api/bootstrap-static/');
    const events = bootstrap.events;

    let eventId;
    if (customEventId) {
      eventId = customEventId;
    } else {
      let currentEvent = events.find(e => e.is_current === true);
      if (!currentEvent) {
        const finishedEvents = events.filter(e => e.finished === true);
        currentEvent = finishedEvents.reduce((max, e) => (e.id > max ? e.id : max), 1);
        if (typeof currentEvent === 'number') {
          currentEvent = events.find(e => e.id === currentEvent);
        }
      }
      eventId = currentEvent.id;
    }

    const { data: teamData } = await axios.get(
      `https://fantasy.premierleague.com/api/entry/${id}/event/${eventId}/picks/`
    );

    const picks = teamData.picks;
    const players = bootstrap.elements;
    const teams = bootstrap.teams;
    const positions = bootstrap.element_types;

    const { data: liveData } = await axios.get(
      `https://fantasy.premierleague.com/api/event/${eventId}/live/`
    );
    const elementsStats = liveData.elements; // playerId-based stats

      const fullTeam = picks.map(pick => {
      const player = players.find(p => p.id === pick.element);
      const team = teams.find(t => t.id === player.team);
      const position = positions.find(pos => pos.id === player.element_type);
      const stats = elementsStats.find(e => e.id === pick.element);

      return {
        id: player.id,
        name: `${player.first_name} ${player.second_name}`,
        position: position.singular_name,
        team: team.name,
        now_cost: player.now_cost / 10,
        event_points: stats?.stats?.total_points || 0,
        is_captain: pick.is_captain,
        is_vice_captain: pick.is_vice_captain,
        multiplier: pick.multiplier,
      };
    });

    res.json({ team: fullTeam, event: eventId });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Failed to fetch and process FPL data' });
  }
});



//fixtures
router.get('/fixtures', async (req, res) => {
  try {
    const [fixturesRes, bootstrapRes] = await Promise.all([
      axios.get('https://fantasy.premierleague.com/api/fixtures/'),
      axios.get('https://fantasy.premierleague.com/api/bootstrap-static/')
    ]);

    const fixtures = fixturesRes.data;
    const teams = bootstrapRes.data.teams;

    const enrichedFixtures = fixtures.map(fixture => {
  const homeTeam = teams.find(t => t.id === fixture.team_h);
  const awayTeam = teams.find(t => t.id === fixture.team_a);

  return {
    id: fixture.id,
    event: fixture.event,
    kickoff_time: fixture.kickoff_time,
    started: fixture.started,
    finished: fixture.finished,
    home_team: homeTeam.name,
    away_team: awayTeam.name,
    home_score: fixture.team_h_score,
    away_score: fixture.team_a_score,
    home_badge: `https://resources.premierleague.com/premierleague/badges/t${homeTeam.code}.png`,
    away_badge: `https://resources.premierleague.com/premierleague/badges/t${awayTeam.code}.png`,
  };
});


    res.json(enrichedFixtures);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch fixtures' });
  }
});



module.exports = router;
