import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const MOCK_EVENTS = [
  { id: '1', title: 'Morning Yoga', location: 'Bangalore', capacity: 20 },
  { id: '2', title: 'Football Match', location: 'Bangalore', capacity: 11 },
  { id: '3', title: 'Book Reading Club', location: 'Bangalore', capacity: 25 },
];

export default function HomeScreen() {
  const renderEventCard = ({ item }) => (
    <View style={styles.eventCard}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDetails}>{item.location} • {item.capacity} spots</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>EventHub</Text>
      </View>
      
      <FlatList
        data={MOCK_EVENTS}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  listContent: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  eventDetails: {
    fontSize: 12,
    color: '#666',
  },
});
