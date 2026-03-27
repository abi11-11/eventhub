import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SectionList,
  TextInput,
} from 'react-native';
import { useAuthStore, useEventStore, useUIStore } from '../store';
import { getEvents } from '../services/api-service';

/**
 * HomeScreen
 * Main events discovery screen
 * Shows events, filters, and user recommendations
 */

// Mock events data for demonstration
const MOCK_EVENTS = [
  {
    id: '1',
    title: 'Morning Yoga Session',
    location: 'Bangalore',
    distance: 2.5,
    capacity: 20,
    enrolled: 12,
    type: 'fitness',
    skillLevel: 'beginner',
    image: '🧘',
  },
  {
    id: '2',
    title: 'Football Match',
    location: 'Bangalore',
    distance: 5,
    capacity: 11,
    enrolled: 9,
    type: 'sports',
    skillLevel: 'intermediate',
    image: '⚽',
  },
  {
    id: '3',
    title: 'Book Reading Club',
    location: 'Bangalore',
    distance: 3.2,
    capacity: 25,
    enrolled: 8,
    type: 'social',
    skillLevel: 'beginner',
    image: '📚',
  },
  {
    id: '4',
    title: 'React Native Workshop',
    location: 'Bangalore',
    distance: 4.1,
    capacity: 30,
    enrolled: 22,
    type: 'workshop',
    skillLevel: 'intermediate',
    image: '💻',
  },
];

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuthStore();
  const { events, setEvents, filteredEvents, setFilteredEvents, isLoading, setIsLoading, filters, setFilters, applyFilters } = useEventStore();
  const { showToast } = useUIStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Load events on component mount
   */
  useEffect(() => {
    loadEvents();
  }, []);

  /**
   * Apply filters when they change
   */
  useEffect(() => {
    if (events.length > 0) {
      applyFilters(events, { ...filters, searchQuery });
    }
  }, [filters, searchQuery]);

  /**
   * Fetch events from API (or use mock data)
   */
  const loadEvents = async () => {
    setIsLoading(true);
    try {
      // Try to fetch from API, fall back to mock data
      // For now, use mock data
      console.log('🔵 HomeScreen: Loading events...');
      setEvents(MOCK_EVENTS);
      applyFilters(MOCK_EVENTS, filters);
      console.log('✅ HomeScreen: Events loaded');
    } catch (error) {
      console.error('❌ HomeScreen: Failed to load events', error);
      showToast('Failed to load events. Showing cached events.', 'warning');
      // Fall back to mock data
      setEvents(MOCK_EVENTS);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh events
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  /**
   * Handle event card press
   */
  const handleEventPress = (event) => {
    console.log('🔵 HomeScreen: Selected event', event.id);
    // TODO: Navigate to event details screen
    showToast(`Selected: ${event.title}`, 'info');
  };

  /**
   * Render event card
   */
  const renderEventCard = ({ item }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => handleEventPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.eventCardContent}>
        <View style={styles.eventIcon}>
          <Text style={styles.eventImage}>{item.image}</Text>
        </View>
        
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.eventLocation}>
            📍 {item.location} • {item.distance}km away
          </Text>
          <View style={styles.eventMetaRow}>
            <Text style={styles.eventMeta}>
              👥 {item.enrolled}/{item.capacity}
            </Text>
            <Text style={styles.eventType}>{item.type}</Text>
          </View>
        </View>
        
        <View style={styles.eventArrow}>
          <Text style={styles.arrow}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  /**
   * Render section header
   */
  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  /**
   * Prepare section data
   */
  const sections = [
    {
      title: 'Nearby Events',
      data: filteredEvents.slice(0, 2),
    },
    {
      title: 'More Events',
      data: filteredEvents.slice(2),
    },
  ].filter((section) => section.data.length > 0);

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateEmoji}>🎉</Text>
      <Text style={styles.emptyStateTitle}>No events found</Text>
      <Text style={styles.emptyStateText}>
        Try adjusting your filters or check back later
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.firstName || 'Friend'}! 👋</Text>
          <Text style={styles.subheading}>Discover events near you</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          placeholderTextColor="#bdc3c7"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      {/* Filters (TODO: Implement filter UI) */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterChip, !filters.eventType && styles.filterChipActive]}
          onPress={() => setFilters({ ...filters, eventType: '' })}
        >
          <Text style={styles.filterChipText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filters.eventType === 'sports' && styles.filterChipActive]}
          onPress={() => setFilters({ ...filters, eventType: 'sports' })}
        >
          <Text style={styles.filterChipText}>⚽ Sports</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filters.eventType === 'fitness' && styles.filterChipActive]}
          onPress={() => setFilters({ ...filters, eventType: 'fitness' })}
        >
          <Text style={styles.filterChipText}>🧘 Fitness</Text>
        </TouchableOpacity>
      </View>

      {/* Events List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : filteredEvents.length === 0 ? (
        renderEmptyState()
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderEventCard}
          renderSectionHeader={renderSectionHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#3498db"
            />
          }
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      )}
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
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e74c3c',
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  searchIcon: {
    marginLeft: 12,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  eventCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  eventCardContent: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  eventIcon: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventImage: {
    fontSize: 28,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 6,
  },
  eventMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eventMeta: {
    fontSize: 12,
    color: '#666',
  },
  eventType: {
    fontSize: 11,
    color: '#fff',
    backgroundColor: '#3498db',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  eventArrow: {
    marginLeft: 8,
  },
  arrow: {
    fontSize: 24,
    color: '#bdc3c7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#7f8c8d',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});
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
