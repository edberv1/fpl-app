import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
} from "react-native";

const HomeScreen = () => {
  const [fplId, setFplId] = useState("");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTeam = async () => {
    if (!fplId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `http://192.168.1.8:5000/api/fpl/team/${fplId}`
      );
      const data = await response.json();
      setPlayers(data.team); // `team` is an array of player objects
    } catch (error) {
      console.error("Failed to fetch team:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Enter your FPL ID:</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 123456"
        value={fplId}
        onChangeText={setFplId}
        keyboardType="numeric"
      />
      <Button title="Get My Team" onPress={fetchTeam} disabled={loading} />

      {loading && <Text style={styles.loading}>Loading...</Text>}

      <FlatList
        data={players}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const points = item.is_captain
            ? item.event_points * item.multiplier
            : item.event_points;
          return (
            <Text style={styles.player}>
              {item.name} {item.is_captain ? "🅲" : ""} — Points this GW:{" "}
              {points}
            </Text>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 50,
  },
  label: {
    fontSize: 18,
    marginBottom: 6,
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
  },
  loading: {
    marginVertical: 10,
    color: "gray",
  },
  player: {
    paddingVertical: 5,
    fontSize: 16,
  },
});

export default HomeScreen;
