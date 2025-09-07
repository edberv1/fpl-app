import React, { useContext, useState } from 'react';
import { View, Text, Button, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { FplContext } from '../contexts/FplContext';

const AiScreen = () => {
  const { fplId, event, bank } = useContext(FplContext);
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
        body: JSON.stringify({ fplId, lastEvent: event, bank })
      });

      const text = await response.text();
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

  // Split recommendations into lines for better display
  const renderRecommendations = () => {
    if (!recommendations) return null;

    const sections = recommendations.split('\n').filter(line => line.trim() !== '');
    return sections.map((line, index) => {
      let style = styles.text;
      if (line.toLowerCase().includes('captain')) style = styles.captainText;
      if (line.toLowerCase().includes('vice-captain')) style = styles.viceCaptainText;
      if (line.toLowerCase().includes('transfer')) style = styles.transferText;
      return (
        <Text key={index} style={style}>
          {line}
        </Text>
      );
    });
  };

  return (
    <View style={styles.container}>
      <Button
        title="Get AI Recommendations"
        onPress={fetchAiRecommendations}
        disabled={!fplId || !event || loading}
        color="#1E90FF"
      />

      {loading && <ActivityIndicator size="large" color="#1E90FF" style={{ marginVertical: 20 }} />}

      <ScrollView style={styles.scrollContainer}>
        {recommendations ? (
          <View style={styles.card}>
            {renderRecommendations()}
          </View>
        ) : (
          !loading && <Text style={styles.placeholderText}>Press the button to get AI recommendations.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, marginTop: 40, backgroundColor: '#f0f2f5' },
  scrollContainer: { marginTop: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  text: { fontSize: 16, marginBottom: 6, color: '#333' },
  transferText: { fontSize: 16, marginBottom: 6, color: '#FF4500', fontWeight: 'bold' },
  captainText: { fontSize: 16, marginBottom: 6, color: '#32CD32', fontWeight: 'bold' },
  viceCaptainText: { fontSize: 16, marginBottom: 6, color: '#FFA500', fontWeight: 'bold' },
  placeholderText: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 20 }
});

export default AiScreen;
