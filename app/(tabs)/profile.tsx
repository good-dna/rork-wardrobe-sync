import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { User, LogOut, Edit, Camera, MapPin, ChevronRight, Settings, BarChart3 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  age: number | null;
  favorite_category: string | null;
  member_since: string;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [favoriteCategory, setFavoriteCategory] = useState('');
  
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

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setAge(data.age?.toString() || '');
        setCity(data.city || '');
        setState(data.state || '');
        setCountry(data.country || '');
        setFavoriteCategory(data.favorite_category || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          onPress: async () => {
            await signOut();
          }
        }
      ]
    );
  };
  
  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Full name cannot be empty");
      return;
    }

    if (!user) return;

    try {
      const ageNum = age ? parseInt(age, 10) : null;
      if (age && (isNaN(ageNum!) || ageNum! < 0 || ageNum! > 120)) {
        Alert.alert("Error", "Please enter a valid age (0-120)");
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          age: ageNum,
          city: city || null,
          state: state || null,
          country: country || null,
          favorite_category: favoriteCategory || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await fetchProfile();
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert("Error", "Failed to update profile");
    }
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
      console.error('Error picking image:', err);
      Alert.alert("Error", "Failed to update avatar. Please try again.");
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
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        {!isEditing ? (
          <Pressable style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Edit size={20} color={colors.primary} />
          </Pressable>
        ) : (
          <Pressable style={styles.saveButton} onPress={handleSaveProfile}>
            <Text style={styles.saveButtonText}>Save</Text>
          </Pressable>
        )}
      </View>
      
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
      
      <View style={styles.profileInfo}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Full Name</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              placeholderTextColor={colors.mediumGray}
            />
          ) : (
            <Text style={styles.infoValue}>{profile?.full_name || 'Not set'}</Text>
          )}
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{profile?.email}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Age</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Your age"
              placeholderTextColor={colors.mediumGray}
              keyboardType="number-pad"
            />
          ) : (
            <Text style={styles.infoValue}>{profile?.age || 'Not set'}</Text>
          )}
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>City</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Your city"
              placeholderTextColor={colors.mediumGray}
            />
          ) : (
            <Text style={styles.infoValue}>{profile?.city || 'Not set'}</Text>
          )}
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>State/Region</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={state}
              onChangeText={setState}
              placeholder="Your state"
              placeholderTextColor={colors.mediumGray}
            />
          ) : (
            <Text style={styles.infoValue}>{profile?.state || 'Not set'}</Text>
          )}
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Country</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={country}
              onChangeText={setCountry}
              placeholder="Your country"
              placeholderTextColor={colors.mediumGray}
            />
          ) : (
            <Text style={styles.infoValue}>{profile?.country || 'Not set'}</Text>
          )}
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Favorite Category</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={favoriteCategory}
              onChangeText={setFavoriteCategory}
              placeholder="e.g., shirts, shoes"
              placeholderTextColor={colors.mediumGray}
            />
          ) : (
            <Text style={styles.infoValue}>{profile?.favorite_category || 'Not set'}</Text>
          )}
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Member Since</Text>
          <Text style={styles.infoValue}>
            {new Date(profile?.member_since || profile?.created_at || '').toLocaleDateString()}
          </Text>
        </View>
      </View>
      
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
              <Text style={styles.settingsItemSubtitle}>
                Update your personal information and preferences
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.subtext} />
        </Pressable>
        
        <Pressable 
          style={[styles.settingsItem, styles.settingsItemSpacing]}
          onPress={() => router.push('/closet-analytics')}
        >
          <View style={styles.settingsItemContent}>
            <BarChart3 size={20} color={colors.success} />
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemTitle}>Closet Analytics</Text>
              <Text style={styles.settingsItemSubtitle}>
                View valuation and usage insights
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.subtext} />
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
                  : profile?.location
                  ? profile.location
                  : 'Set your location for weather-based recommendations'
                }
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.subtext} />
        </Pressable>
      </View>
      
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <View style={styles.logoutIconContainer}>
          <LogOut size={18} color={colors.error} />
        </View>
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
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  editButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
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
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  changeAvatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  profileInfo: {
    marginBottom: 24,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.subtext,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  optionsContainer: {
    paddingVertical: 4,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    marginRight: 8,
  },
  selectedOptionChip: {
    backgroundColor: colors.primary,
  },
  optionChipText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedOptionChipText: {
    color: 'white',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
  },
  logoutIconContainer: {
    marginRight: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginTop: 24,
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
  settingsSection: {
    marginBottom: 24,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  settingsItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
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
    fontSize: 14,
    color: colors.subtext,
    marginTop: 2,
  },
});
