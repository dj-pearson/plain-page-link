/**
 * Dashboard Overview Screen
 * Pure JavaScript implementation
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { authService, dbService } from '../../services/supabase';

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ links: 0, views: 0, clicks: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    try {
      // Get current user
      const { user: currentUser } = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);

        // Get user profile
        const { data: profileData } = await dbService.getUserProfile(currentUser.id);
        setProfile(profileData);

        // Get user links
        const { data: linksData } = await dbService.getUserLinks(currentUser.id);
        const linkCount = linksData?.length || 0;

        // Calculate stats (placeholder for now)
        setStats({
          links: linkCount,
          views: 0, // You can fetch this from analytics
          clicks: 0, // You can fetch this from analytics
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back!</Text>
        <Text style={styles.username}>
          {profile?.username || user?.email || 'User'}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.links}</Text>
          <Text style={styles.statLabel}>Links</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.views}</Text>
          <Text style={styles.statLabel}>Views</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.clicks}</Text>
          <Text style={styles.statLabel}>Clicks</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Links')}
        >
          <Text style={styles.actionButtonText}>Manage Links</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.actionButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Analytics')}
        >
          <Text style={styles.actionButtonText}>View Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() =>
            navigation.navigate('PublicProfile', {
              username: profile?.username || user?.id,
            })
          }
        >
          <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
            Preview My Page
          </Text>
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
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#6366f1',
    padding: 24,
    paddingTop: 48,
  },
  greeting: {
    fontSize: 16,
    color: '#e0e7ff',
    marginBottom: 4,
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#6366f1',
  },
});
