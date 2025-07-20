import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { MessageSquare, Plus, MapPin, Clock, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, User, Send } from 'lucide-react-native';

interface Update {
  id: string;
  author: string;
  role: 'citizen' | 'official' | 'responder';
  content: string;
  location: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  verified: boolean;
  category: 'road_closure' | 'fire_sighting' | 'evacuation' | 'safety' | 'resources';
  likes: number;
  reports: number;
}

export default function UpdatesScreen() {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isComposing, setIsComposing] = useState(false);
  const [newUpdate, setNewUpdate] = useState({
    content: '',
    category: 'safety' as Update['category'],
    location: '',
  });

  useEffect(() => {
    loadUpdates();
  }, []);

  const loadUpdates = async () => {
    // Simulate API call to get community updates
    const mockUpdates: Update[] = [
      {
        id: '1',
        author: 'LA Fire Department',
        role: 'official',
        content: 'Palisades Fire containment increased to 23%. Evacuation orders remain in effect for zones A-C. Residents in zone D should prepare for possible evacuation.',
        location: 'Pacific Palisades',
        latitude: 34.0522,
        longitude: -118.2437,
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        verified: true,
        category: 'evacuation',
        likes: 156,
        reports: 0,
      },
      {
        id: '2',
        author: 'Sarah Martinez',
        role: 'citizen',
        content: 'PCH is completely blocked between Topanga and Malibu Canyon. Emergency vehicles only. Heavy smoke, zero visibility.',
        location: 'Pacific Coast Highway',
        latitude: 34.0359,
        longitude: -118.6847,
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        verified: true,
        category: 'road_closure',
        likes: 89,
        reports: 2,
      },
      {
        id: '3',
        author: 'Emergency Responder',
        role: 'responder',
        content: 'New spot fire reported near Will Rogers State Park. Crews are responding. Hikers should evacuate the area immediately.',
        location: 'Will Rogers State Park',
        latitude: 34.0522,
        longitude: -118.5014,
        timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        verified: true,
        category: 'fire_sighting',
        likes: 203,
        reports: 0,
      },
      {
        id: '4',
        author: 'Mike Chen',
        role: 'citizen',
        content: 'Santa Monica Civic Center shelter has space available. They have pet accommodations and medical support on site.',
        location: 'Santa Monica',
        latitude: 34.0195,
        longitude: -118.4912,
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        verified: false,
        category: 'resources',
        likes: 67,
        reports: 0,
      },
    ];
    setUpdates(mockUpdates);
  };

  const categories = [
    { key: 'all', label: 'All Updates', icon: MessageSquare },
    { key: 'evacuation', label: 'Evacuation', icon: AlertTriangle },
    { key: 'road_closure', label: 'Road Closures', icon: MapPin },
    { key: 'fire_sighting', label: 'Fire Sightings', icon: AlertTriangle },
    { key: 'safety', label: 'Safety', icon: CheckCircle },
    { key: 'resources', label: 'Resources', icon: CheckCircle },
  ];

  const getRoleColor = (role: Update['role']) => {
    switch (role) {
      case 'official': return '#3B82F6';
      case 'responder': return '#10B981';
      case 'citizen': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getCategoryColor = (category: Update['category']) => {
    switch (category) {
      case 'evacuation': return '#DC2626';
      case 'road_closure': return '#EA580C';
      case 'fire_sighting': return '#EF4444';
      case 'safety': return '#22C55E';
      case 'resources': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const handleSubmitUpdate = () => {
    if (!newUpdate.content.trim()) {
      Alert.alert('Error', 'Please enter update content');
      return;
    }

    const update: Update = {
      id: Date.now().toString(),
      author: 'You',
      role: 'citizen',
      content: newUpdate.content,
      location: newUpdate.location || 'Your Location',
      latitude: 34.0522,
      longitude: -118.2437,
      timestamp: new Date().toISOString(),
      verified: false,
      category: newUpdate.category,
      likes: 0,
      reports: 0,
    };

    setUpdates(prev => [update, ...prev]);
    setNewUpdate({ content: '', category: 'safety', location: '' });
    setIsComposing(false);
    
    Alert.alert('Success', 'Your update has been posted and is pending verification.');
  };

  const filteredUpdates = selectedCategory === 'all' 
    ? updates 
    : updates.filter(update => update.category === selectedCategory);

  const timeAgo = (timestamp: string) => {
    const now = new Date().getTime();
    const updateTime = new Date(timestamp).getTime();
    const diffMinutes = Math.floor((now - updateTime) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Community Updates</Text>
        <TouchableOpacity
          style={styles.composeButton}
          onPress={() => setIsComposing(true)}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        style={styles.categorySelector}
        showsHorizontalScrollIndicator={false}
      >
        {categories.map((category) => {
          const IconComponent = category.icon;
          return (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryButton,
                selectedCategory === category.key && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.key)}
            >
              <IconComponent 
                size={16} 
                color={selectedCategory === category.key ? '#FFFFFF' : '#666'} 
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.key && styles.categoryTextActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isComposing && (
        <View style={styles.composeCard}>
          <Text style={styles.composeTitle}>Post Update</Text>
          
          <View style={styles.categoryPicker}>
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.slice(1).map((category) => (
                <TouchableOpacity
                  key={category.key}
                  style={[
                    styles.categoryChip,
                    newUpdate.category === category.key && styles.categoryChipActive,
                  ]}
                  onPress={() => setNewUpdate(prev => ({ ...prev, category: category.key as Update['category'] }))}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      newUpdate.category === category.key && styles.categoryChipTextActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Location (Optional)</Text>
            <TextInput
              style={styles.locationInput}
              value={newUpdate.location}
              onChangeText={(text) => setNewUpdate(prev => ({ ...prev, location: text }))}
              placeholder="Enter location..."
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Update Content</Text>
            <TextInput
              style={styles.contentInput}
              value={newUpdate.content}
              onChangeText={(text) => setNewUpdate(prev => ({ ...prev, content: text }))}
              placeholder="What's happening in your area? Be specific and factual..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.composeActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsComposing(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitUpdate}
            >
              <Send size={16} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Post Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.updatesList} showsVerticalScrollIndicator={false}>
        {filteredUpdates.map((update) => (
          <View key={update.id} style={styles.updateCard}>
            <View style={styles.updateHeader}>
              <View style={styles.authorInfo}>
                <View style={[styles.roleIndicator, { backgroundColor: getRoleColor(update.role) }]}>
                  <User size={16} color="#FFFFFF" />
                </View>
                <View style={styles.authorDetails}>
                  <View style={styles.authorNameRow}>
                    <Text style={styles.authorName}>{update.author}</Text>
                    {update.verified && (
                      <CheckCircle size={16} color="#22C55E" />
                    )}
                  </View>
                  <Text style={styles.authorRole}>{update.role.charAt(0).toUpperCase() + update.role.slice(1)}</Text>
                </View>
              </View>
              <Text style={styles.timestamp}>{timeAgo(update.timestamp)}</Text>
            </View>

            <View style={styles.updateContent}>
              <View style={styles.categoryBadge}>
                <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(update.category) }]} />
                <Text style={styles.categoryLabel}>
                  {update.category.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              
              <Text style={styles.updateText}>{update.content}</Text>

              {update.location && (
                <View style={styles.locationInfo}>
                  <MapPin size={14} color="#888" />
                  <Text style={styles.locationText}>{update.location}</Text>
                </View>
              )}
            </View>

            <View style={styles.updateActions}>
              <TouchableOpacity style={styles.actionItem}>
                <Text style={styles.actionCount}>{update.likes}</Text>
                <Text style={styles.actionLabel}>Helpful</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionItem}>
                <MapPin size={16} color="#666" />
                <Text style={styles.actionLabel}>View on Map</Text>
              </TouchableOpacity>

              {update.reports > 0 && (
                <TouchableOpacity style={styles.actionItem}>
                  <AlertTriangle size={16} color="#EAB308" />
                  <Text style={styles.actionLabel}>{update.reports} reports</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  composeButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categorySelector: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    maxHeight: 60,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333',
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  categoryText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  composeCard: {
    backgroundColor: '#1A1A1A',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  composeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  categoryPicker: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  categoryChip: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#FF6B35',
  },
  categoryChipText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 16,
  },
  locationInput: {
    backgroundColor: '#2A2A2A',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#FFFFFF',
  },
  contentInput: {
    backgroundColor: '#2A2A2A',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  composeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  updatesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  updateCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  roleIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorDetails: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  authorRole: {
    fontSize: 12,
    color: '#888',
    textTransform: 'capitalize',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  updateContent: {
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  updateText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#888',
  },
  updateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  actionLabel: {
    fontSize: 12,
    color: '#666',
  },
});