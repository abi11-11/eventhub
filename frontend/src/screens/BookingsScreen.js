import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Surface } from 'react-native-paper';
import { useAuthStore } from '../store';
import { getUserBookings } from '../services/api-service';
import EmptyState from '../components/EmptyState';

const STATUS_COLOR = {
  confirmed: '#4CAF50',
  pending: '#FF9800',
  cancelled: '#F44336',
  waitlist: '#9C27B0',
};

/**
 * BookingsScreen
 * Displays the authenticated user's event bookings.
 */
export default function BookingsScreen() {
  const { isAuthenticated } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadBookings = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const response = await getUserBookings();
      // Backend returns { success, data: [...], meta }
      const data = response?.data ?? response ?? [];
      setBookings(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('❌ BookingsScreen: Failed to load bookings', err);
      setError('Failed to load bookings. Pull down to refresh.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadBookings();
  }, [isAuthenticated, loadBookings]);

  const renderBooking = ({ item }) => {
    const statusColor = STATUS_COLOR[item.rsvp_status] || '#666';
    const eventTitle = item.event?.title || `Event #${String(item.event_id || '').slice(0, 8)}`;
    const eventDate = item.event?.event_date
      ? new Date(item.event.event_date).toLocaleDateString('en-IN', {
          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
        })
      : null;

    return (
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.eventTitle} numberOfLines={2}>
            {eventTitle}
          </Text>
          <View style={styles.row}>
            <Chip
              compact
              style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}
              textStyle={{ color: statusColor, fontSize: 11 }}
            >
              {item.rsvp_status || 'confirmed'}
            </Chip>
            <Text variant="labelSmall" style={styles.amount}>
              {item.amount_paid > 0 ? `₹${item.amount_paid}` : '🆓 Free'}
            </Text>
          </View>
          {!!eventDate && (
            <Text variant="bodySmall" style={styles.date}>📅 {eventDate}</Text>
          )}
          {item.attended && (
            <Text variant="bodySmall" style={styles.attended}>✅ Attended</Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Surface style={styles.container}>
      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={bookings.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="🎫"
            title="No Bookings Yet"
            message={error || 'Events you join will appear here.'}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadBookings(true)}
          />
        }
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  emptyContainer: { flexGrow: 1 },
  card: { marginBottom: 12, borderRadius: 12 },
  eventTitle: { fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  statusChip: { borderRadius: 8 },
  amount: { color: '#666' },
  date: { color: '#888', marginTop: 4 },
  attended: { color: '#4CAF50', marginTop: 4 },
});
