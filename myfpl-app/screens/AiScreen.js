import React, { useContext, useState } from 'react';
import { View, Text, Button, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { FplContext } from '../contexts/FplContext';

const AiScreen = () => {
  const { fplId, event } = useContext(FplContext); // ✅ get fplId from context
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState('');

  const fetchAiRecommendations = async () => {
    if (!fplId || !event) {
      setRecommendations('FPL ID or current event not available.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://192.168.1.5:5000/api/ai/next-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fplId, lastEvent: event }) // automatically use context values
      });

      const text = await response.text(); // parse as text first to debug HTML errors
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON from backend:', text);
        setRecommendations('Failed to fetch AI recommendations.');
        return;
      }

      setRecommendations(data.recommendations);

    } catch (err) {
      console.error(err);
      setRecommendations('Failed to fetch AI recommendations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title="Get AI Recommendations"
        onPress={fetchAiRecommendations}
        disabled={!fplId || !event || loading} // prevent click if no FPL ID
      />
      {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 10 }} />}
      <ScrollView style={{ marginTop: 10 }}>
        <Text>{recommendations}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, marginTop: 40 }
});

export default AiScreen;
