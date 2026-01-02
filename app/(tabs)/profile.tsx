import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { User, LogOut, Edit, Camera, MapPin, ChevronRight, Key, Mail, Calendar } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/constants/colors';
import { useUserStore, StylePreference, FavoriteCategory } from '@/store/userStore';
import { useAuth } from '@/providers/AuthProvider';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile, logout } = useUserStore();
  const { user, signOut } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [stylePreference, setStylePreference] = useState<StylePreference>(profile?.stylePreference || 'casual');
  const [favoriteCategory, setFavoriteCategory] = useState<FavoriteCategory>(profile?.favoriteCategory || 'shirts');
  
  const stylePreferences: StylePreference[] = ['casual', 'business', 'athletic', 'formal', 'bohemian', 'minimalist'];
  const favoriteCategories: FavoriteCategory[] = ['shirts', 'pants', 'jackets', 'shoes', 'accessories', 'fragrances'];
  
  const handleLogout = async () => {
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
            logout();
            Alert.alert("Logged out successfully");
          }
        }
      ]
    );
  };
  
  const handleSaveProfile = () => {
    if (!displayName.trim()) {
      Alert.alert("Error", "Display name cannot be empty");
      return;
    }
    
    updateProfile({
      displayName,
      email,
      stylePreference,
      favoriteCategory
    });
    
    setIsEditing(false);
    Alert.alert("Success", "Profile updated successfully");
  };
  
  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        updateProfile({ avatar: result.assets[0].uri });
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };
  
  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>User profile not found</Text>
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
        {profile.avatar ? (
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
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
            <Text style={styles.infoValue}>{profile.displayName}</Text>
          )}
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Your email"
              placeholderTextColor={colors.mediumGray}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          ) : (
            <Text style={styles.infoValue}>{profile.email}</Text>
          )}
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Style Preference</Text>
          {isEditing ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionsContainer}
            >
              {stylePreferences.map((style) => (
                <Pressable
                  key={style}
                  style={[
                    styles.optionChip,
                    stylePreference === style && styles.selectedOptionChip
                  ]}
                  onPress={() => setStylePreference(style)}
                >
                  <Text 
                    style={[
                      styles.optionChipText,
                      stylePreference === style && styles.selectedOptionChipText
                    ]}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.infoValue}>
              {profile.stylePreference.charAt(0).toUpperCase() + profile.stylePreference.slice(1)}
            </Text>
          )}
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Favorite Category</Text>
          {isEditing ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionsContainer}
            >
              {favoriteCategories.map((category) => (
                <Pressable
                  key={category}
                  style={[
                    styles.optionChip,
                    favoriteCategory === category && styles.selectedOptionChip
                  ]}
                  onPress={() => setFavoriteCategory(category)}
                >
                  <Text 
                    style={[
                      styles.optionChipText,
                      favoriteCategory === category && styles.selectedOptionChipText
                    ]}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.infoValue}>
              {profile.favoriteCategory.charAt(0).toUpperCase() + profile.favoriteCategory.slice(1)}
            </Text>
          )}
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Member Since</Text>
          <Text style={styles.infoValue}>
            {new Date(profile.joinDate).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      {/* Authentication Info Section */}
      {user && (
        <View style={styles.authSection}>
          <Text style={styles.sectionTitle}>Authentication Info</Text>
          
          <View style={styles.authCard}>
            <View style={styles.authItem}>
              <Mail size={18} color={colors.primary} />
              <View style={styles.authItemContent}>
                <Text style={styles.authLabel}>Login Email</Text>
                <Text style={styles.authValue}>{user.email}</Text>
              </View>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.authItem}>
              <Key size={18} color={colors.primary} />
              <View style={styles.authItemContent}>
                <Text style={styles.authLabel}>User ID</Text>
                <Text style={styles.authValue} numberOfLines={1} selectable>
                  {user.id}
                </Text>
              </View>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.authItem}>
              <Calendar size={18} color={colors.primary} />
              <View style={styles.authItemContent}>
                <Text style={styles.authLabel}>Account Created</Text>
                <Text style={styles.authValue}>
                  {new Date(user.created_at).toLocaleString()}
                </Text>
              </View>
            </View>
            
            {user.last_sign_in_at && (
              <>
                <View style={styles.separator} />
                <View style={styles.authItem}>
                  <Calendar size={18} color={colors.primary} />
                  <View style={styles.authItemContent}>
                    <Text style={styles.authLabel}>Last Sign In</Text>
                    <Text style={styles.authValue}>
                      {new Date(user.last_sign_in_at).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </>
            )}
            
            {user.email_confirmed_at && (
              <>
                <View style={styles.separator} />
                <View style={styles.authItem}>
                  <Calendar size={18} color={colors.primary} />
                  <View style={styles.authItemContent}>
                    <Text style={styles.authLabel}>Email Verified</Text>
                    <Text style={styles.authValue}>
                      {new Date(user.email_confirmed_at).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      )}
      
      {/* Settings Section */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <Pressable 
          style={styles.settingsItem}
          onPress={() => router.push('/location-settings' as any)}
        >
          <View style={styles.settingsItemContent}>
            <MapPin size={20} color={colors.primary} />
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemTitle}>Location & Weather</Text>
              <Text style={styles.settingsItemSubtitle}>
                {profile.locationPreferences?.location 
                  ? `${profile.locationPreferences.location.city}, ${profile.locationPreferences.location.region}`
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
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  authSection: {
    marginBottom: 24,
  },
  authCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  authItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  authItemContent: {
    marginLeft: 12,
    flex: 1,
  },
  authLabel: {
    fontSize: 14,
    color: colors.subtext,
    marginBottom: 4,
  },
  authValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginVertical: 8,
  },
  settingsItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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