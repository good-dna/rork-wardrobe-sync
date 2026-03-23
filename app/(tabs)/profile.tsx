import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Pressable,
  TextInput, Image, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, LogOut, Edit, Camera, MapPin, ChevronRight, Settings, BarChart3, Save, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, tokens } from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

const CATEGORIES = ['shirts', 'pants', 'jackets', 'shoes', 'accessories', 'fragrances'];
const AGES = Array.from({ length: 100 }, (_, i) => i + 1);

interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  age: number | null;
  date_of_birth: string | null;
  timezone: string | null;
  units: string | null;
  favorite_category: string | null;
  zip_code: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [zipLookingUp, setZipLookingUp] = useState(false);

  // Editable fields
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [favoriteCategory, setFavoriteCategory] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              display_name: user.email?.split('@')[0] || '',
            })
            .select()
            .single();

          if (insertError) {
            Alert.alert('Error', `Failed to create profile: ${insertError.message}`);
            return;
          }
          if (newProfile) {
            setProfile(newProfile);
            initFormFields(newProfile);
          }
          return;
        }
        throw error;
      }

      if (data) {
        setProfile(data);
        initFormFields(data);
      }
    } catch (err: any) {
      Alert.alert('Error', `Failed to load profile: ${err?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const initFormFields = (p: any) => {
    setDisplayName(p.display_name || '');
    setAge(p.age || null);
    setFavoriteCategory(p.favorite_category || '');
    setZipCode(p.zip_code || '');
    setCity(p.city || '');
    setState(p.state || '');
    setCountry(p.country || '');
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ZIP autofill using free zippopotam.us API
  const handleZipChange = useCallback(async (zip: string) => {
    setZipCode(zip);
    if (zip.length !== 5 || !/^\d+$/.test(zip)) return;

    setZipLookingUp(true);
    try {
      const response = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (response.ok) {
        const data = await response.json();
        if (data.places?.length > 0) {
          setCity(data.places[0]['place name']);
          setState(data.places[0]['state abbreviation']);
          setCountry('United States');
        }
      }
    } catch (err) {
      console.warn('ZIP lookup failed:', err);
    } finally {
      setZipLookingUp(false);
    }
  }, []);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty');
      return;
    }

    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          age: age,
          favorite_category: favoriteCategory || null,
          zip_code: zipCode || null,
          city: city.trim() || null,
          state: state.trim() || null,
          country: country.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await fetchProfile();
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err: any) {
      Alert.alert('Error', `Failed to update profile: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => await signOut() },
    ]);
  };

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && user) {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: result.assets[0].uri })
          .eq('id', user.id);

        if (error) throw error;
        await fetchProfile();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update avatar. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        {!isEditing ? (
          <Pressable style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Edit size={20} color={colors.primary} />
          </Pressable>
        ) : (
          <Pressable style={styles.saveHeaderButton} onPress={handleSaveProfile}>
            <Save size={16} color="#000" />
            <Text style={styles.saveHeaderButtonText}>Save</Text>
          </Pressable>
        )}
      </View>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <User size={40} color={colors.mediumGray} />
          </View>
        )}
        {isEditing && (
          <Pressable style={styles.changeAvatarButton} onPress={handlePickAvatar}>
            <Camera size={16} color="white" />
            <Text style={styles.changeAvatarText}>Change</Text>
          </Pressable>
        )}
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfo}>

        {/* Display Name */}
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Display Name</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={colors.mediumGray}
            />
          ) : (
            <Text style={styles.infoValue}>{profile?.display_name || 'Not set'}</Text>
          )}
        </View>

        {/* Email (read-only) */}
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{profile?.email || user?.email}</Text>
        </View>

        {/* Age */}
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Age</Text>
          {isEditing ? (
  <TextInput
    style={styles.input}
    value={age !== null ? age.toString() : ''}
    onChangeText={(val) => {
      if (val === '') { setAge(null); return; }
      const num = parseInt(val, 10);
      if (!isNaN(num) && num >= 1 && num <= 120) setAge(num);
    }}
    placeholder="Enter your age"
    placeholderTextColor={colors.mediumGray}
    keyboardType="number-pad"
    maxLength={3}
  />
) : (
  <Text style={styles.infoValue}>{profile?.age || 'Not set'}</Text>
      )} 
        </View>

        {/* Location */}
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Location</Text>
          {isEditing ? (
            <>
              <View style={styles.zipRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={zipCode}
                  onChangeText={handleZipChange}
                  placeholder="ZIP code (autofills city/state)"
                  placeholderTextColor={colors.mediumGray}
                  keyboardType="number-pad"
                  maxLength={10}
                />
                {zipLookingUp && (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
                )}
              </View>
              <View style={styles.locationRow}>
                <TextInput
                  style={[styles.input, styles.locationHalf]}
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                  placeholderTextColor={colors.mediumGray}
                />
                <TextInput
                  style={[styles.input, styles.locationHalf]}
                  value={state}
                  onChangeText={setState}
                  placeholder="State"
                  placeholderTextColor={colors.mediumGray}
                />
              </View>
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                value={country}
                onChangeText={setCountry}
                placeholder="Country"
                placeholderTextColor={colors.mediumGray}
              />
            </>
          ) : (
            <Text style={styles.infoValue}>
              {[profile?.city, profile?.state, profile?.country].filter(Boolean).join(', ') || 'Not set'}
            </Text>
          )}
        </View>

        {/* Favorite Category */}
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Favorite Category</Text>
          {isEditing ? (
            <View style={styles.chipGrid}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[styles.categoryChip, favoriteCategory === cat && styles.categoryChipSelected]}
                  onPress={() => setFavoriteCategory(favoriteCategory === cat ? '' : cat)}
                >
                  <Text style={[styles.categoryChipText, favoriteCategory === cat && styles.categoryChipTextSelected]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.infoValue}>
              {profile?.favorite_category
                ? profile.favorite_category.charAt(0).toUpperCase() + profile.favorite_category.slice(1)
                : 'Not set'}
            </Text>
          )}
        </View>

        {/* Member Since */}
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Member Since</Text>
          <Text style={styles.infoValue}>
            {new Date(profile?.created_at || '').toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Settings Section */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsTitle}>Settings</Text>

        <Pressable
          style={styles.settingsItem}
          onPress={() => router.push('/profile-settings')}
        >
          <View style={styles.settingsItemContent}>
            <Settings size={20} color={colors.primary} />
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemTitle}>Profile Settings</Text>
              <Text style={styles.settingsItemSubtitle}>Update your personal information and preferences</Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </Pressable>

        <Pressable
          style={[styles.settingsItem, styles.settingsItemSpacing]}
          onPress={() => router.push('/closet-analytics')}
        >
          <View style={styles.settingsItemContent}>
            <BarChart3 size={20} color={colors.success} />
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemTitle}>Closet Analytics</Text>
              <Text style={styles.settingsItemSubtitle}>View valuation and usage insights</Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </Pressable>

        <Pressable
          style={[styles.settingsItem, styles.settingsItemSpacing]}
          onPress={() => router.push('/import-wardrobe' as any)}
        >
          <View style={styles.settingsItemContent}>
            <Upload size={20} color={colors.primary} />
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemTitle}>Import Wardrobe</Text>
              <Text style={styles.settingsItemSubtitle}>Bulk import from CSV or Excel file</Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </Pressable>

        <Pressable
          style={[styles.settingsItem, styles.settingsItemSpacing]}
          onPress={() => router.push('/location-settings')}
        >
          <View style={styles.settingsItemContent}>
            <MapPin size={20} color={colors.info} />
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemTitle}>Location & Weather</Text>
              <Text style={styles.settingsItemSubtitle}>
                {profile?.city && profile?.state
                  ? `${profile.city}, ${profile.state}`
                  : 'Set your location for weather-based recommendations'}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Logout */}
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={18} color={colors.error} />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: tokens.spacing.lg,
    paddingBottom: 90,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  editButton: {
    padding: 8,
  },
  saveHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: tokens.radius.md,
    gap: 6,
  },
  saveHeaderButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeAvatarText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  profileInfo: {
    marginBottom: tokens.spacing.lg,
  },
  infoItem: {
    marginBottom: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: tokens.spacing.md,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: tokens.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helperText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  // Age chips
  ageScrollContent: {
    paddingVertical: 4,
    flexDirection: 'row',
  },
  ageChip: {
    width: 44,
    height: 44,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  ageChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ageChipText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  ageChipTextSelected: {
    color: '#000000',
    fontWeight: '700',
  },
  // Location
  zipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  locationHalf: {
    flex: 1,
  },
  // Category chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: tokens.radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#000000',
    fontWeight: '600',
  },
  // Settings
  settingsSection: {
    marginBottom: tokens.spacing.lg,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  settingsItem: {
    backgroundColor: colors.card,
    borderRadius: tokens.radius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsItemSpacing: {
    marginTop: 12,
  },
  settingsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemText: {
    marginLeft: 12,
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  settingsItemSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: tokens.radius.md,
    gap: 8,
    marginBottom: 24,
  },
  logoutButtonText: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '500',
  },
});
