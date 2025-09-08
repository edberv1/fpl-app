import React, { useContext, useState } from 'react';
import { View, Text, Button, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { FplContext } from '../contexts/FplContext';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const AiScreen = () => {
  const { fplId, event, bank } = useContext(FplContext);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  const fetchAiRecommendations = async () => {
    if (!fplId || !event) {
      setRecommendations({ notes: 'FPL ID or current event not available.' });
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
        setRecommendations({ notes: 'Failed to fetch AI recommendations.' });
        return;
      }

      setRecommendations(data.recommendations);
    } catch (err) {
      console.error(err);
      setRecommendations({ notes: 'Failed to fetch AI recommendations.' });
    } finally {
      setLoading(false);
    }
  };

  const renderCard = (title, icon, color, content) => (
    <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 5 }]}>
      <View style={styles.cardHeader}>
        {icon}
        <Text style={[styles.cardTitle, { color }]}>{title}</Text>
      </View>
      <View>
        {Array.isArray(content)
          ? content.map((item, index) => <Text key={index} style={styles.cardContent}>• {item}</Text>)
          : <Text style={styles.cardContent}>{content}</Text>}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Button
        title="Get AI Recommendations"
        onPress={fetchAiRecommendations}
        disabled={!fplId || !event || loading}
        color="#1E90FF"
      />

      {loading && <ActivityIndicator size="large" color="#1E90FF" style={{ marginVertical: 20 }} />}

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {recommendations ? (
          <>
            {recommendations.out?.length > 0 && renderCard(
              'Transfers OUT',
              <MaterialCommunityIcons name="arrow-up-bold-box-outline" size={22} color="#FF4500" />,
              '#FF4500',
              recommendations.out
            )}
            {recommendations.in?.length > 0 && renderCard(
              'Transfers IN',
              <MaterialCommunityIcons name="arrow-down-bold-box-outline" size={22} color="#32CD32" />,
              '#32CD32',
              recommendations.in
            )}
            {(recommendations.captain || recommendations.viceCaptain) && renderCard(
              'Captaincy',
              <Ionicons name="flash" size={22} color="#FFA500" />,
              '#FFA500',
              [
                `Captain: ${recommendations.captain || '-'}`,
                `Vice-Captain: ${recommendations.viceCaptain || '-'}`
              ]
            )}
            {recommendations.chips?.length > 0 && renderCard(
              'Chips',
              <Ionicons name="ribbon" size={22} color="#8A2BE2" />,
              '#8A2BE2',
              recommendations.chips
            )}
            {recommendations.notes && renderCard(
              'Additional Notes',
              <Ionicons name="information-circle" size={22} color="#333" />,
              '#333',
              recommendations.notes
            )}
          </>
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
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  cardContent: { fontSize: 16, color: '#333', lineHeight: 22, marginBottom: 4 },
  placeholderText: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 20 },
});

export default AiScreen;
