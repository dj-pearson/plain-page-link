/**
 * Links Management Screen
 * Pure JavaScript implementation
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { authService, dbService } from '../../services/supabase';

export default function LinksScreen() {
  const [links, setLinks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [formData, setFormData] = useState({ title: '', url: '' });

  const loadLinks = async () => {
    try {
      const { user } = await authService.getCurrentUser();
      if (user) {
        const { data } = await dbService.getUserLinks(user.id);
        setLinks(data || []);
      }
    } catch (error) {
      console.error('Error loading links:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const handleAddLink = () => {
    setEditingLink(null);
    setFormData({ title: '', url: '' });
    setModalVisible(true);
  };

  const handleEditLink = (link) => {
    setEditingLink(link);
    setFormData({ title: link.title, url: link.url });
    setModalVisible(true);
  };

  const handleSaveLink = async () => {
    if (!formData.title || !formData.url) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const { user } = await authService.getCurrentUser();
      if (!user) return;

      if (editingLink) {
        // Update existing link
        await dbService.updateLink(editingLink.id, formData);
        Alert.alert('Success', 'Link updated successfully');
      } else {
        // Create new link
        await dbService.createLink({
          ...formData,
          user_id: user.id,
          order: links.length,
        });
        Alert.alert('Success', 'Link created successfully');
      }

      setModalVisible(false);
      loadLinks();
    } catch (error) {
      Alert.alert('Error', 'Failed to save link');
      console.error(error);
    }
  };

  const handleDeleteLink = (link) => {
    Alert.alert(
      'Delete Link',
      'Are you sure you want to delete this link?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dbService.deleteLink(link.id);
              Alert.alert('Success', 'Link deleted successfully');
              loadLinks();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete link');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const renderLink = ({ item }) => (
    <View style={styles.linkCard}>
      <View style={styles.linkInfo}>
        <Text style={styles.linkTitle}>{item.title}</Text>
        <Text style={styles.linkUrl}>{item.url}</Text>
      </View>
      <View style={styles.linkActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditLink(item)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteLink(item)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Links</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddLink}>
          <Text style={styles.addButtonText}>+ Add Link</Text>
        </TouchableOpacity>
      </View>

      {links.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No links yet</Text>
          <Text style={styles.emptySubtext}>
            Tap "Add Link" to create your first link
          </Text>
        </View>
      ) : (
        <FlatList
          data={links}
          renderItem={renderLink}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingLink ? 'Edit Link' : 'Add New Link'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Link Title"
              value={formData.title}
              onChangeText={(text) =>
                setFormData({ ...formData, title: text })
              }
            />

            <TextInput
              style={styles.input}
              placeholder="URL (https://...)"
              value={formData.url}
              onChangeText={(text) => setFormData({ ...formData, url: text })}
              autoCapitalize="none"
              keyboardType="url"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveLink}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  linkCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  linkInfo: {
    marginBottom: 12,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  linkUrl: {
    fontSize: 14,
    color: '#6b7280',
  },
  linkActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#6366f1',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
