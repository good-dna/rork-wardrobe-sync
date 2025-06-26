import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, Pressable, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { 
  Calendar, 
  DollarSign, 
  Tag, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Clock, 
  Droplets,
  ImageIcon
} from 'lucide-react-native';
import { colors, categoryColors } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { CleaningStatus, WearLogEntry, WashLogEntry } from '@/types/wardrobe';
import * as Haptics from 'expo-haptics';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const items = useWardrobeStore((state) => state.items);
  const updateItem = useWardrobeStore((state) => state.updateItem);
  const deleteItem = useWardrobeStore((state) => state.deleteItem);
  const incrementWearCount = useWardrobeStore((state) => state.incrementWearCount);
  const updateCleaningStatus = useWardrobeStore((state) => state.updateCleaningStatus);
  const logItemWorn = useWardrobeStore((state) => state.logItemWorn);
  const logItemWashed = useWardrobeStore((state) => state.logItemWashed);
  
  const item = items.find((item) => item.id === id);
  
  const [showCleaningOptions, setShowCleaningOptions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  if (!item) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Item not found</Text>
      </View>
    );
  }
  
  const handleDelete = () => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: () => {
            deleteItem(item.id);
            router.back();
          },
          style: "destructive"
        }
      ]
    );
  };
  
  const handleEdit = () => {
    // In a real app, navigate to edit screen
    Alert.alert("Edit Item", "Edit functionality would be implemented here.");
  };
  
  const handleWearCountIncrement = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Log the wear with today's date
    const today = new Date().toISOString().split('T')[0];
    logItemWorn(item.id, {
      date: today,
      notes: ''
    });
  };
  
  const handleCleaningStatusUpdate = (status: CleaningStatus) => {
    updateCleaningStatus(item.id, status);
    
    // If marking as clean, log a wash
    if (status === 'clean') {
      const today = new Date().toISOString().split('T')[0];
      logItemWashed(item.id, {
        date: today,
        notes: ''
      });
    }
    
    setShowCleaningOptions(false);
  };
  
  const categoryColor = categoryColors[item.category] || colors.lightGray;
  
  // Check if the image URL contains a transparent image indicator
  // This is a simplified check - in a real app, you might have a more robust way to track this
  const hasTransparentBackground = item.imageUrl.includes('processed') || item.imageUrl.includes('transparent');
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{
          title: item.name,
          headerRight: () => (
            <Pressable onPress={handleEdit} style={styles.headerButton}>
              <Edit size={20} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
      
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.image} 
          resizeMode="contain"
        />
        <View 
          style={[
            styles.categoryBadge, 
            { backgroundColor: categoryColor }
          ]}
        >
          <Text style={styles.categoryText}>
            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
          </Text>
        </View>
        
        {hasTransparentBackground && (
          <View style={styles.transparentBadge}>
            <ImageIcon size={12} color="white" />
            <Text style={styles.transparentText}>Transparent BG</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.brand}>{item.brand}</Text>
          </View>
          
          <View style={styles.actions}>
            <Pressable 
              style={[styles.actionButton, styles.wearButton]} 
              onPress={handleWearCountIncrement}
            >
              <Clock size={16} color="white" />
              <Text style={styles.actionButtonText}>Wore Today</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.actionButton, styles.cleanButton]} 
              onPress={() => setShowCleaningOptions(!showCleaningOptions)}
            >
              <Droplets size={16} color="white" />
            </Pressable>
          </View>
        </View>
        
        {showCleaningOptions && (
          <View style={styles.cleaningOptions}>
            <Pressable 
              style={[styles.cleaningOption, { backgroundColor: colors.success }]} 
              onPress={() => handleCleaningStatusUpdate('clean')}
            >
              <Check size={16} color="white" />
              <Text style={styles.cleaningOptionText}>Clean</Text>
            </Pressable>
            <Pressable 
              style={[styles.cleaningOption, { backgroundColor: colors.warning }]} 
              onPress={() => handleCleaningStatusUpdate('dirty')}
            >
              <Droplets size={16} color="white" />
              <Text style={styles.cleaningOptionText}>Dirty</Text>
            </Pressable>
            <Pressable 
              style={[styles.cleaningOption, { backgroundColor: colors.error }]} 
              onPress={() => handleCleaningStatusUpdate('needs repair')}
            >
              <X size={16} color="white" />
              <Text style={styles.cleaningOptionText}>Needs Repair</Text>
            </Pressable>
          </View>
        )}
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Tag size={18} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Color & Material</Text>
              <Text style={styles.detailValue}>{item.color} • {item.material}</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Calendar size={18} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Season</Text>
              <Text style={styles.detailValue}>
                {item.season.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <DollarSign size={18} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Purchase Info</Text>
              <Text style={styles.detailValue}>
                ${item.purchasePrice.toFixed(2)} • {formatDate(item.purchaseDate)}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Clock size={18} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Wear Count</Text>
              <Text style={styles.detailValue}>
                Worn {item.wearCount} times • Last worn: {formatDate(item.lastWorn)}
              </Text>
            </View>
          </View>
        </View>
        
        <Pressable 
          style={styles.historyToggle}
          onPress={() => setShowHistory(!showHistory)}
        >
          <Text style={styles.historyToggleText}>
            {showHistory ? 'Hide Usage History' : 'Show Usage History'}
          </Text>
          <Text style={styles.historyToggleIcon}>{showHistory ? '▲' : '▼'}</Text>
        </Pressable>
        
        {showHistory && (
          <View style={styles.historyContainer}>
            <View style={styles.historySection}>
              <View style={styles.historySectionHeader}>
                <Clock size={16} color={colors.primary} />
                <Text style={styles.historySectionTitle}>Wear History</Text>
              </View>
              
              {item.wearHistory && item.wearHistory.length > 0 ? (
                item.wearHistory.slice(0, 5).map((entry: WearLogEntry, index: number) => (
                  <View key={index} style={styles.historyEntry}>
                    <Text style={styles.historyDate}>{formatDate(entry.date)}</Text>
                    {entry.notes && <Text style={styles.historyNotes}>{entry.notes}</Text>}
                  </View>
                ))
              ) : (
                <Text style={styles.noHistoryText}>No wear history recorded</Text>
              )}
              
              {item.wearHistory && item.wearHistory.length > 5 && (
                <Pressable 
                  style={styles.viewMoreButton}
                  onPress={() => router.push('/calendar')}
                >
                  <Text style={styles.viewMoreButtonText}>
                    View all {item.wearHistory.length} entries
                  </Text>
                </Pressable>
              )}
            </View>
            
            <View style={styles.historySection}>
              <View style={styles.historySectionHeader}>
                <Droplets size={16} color={colors.info} />
                <Text style={styles.historySectionTitle}>Wash History</Text>
              </View>
              
              {item.washHistory && item.washHistory.length > 0 ? (
                item.washHistory.slice(0, 5).map((entry: WashLogEntry, index: number) => (
                  <View key={index} style={styles.historyEntry}>
                    <Text style={styles.historyDate}>{formatDate(entry.date)}</Text>
                    {entry.notes && <Text style={styles.historyNotes}>{entry.notes}</Text>}
                  </View>
                ))
              ) : (
                <Text style={styles.noHistoryText}>No wash history recorded</Text>
              )}
              
              {item.washHistory && item.washHistory.length > 5 && (
                <Pressable 
                  style={styles.viewMoreButton}
                  onPress={() => router.push('/calendar')}
                >
                  <Text style={styles.viewMoreButtonText}>
                    View all {item.washHistory.length} entries
                  </Text>
                </Pressable>
              )}
            </View>
            
            {item.nextWashDue && (
              <View style={styles.nextWashContainer}>
                <Text style={styles.nextWashLabel}>Next Wash Due:</Text>
                <Text style={styles.nextWashDate}>{formatDate(item.nextWashDue)}</Text>
              </View>
            )}
          </View>
        )}
        
        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
        
        <View style={styles.tagsContainer}>
          <Text style={styles.tagsLabel}>Tags</Text>
          <View style={styles.tagsList}>
            {item.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Status</Text>
          <View 
            style={[
              styles.statusBadge, 
              { 
                backgroundColor: 
                  item.cleaningStatus === 'clean' 
                    ? colors.success 
                    : item.cleaningStatus === 'dirty' 
                      ? colors.warning 
                      : colors.error 
              }
            ]}
          >
            <Text style={styles.statusText}>
              {item.cleaningStatus.charAt(0).toUpperCase() + item.cleaningStatus.slice(1)}
            </Text>
          </View>
        </View>
        
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Trash2 size={18} color={colors.error} />
          <Text style={styles.deleteButtonText}>Delete Item</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButton: {
    padding: 8,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
    backgroundColor: Platform.OS === 'web' ? 'rgba(240, 240, 240, 0.5)' : colors.card, // Checkerboard pattern for web to show transparency
  },
  image: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  transparentBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  transparentText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  brand: {
    fontSize: 16,
    color: colors.subtext,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  wearButton: {
    backgroundColor: colors.primary,
  },
  cleanButton: {
    backgroundColor: colors.info,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  cleaningOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cleaningOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  cleaningOptionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20', // 20% opacity
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: colors.subtext,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
  },
  historyToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  historyToggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
  },
  historyToggleIcon: {
    fontSize: 16,
    color: colors.primary,
  },
  historyContainer: {
    marginBottom: 16,
  },
  historySection: {
    marginBottom: 16,
  },
  historySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  historyEntry: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyDate: {
    fontSize: 14,
    color: colors.text,
  },
  historyNotes: {
    fontSize: 12,
    color: colors.subtext,
    marginTop: 4,
    fontStyle: 'italic',
  },
  noHistoryText: {
    fontSize: 14,
    color: colors.subtext,
    fontStyle: 'italic',
    padding: 8,
  },
  viewMoreButton: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  viewMoreButtonText: {
    fontSize: 14,
    color: colors.primary,
  },
  nextWashContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    padding: 12,
    borderRadius: 8,
  },
  nextWashLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginRight: 8,
  },
  nextWashDate: {
    fontSize: 14,
    color: colors.warning,
    fontWeight: '600',
  },
  notesContainer: {
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  tagsContainer: {
    marginBottom: 24,
  },
  tagsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: colors.text,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    marginTop: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '500',
    marginLeft: 8,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 16,
    color: colors.subtext,
  },
});