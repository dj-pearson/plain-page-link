/**
 * Public Profile Screen
 * Pure JavaScript implementation
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { dbService } from '../../services/supabase';

export default function PublicProfileScreen({ route }) {
  const { username } = route.params;
  const [profile, setProfile] = useState(null);
  const [links, setLinks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      // In a real app, you'd fetch by username
      // For now, we'll use the user ID passed as username
      const { data: profileData } = await dbService.getUserProfile(username);
      setProfile(profileData);

      if (profileData) {
        const { data: linksData } = await dbService.getUserLinks(username);
        setLinks(linksData || []);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkPress = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error("Don't know how to open URI:", url);
      }
    } catch (error) {
      console.error('Error opening link:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {profile.avatar_url ? (
          <Image
            source={{ uri: profile.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {(profile.display_name || profile.username || 'U')[0].toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.displayName}>
          {profile.display_name || profile.username}
        </Text>
        {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
      </View>

      <View style={styles.linksContainer}>
        {links.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No links yet</Text>
          </View>
        ) : (
          links.map((link) => (
            <TouchableOpacity
              key={link.id}
              style={styles.linkButton}
              onPress={() => handleLinkPress(link.url)}
            >
              <Text style={styles.linkButtonText}>{link.title}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by AgentBio</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#6366f1',
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: '#e0e7ff',
    textAlign: 'center',
  },
  linksContainer: {
    padding: 16,
  },
  linkButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
