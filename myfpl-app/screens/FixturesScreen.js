import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from "react-native";

const FixturesScreen = () => {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentGW, setCurrentGW] = useState(null);
  const [allFixtures, setAllFixtures] = useState([]);

  const fetchFixtures = async () => {
    try {
      const response = await fetch("http://192.168.1.5:5000/api/fpl/fixtures");
      const data = await response.json();
      setAllFixtures(data);

      // Determine current GW (first unfinished or upcoming)
      const upcoming = data.find(f => !f.finished);
      const gw = upcoming ? upcoming.event : Math.max(...data.map(f => f.event));
      setCurrentGW(gw);
    } catch (err) {
      console.error("Error fetching fixtures:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFixtures();
    const interval = setInterval(fetchFixtures, 30000); // auto-refresh
    return () => clearInterval(interval);
  }, []);

  // Filter fixtures by current gameweek
  const filteredFixtures = allFixtures.filter(f => f.event === currentGW);

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

  const goToPreviousGW = () => {
    if (currentGW > 1) setCurrentGW(currentGW - 1);
  };

  const goToNextGW = () => {
    const maxGW = Math.max(...allFixtures.map(f => f.event));
    if (currentGW < maxGW) setCurrentGW(currentGW + 1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Premier League Fixtures</Text>

      {/* Pagination Arrows */}
      <View style={styles.pagination}>
        <TouchableOpacity onPress={goToPreviousGW} style={styles.arrowButton}>
          <Text style={styles.arrow}>⬅️</Text>
        </TouchableOpacity>
        <Text style={styles.gwText}>Gameweek {currentGW}</Text>
        <TouchableOpacity onPress={goToNextGW} style={styles.arrowButton}>
          <Text style={styles.arrow}>➡️</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text>Loading fixtures...</Text>
      ) : (
        <FlatList
          data={filteredFixtures}
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
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  arrowButton: {
    padding: 6,
  },
  arrow: { fontSize: 20 },
  gwText: { fontSize: 16, fontWeight: "bold" },
  card: {
    backgroundColor: "#cccfcf",
    padding: 14,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 1,
  },
  date: { fontSize: 14, color: "#666", marginBottom: 4 },
  matchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  team: { flexDirection: "row", alignItems: "center", width: "35%" },
  badge: { width: 24, height: 24, marginRight: 6, resizeMode: "contain" },
  teamName: { fontSize: 14, flexShrink: 1 },
  score: { fontSize: 16, fontWeight: "bold" },
  status: { fontSize: 14, marginTop: 4, color: "#888" },
  live: { color: "#d32f2f", fontWeight: "bold" },
});

export default FixturesScreen;
