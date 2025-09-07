import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Image } from "react-native";

const FixturesScreen = () => {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFixtures = async () => {
    try {
      const response = await fetch("http://192.168.1.5:5000/api/fpl/fixtures");
      const data = await response.json();
      setFixtures(data);
    } catch (err) {
      console.error("Error fetching fixtures:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFixtures();

    // Auto-refresh every 30 seconds for live updates
    const interval = setInterval(fetchFixtures, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderItem = ({ item }) => {
    const status = item.finished ? "FT" : item.started ? "LIVE" : "UPCOMING";

    return (
      <View style={styles.card}>
        <Text style={styles.date}>{formatDate(item.kickoff_time)}</Text>
        <View style={styles.matchRow}>
          <View style={styles.team}>
            <Image
              source={{ uri: item.home_badge, cache: "force-cache" }}
              defaultSource={require("../assets/shirt.png")}
              style={styles.badge}
            />
            <Text style={styles.teamName}>{item.home_team}</Text>
          </View>

          <Text style={styles.score}>
            {item.home_score ?? "-"} : {item.away_score ?? "-"}
          </Text>

          <View style={styles.team}>
            <Image
              source={{ uri: item.away_badge, cache: "force-cache" }}
              defaultSource={require("../assets/shirt.png")}
              style={styles.badge}
            />
            <Text style={styles.teamName}>{item.away_team}</Text>
          </View>
        </View>
        <Text style={[styles.status, status === "LIVE" && styles.live]}>
          {status}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Premier League Fixtures</Text>
      {loading ? (
        <Text>Loading fixtures...</Text>
      ) : (
        <FlatList
          data={fixtures}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#cccfcf",
    padding: 14,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 1,
  },
  date: { fontSize: 14, color: "#666", marginBottom: 4 },
  match: { fontSize: 16, fontWeight: "bold" },
  status: { fontSize: 14, marginTop: 4, color: "#888" },
  live: { color: "#d32f2f", fontWeight: "bold" },
  matchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  team: {
    flexDirection: "row",
    alignItems: "center",
    width: "35%",
  },
  badge: {
    width: 24,
    height: 24,
    marginRight: 6,
    resizeMode: "contain",
  },
  teamName: {
    fontSize: 14,
    flexShrink: 1,
  },
  score: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default FixturesScreen;
