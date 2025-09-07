import React, { useContext, useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Image, Button } from "react-native";
import { FplContext } from "../contexts/FplContext";

const TeamScreen = () => {
  const {
    fplId,
    team,
    setTeam,
    event,
    setEvent,
    currentEventId,
    setCurrentEventId,
  } = useContext(FplContext);

  const [loading, setLoading] = useState(false);

  const fetchTeamForEvent = async (eventId) => {
    if (!fplId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `http://192.168.1.5:5000/api/fpl/team/${fplId}?eventId=${eventId}`
      );
      const data = await response.json();
      setTeam(data.team);
      setEvent(data.event);
      setCurrentEventId(data.event);
    } catch (error) {
      console.error("Error fetching event team:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    if (currentEventId > 1) {
      fetchTeamForEvent(currentEventId - 1);
    }
  };

  const handleNext = () => {
    if (currentEventId < 38) {
      // FPL has 38 GWs max
      fetchTeamForEvent(currentEventId + 1);
    }
  };

  useEffect(() => {
    if (!currentEventId && event) {
      setCurrentEventId(event);
    }
  }, [event]);

  if (!team || team.length === 0 || event === null) {
    return (
      <View style={styles.centered}>
        <Text>Loading team...</Text>
      </View>
    );
  }

  const starters = team.filter((player) => player.multiplier > 0);
  const bench = team.filter((player) => player.multiplier === 0);

  const totalPoints = starters.reduce(
    (sum, player) => sum + player.event_points * player.multiplier,
    0
  );

  const getPlayersByPosition = (position) =>
    starters.filter((player) => player.position === position);

  const renderRow = (players) => (
    <View style={styles.row}>
      {players.map((player) => (
        <View key={player.id} style={styles.playerBox}>
          <Image
            source={require("../assets/shirt.png")}
            style={styles.shirtImage}
          />
          <Text style={styles.playerName}>
            {player.name.includes(" ")
              ? `${player.name.split(" ")[0][0]}.${
                  player.name.split(" ").slice(-1)[0]
                }`
              : player.name}
            {player.is_captain ? " (C)" : player.is_vice_captain ? " (VC)" : ""}
          </Text>
          <Text style={styles.points}>
            {player.event_points * player.multiplier} pts
          </Text>
        </View>
      ))}
    </View>
  );

  const renderBench = () => (
    <View style={styles.benchSection}>
      <Text style={styles.benchTitle}>Substitutes</Text>
      <View style={styles.row}>
        {bench.map((player) => (
          <View key={player.id} style={styles.benchPlayerBox}>
            <Image
              source={require("../assets/shirt.png")}
              style={styles.benchImage}
            />
            <Text style={styles.benchName}>
              {player.name.includes(" ")
                ? `${player.name.split(" ")[0][0]}.${
                    player.name.split(" ").slice(-1)[0]
                  }`
                : player.name}
              {player.is_captain
                ? " (C)"
                : player.is_vice_captain
                ? " (VC)"
                : ""}
            </Text>
            <Text style={styles.benchPoints}>{player.event_points} pts</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        Gameweek {currentEventId} – Total Points: {totalPoints}
      </Text>

      <View style={styles.navButtons}>
        <Button
          title="<"
          onPress={handlePrev}
          disabled={currentEventId <= 1 || loading}
        />
        <Button
          title=">"
          onPress={handleNext}
          disabled={currentEventId >= 38 || loading}
        />
      </View>

      {renderRow(getPlayersByPosition("Goalkeeper"))}
      {renderRow(getPlayersByPosition("Defender"))}
      {renderRow(getPlayersByPosition("Midfielder"))}
      {renderRow(getPlayersByPosition("Forward"))}

      {renderBench()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 16 },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  navButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 30,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
    flexWrap: "wrap",
  },
  playerBox: {
    alignItems: "center",
    marginHorizontal: 10,
    marginBottom: 10,
  },
  shirtImage: {
    width: 40,
    height: 40,
    marginBottom: 5,
  },
  playerName: {
    fontSize: 14,
    fontWeight: "500",
  },
  points: {
    fontSize: 12,
    color: "#444",
  },
  benchSection: {
    marginTop: 20,
    borderTopColor: "#ccc",
    borderTopWidth: 1,
    paddingTop: 10,
  },
  benchTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  benchPlayerBox: {
    alignItems: "center",
    marginHorizontal: 10,
  },
  benchImage: {
    width: 30,
    height: 30,
    marginBottom: 4,
  },
  benchName: {
    fontSize: 12,
    fontWeight: "500",
  },
  benchPoints: {
    fontSize: 12,
    color: "#666",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default TeamScreen;
