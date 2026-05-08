import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  Avatar,
  Surface,
  Divider,
  useTheme,
} from 'react-native-paper';
import { useAuthStore } from '../store';
import { updateUserProfile } from '../services/api-service';

/**
 * ProfileScreen
 * Displays and allows editing of the authenticated user's profile.
 */
export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuthStore();
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: user?.firstName || '',
    last_name: user?.lastName || '',
    email: user?.email || '',
    bio: user?.bio || '',
  });

  const initials =
    `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || '?';

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await updateUserProfile(form);
      const updated = response?.data || response;
      updateProfile({
        firstName: updated?.first_name || form.first_name,
        lastName: updated?.last_name || form.last_name,
        email: updated?.email || form.email,
        bio: updated?.bio || form.bio,
      });
      setIsEditing(false);
    } catch (err) {
      Alert.alert('Update Failed', err.message || 'Could not update profile. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <Surface style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar + Name */}
        <View style={styles.header}>
          <Avatar.Text
            size={80}
            label={initials}
            style={{ backgroundColor: theme.colors.primary }}
          />
          <Text variant="headlineSmall" style={styles.name}>
            {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Your Profile'}
          </Text>
          <Text variant="bodyMedium" style={styles.phone}>
            📱 {user?.phoneNumber || 'No phone number'}
          </Text>
          {user?.isVerified && (
            <Text variant="labelMedium" style={styles.verified}>✅ Verified</Text>
          )}
        </View>

        <Divider style={styles.divider} />

        {/* Profile Card */}
        <Card style={styles.card} mode="elevated">
          <Card.Title
            title="Profile Information"
            right={() =>
              !isEditing ? (
                <Button onPress={() => setIsEditing(true)} compact style={styles.editBtn}>
                  Edit
                </Button>
              ) : null
            }
          />
          <Card.Content>
            {isEditing ? (
              <View>
                <TextInput
                  label="First Name"
                  value={form.first_name}
                  onChangeText={(v) => setForm((p) => ({ ...p, first_name: v }))}
                  mode="outlined"
                  style={styles.input}
                />
                <TextInput
                  label="Last Name"
                  value={form.last_name}
                  onChangeText={(v) => setForm((p) => ({ ...p, last_name: v }))}
                  mode="outlined"
                  style={styles.input}
                />
                <TextInput
                  label="Email"
                  value={form.email}
                  onChangeText={(v) => setForm((p) => ({ ...p, email: v }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  mode="outlined"
                  style={styles.input}
                />
                <TextInput
                  label="Bio"
                  value={form.bio}
                  onChangeText={(v) => setForm((p) => ({ ...p, bio: v }))}
                  multiline
                  numberOfLines={3}
                  mode="outlined"
                  style={styles.input}
                />
                <View style={styles.buttonRow}>
                  <Button
                    mode="outlined"
                    onPress={() => setIsEditing(false)}
                    style={styles.btn}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={isSaving}
                    disabled={isSaving}
                    style={styles.btn}
                  >
                    Save
                  </Button>
                </View>
              </View>
            ) : (
              <View>
                <InfoRow label="Email" value={user?.email || 'Not set'} />
                <InfoRow label="Bio" value={user?.bio || 'No bio yet'} />
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Sign Out */}
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutBtn}
          textColor="#F44336"
          icon="logout"
        >
          Sign Out
        </Button>
      </ScrollView>
    </Surface>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={infoRowStyles.container}>
      <Text variant="labelMedium" style={infoRowStyles.label}>{label}</Text>
      <Text variant="bodyMedium" style={infoRowStyles.value}>{value}</Text>
    </View>
  );
}

const infoRowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  label: { color: '#888' },
  value: { flex: 1, textAlign: 'right', color: '#333' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 16 },
  header: { alignItems: 'center', paddingVertical: 24 },
  name: { fontWeight: '700', marginTop: 12 },
  phone: { color: '#666', marginTop: 4 },
  verified: { color: '#4CAF50', marginTop: 4 },
  divider: { marginBottom: 16 },
  card: { borderRadius: 12, marginBottom: 16 },
  editBtn: { marginRight: 8 },
  input: { marginBottom: 12 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  btn: { flex: 1 },
  logoutBtn: { borderColor: '#F44336', marginTop: 8 },
});
