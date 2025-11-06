/**
 * Profile Screen
 * Pure JavaScript implementation
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { authService, dbService } from '../../services/supabase';

export default function ProfileScreen() {
  const [profile, setProfile] = useState({
    username: '',
    display_name: '',
    bio: '',
    avatar_url: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { user } = await authService.getCurrentUser();
      if (user) {
        const { data } = await dbService.getUserProfile(user.id);
        if (data) {
          setProfile({
            username: data.username || '',
            display_name: data.display_name || '',
            bio: data.bio || '',
            avatar_url: data.avatar_url || '',
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { user } = await authService.getCurrentUser();
      if (user) {
        await dbService.updateUserProfile(user.id, profile);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Profile</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={profile.username}
            onChangeText={(text) =>
              setProfile({ ...profile, username: text })
            }
            placeholder="Enter username"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={profile.display_name}
            onChangeText={(text) =>
              setProfile({ ...profile, display_name: text })
            }
            placeholder="Enter display name"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={profile.bio}
            onChangeText={(text) => setProfile({ ...profile, bio: text })}
            placeholder="Tell us about yourself"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Avatar URL</Text>
          <TextInput
            style={styles.input}
            value={profile.avatar_url}
            onChangeText={(text) =>
              setProfile({ ...profile, avatar_url: text })
            }
            placeholder="https://..."
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
