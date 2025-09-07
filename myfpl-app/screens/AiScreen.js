import React, { useContext, useState } from 'react';
import { View, Text, Button, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { FplContext } from '../contexts/FplContext';

const AiScreen = () => {
  const { team, event } = useContext(FplContext);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState('');

  const fetchAiRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://192.168.1.5:5000/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team, currentEvent: event })
      });
      const data = await response.json();
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
      <Button title="Get AI Recommendations" onPress={fetchAiRecommendations} />
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
