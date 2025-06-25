import React, { useContext, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import { FplContext } from '../contexts/FplContext';

const TeamScreen = () => {
  const { team, event } = useContext(FplContext);

  if (!team || team.length === 0 || event === null) {
    return (
      <View style={styles.centered}>
        <Text>Loading team...</Text>
      </View>
    );
  }

  const starters = team.filter(player => player.multiplier > 0);
  const bench = team.filter(player => player.multiplier === 0);

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
            source={require('../assets/shirt.png')} // Replace with your actual path
            style={styles.shirtImage}
          />
          <Text style={styles.playerName}>
            {player.name.split(' ').slice(-1)[0]} {player.multiplier > 1 ? '(C)' : ''}
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
              source={require('../assets/shirt.png')} // Replace with your actual path
              style={styles.benchImage}
            />
            <Text style={styles.benchName}>
              {player.name.split(' ').slice(-1)[0]}
            </Text>
            <Text style={styles.benchPoints}>{player.event_points} pts</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Gameweek {event} – Total Points: {totalPoints}</Text>

      {renderRow(getPlayersByPosition('Goalkeeper'))}
      {renderRow(getPlayersByPosition('Defender'))}
      {renderRow(getPlayersByPosition('Midfielder'))}
      {renderRow(getPlayersByPosition('Forward'))}

      {renderBench()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 16 },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  playerBox: {
    alignItems: 'center',
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
    fontWeight: '500',
  },
  points: {
    fontSize: 12,
    color: '#444',
  },
  benchSection: {
    marginTop: 20,
    borderTopColor: '#ccc',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  benchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  benchPlayerBox: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  benchImage: {
    width: 30,
    height: 30,
    marginBottom: 4,
  },
  benchName: {
    fontSize: 12,
    fontWeight: '500',
  },
  benchPoints: {
    fontSize: 12,
    color: '#666',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TeamScreen;
