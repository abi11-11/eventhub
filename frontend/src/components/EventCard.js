import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, Chip, useTheme } from 'react-native-paper';

const STATUS_COLOR = {
  published: '#4CAF50',
  live: '#2196F3',
  completed: '#9E9E9E',
  cancelled: '#F44336',
  draft: '#FF9800',
};

/**
 * EventCard
 * Reusable M3 card for displaying event summary in lists.
 *
 * @param {object} event    - Event object from API
 * @param {function} onPress - Tap handler
 */
export default function EventCard({ event, onPress }) {
  const theme = useTheme();
  const statusColor = STATUS_COLOR[event?.status] || theme.colors.primary;

  const formattedDate = event?.event_date
    ? new Date(event.event_date).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    : null;

  return (
    <Card
      style={styles.card}
      mode="elevated"
      onPress={onPress}
    >
      <Card.Content>
        <View style={styles.header}>
          <Text
            variant="titleMedium"
            style={styles.title}
            numberOfLines={2}
          >
            {event?.title || 'Untitled Event'}
          </Text>
          <Chip
            compact
            style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}
            textStyle={{ color: statusColor, fontSize: 11 }}
          >
            {event?.status || 'published'}
          </Chip>
        </View>

        {!!event?.event_type && (
          <Text variant="labelMedium" style={[styles.meta, { color: theme.colors.primary }]}>
            🏷 {event.event_type}
          </Text>
        )}

        <View style={styles.details}>
          {!!formattedDate && (
            <Text variant="bodySmall" style={styles.detail}>📅 {formattedDate}</Text>
          )}
          {!!event?.start_time && (
            <Text variant="bodySmall" style={styles.detail}>🕐 {event.start_time}</Text>
          )}
          {!!event?.venue_name && (
            <Text variant="bodySmall" style={styles.detail} numberOfLines={1}>
              📍 {event.venue_name}
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <Text variant="labelSmall" style={styles.capacity}>
            👥 {event?.max_players || '?'} max
          </Text>
          <Text variant="labelSmall" style={[styles.price, { color: theme.colors.primary }]}>
            {event?.entry_fee_type === 'free'
              ? '🆓 Free'
              : `₹${event?.entry_fee_amount || 0}`}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  title: {
    flex: 1,
    fontWeight: '600',
  },
  statusChip: {
    borderRadius: 8,
  },
  meta: {
    marginBottom: 8,
  },
  details: {
    gap: 3,
    marginBottom: 8,
  },
  detail: {
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  capacity: {
    color: '#888',
  },
  price: {
    fontWeight: '600',
  },
});
