import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Keyboard,
} from "react-native";
import { FplContext } from "../contexts/FplContext";

const HomeScreen = ({ navigation }) => {
  const { fplId, setFplId, setTeam, setEvent } = useContext(FplContext);
  const [inputId, setInputId] = useState(fplId);
  const [loading, setLoading] = useState(false);

  const fetchTeam = async () => {
    if (!inputId) return;
    setLoading(true);
    Keyboard.dismiss();
    try {
      const response = await fetch(
        `http://192.168.1.5:5000/api/fpl/team/${inputId}`
      );
      const data = await response.json();

      setFplId(inputId);
      setTeam(data.team);
      setEvent(data.event); // <-- This must be called
      navigation.navigate("Team");
    } catch (error) {
      console.error("Error fetching team:", error);
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
        value={inputId}
        onChangeText={setInputId}
        keyboardType="numeric"
      />
      <Button title="Fetch My Team" onPress={fetchTeam} disabled={loading} />
      {loading && <Text style={styles.loading}>Loading...</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, marginTop: 50 },
  label: { fontSize: 18, marginBottom: 6 },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
  },
  loading: { marginTop: 10, color: "gray" },
});

export default HomeScreen;
