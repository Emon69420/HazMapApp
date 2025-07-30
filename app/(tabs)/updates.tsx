import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { MessageSquare, MapPin, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, User, Flame, Shield, Info } from 'lucide-react-native';

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
  const [selectedTab, setSelectedTab] = useState<'prevention' | 'updates'>('prevention');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (selectedTab === 'updates') {
      loadUpdates();
    }
  }, [selectedTab]);

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

  const renderPreventionContent = () => (
    <ScrollView style={styles.contentArea} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Flame size={24} color="#FF6B35" />
          <Text style={styles.sectionTitle}>Preventing Wildfires</Text>
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Home Safety</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• Clear leaves and debris from gutters and roof</Text>
            <Text style={styles.infoItem}>• Remove dead vegetation within 30 feet of your home</Text>
            <Text style={styles.infoItem}>• Keep grass cut to 4 inches or less</Text>
            <Text style={styles.infoItem}>• Store firewood at least 30 feet from your house</Text>
            <Text style={styles.infoItem}>• Use fire-resistant building materials</Text>
            <Text style={styles.infoItem}>• Install ember-resistant vents</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Outdoor Activities</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• Never leave campfires unattended</Text>
            <Text style={styles.infoItem}>• Extinguish fires completely with water</Text>
            <Text style={styles.infoItem}>• Don't use fireworks in dry conditions</Text>
            <Text style={styles.infoItem}>• Avoid parking on dry grass</Text>
            <Text style={styles.infoItem}>• Check for fire restrictions before outdoor activities</Text>
            <Text style={styles.infoItem}>• Report suspicious smoke immediately</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Vehicle Safety</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• Maintain your vehicle to prevent sparks</Text>
            <Text style={styles.infoItem}>• Don't drive over dry grass</Text>
            <Text style={styles.infoItem}>• Secure trailer chains to prevent dragging</Text>
            <Text style={styles.infoItem}>• Check tire pressure regularly</Text>
            <Text style={styles.infoItem}>• Never throw cigarettes from vehicles</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Shield size={24} color="#22C55E" />
          <Text style={styles.sectionTitle}>What to Do During a Wildfire</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>If You're at Home</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• Stay informed with local emergency alerts</Text>
            <Text style={styles.infoItem}>• Close all windows and doors</Text>
            <Text style={styles.infoItem}>• Turn off air conditioning and fans</Text>
            <Text style={styles.infoItem}>• Fill bathtubs and sinks with water</Text>
            <Text style={styles.infoItem}>• Move flammable items away from windows</Text>
            <Text style={styles.infoItem}>• Have your emergency kit ready</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>If You Need to Evacuate</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• Follow evacuation orders immediately</Text>
            <Text style={styles.infoItem}>• Take your emergency kit and important documents</Text>
            <Text style={styles.infoItem}>• Wear protective clothing (long sleeves, pants)</Text>
            <Text style={styles.infoItem}>• Cover your nose and mouth with a wet cloth</Text>
            <Text style={styles.infoItem}>• Know your evacuation route in advance</Text>
            <Text style={styles.infoItem}>• Don't return until authorities say it's safe</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Emergency Kit Essentials</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• Water (1 gallon per person per day)</Text>
            <Text style={styles.infoItem}>• Non-perishable food for 3 days</Text>
            <Text style={styles.infoItem}>• First aid kit and medications</Text>
            <Text style={styles.infoItem}>• Flashlight and extra batteries</Text>
            <Text style={styles.infoItem}>• Important documents (ID, insurance)</Text>
            <Text style={styles.infoItem}>• Cash and credit cards</Text>
            <Text style={styles.infoItem}>• Phone charger and backup battery</Text>
            <Text style={styles.infoItem}>• Pet supplies if applicable</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Info size={24} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Important Contacts</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Emergency Numbers</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• 911 - Emergency Services</Text>
            <Text style={styles.infoItem}>• Local Fire Department</Text>
            <Text style={styles.infoItem}>• County Emergency Management</Text>
            <Text style={styles.infoItem}>• Red Cross Disaster Relief</Text>
            <Text style={styles.infoItem}>• FEMA Disaster Assistance</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderUpdatesContent = () => (
    <>
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

      <View style={styles.dummyDataNote}>
        <Info size={16} color="#FF6B35" />
        <Text style={styles.dummyDataText}>
          This is dummy data to show how the UI would look. As the app grows, we will make this a working feature.
        </Text>
      </View>

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
                    {update.verified && update.role !== 'responder' && (
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

            {update.reports > 0 && (
              <View style={styles.updateActions}>
                <TouchableOpacity style={styles.actionItem}>
                  <AlertTriangle size={16} color="#EAB308" />
                  <Text style={styles.actionLabel}>{update.reports} reports</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </>
  );


  useEffect(() => {
    if (selectedTab === 'updates') {
      loadUpdates();
    }
  }, [selectedTab]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Community Updates</Text>
      </View>

      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'prevention' && styles.tabButtonActive,
          ]}
          onPress={() => setSelectedTab('prevention')}
        >
          <Shield size={16} color={selectedTab === 'prevention' ? '#FFFFFF' : '#666'} />
          <Text
            style={[
              styles.tabText,
              selectedTab === 'prevention' && styles.tabTextActive,
            ]}
          >
            Prevention
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'updates' && styles.tabButtonActive,
          ]}
          onPress={() => setSelectedTab('updates')}
        >
          <MessageSquare size={16} color={selectedTab === 'updates' ? '#FFFFFF' : '#666'} />
          <Text
            style={[
              styles.tabText,
              selectedTab === 'updates' && styles.tabTextActive,
            ]}
          >
            Updates
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'prevention' ? (
        renderPreventionContent()
      ) : (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {renderUpdatesContent()}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    paddingTop: 30,
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
  tabSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
    gap: 8,
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
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
  dummyDataNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    gap: 8,
  },
  dummyDataText: {
    fontSize: 12,
    color: '#CCCCCC',
    flex: 1,
    lineHeight: 16,
  },
});