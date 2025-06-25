const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/team/:id', async (req, res) => {
  const id = req.params.id;

  try {
    // Fetch all events to find latest/current event id
    const { data: bootstrap } = await axios.get('https://fantasy.premierleague.com/api/bootstrap-static/');
    const events = bootstrap.events;

    // Find the current event, or fallback to latest finished event (where is_finished === true)
    let currentEvent = events.find(e => e.is_current === true);

    if (!currentEvent) {
      // fallback: find the max id of finished events
      const finishedEvents = events.filter(e => e.finished === true);
      currentEvent = finishedEvents.reduce((max, e) => (e.id > max ? e.id : max), 1);
      // If currentEvent is now a number, convert it to event object for consistency
      if (typeof currentEvent === 'number') {
        currentEvent = events.find(e => e.id === currentEvent);
      }
    }

    const eventId = currentEvent.id;

    // Fetch team picks for the latest event
    const { data: teamData } = await axios.get(
      `https://fantasy.premierleague.com/api/entry/${id}/event/${eventId}/picks/`
    );
    const picks = teamData.picks;

    // Fetch player, team, position data
    const players = bootstrap.elements;
    const teams = bootstrap.teams;
    const positions = bootstrap.element_types;

    // Map picks with player details
    const fullTeam = picks.map(pick => {
      const player = players.find(p => p.id === pick.element);
      const team = teams.find(t => t.id === player.team);
      const position = positions.find(pos => pos.id === player.element_type);

      return {
        id: player.id,
        name: `${player.first_name} ${player.second_name}`,
        position: position.singular_name,
        team: team.name,
        now_cost: player.now_cost / 10,
        event_points: player.event_points,
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

module.exports = router;
