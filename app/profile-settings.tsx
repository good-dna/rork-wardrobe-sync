import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Save, User } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { supabase, Tables } from '@/lib/supabase';

type Profile = Tables<'profiles'>;

const CATEGORIES = ['shirts', 'pants', 'jackets', 'shoes', 'accessories', 'fragrances'];

export default function ProfileSettingsScreen() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [favoriteCategory, setFavoriteCategory] = useState('');
  
  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const loadProfile = async () => {
    try {
      setLoading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert('Error', 'Not authenticated. Please sign in.');
        router.back();
        return;
      }
      
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
            })
            .select()
            .single();
          
          if (insertError) {
            console.error('Error creating profile:', insertError);
            const errorMessage = insertError.message || insertError.hint || insertError.details || 'Failed to create profile';
            console.error('Full error:', errorMessage);
            Alert.alert('Error', `Failed to create profile: ${errorMessage}`);
            return;
          }
          
          setProfile(newProfile);
          initializeFormFields(newProfile);
        } else {
          console.error('Error loading profile:', error);
          const errorMessage = error.message || error.hint || error.details || 'Failed to load profile';
          console.error('Full error:', errorMessage);
          Alert.alert('Error', `Failed to load profile: ${errorMessage}`);
        }
        return;
      }
      
      setProfile(data);
      initializeFormFields(data);
    } catch (err: any) {
      console.error('Error in loadProfile:', err);
      const errorMessage = err?.message || (err instanceof Error ? err.message : String(err) || 'An unexpected error occurred');
      console.error('Caught error message:', errorMessage);
      Alert.alert('Error', `Failed to load profile: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  const initializeFormFields = (profileData: Profile) => {
    setFullName(profileData.full_name || '');
    setAge(profileData.age?.toString() || '');
    setCity(profileData.city || '');
    setState(profileData.state || '');
    setCountry(profileData.country || '');
    setFavoriteCategory(profileData.favorite_category || '');
  };
  
  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Full name is required');
      return;
    }
    
    const ageNum = age ? parseInt(age, 10) : null;
    if (age && (isNaN(ageNum as number) || (ageNum as number) < 0 || (ageNum as number) > 120)) {
      Alert.alert('Validation Error', 'Age must be between 0 and 120');
      return;
    }
    
    try {
      setSaving(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert('Error', 'Not authenticated');
        return;
      }
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email || '',
          full_name: fullName.trim(),
          age: ageNum,
          city: city.trim() || null,
          state: state.trim() || null,
          country: country.trim() || null,
          favorite_category: favoriteCategory || null,
        });
      
      if (error) {
        console.error('Error saving profile:', error);
        const errorMessage = error.message || error.hint || error.details || 'Failed to save profile';
        console.error('Save error message:', errorMessage);
        Alert.alert('Error', `Failed to save profile: ${errorMessage}`);
        return;
      }
      
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (err: any) {
      console.error('Error in handleSave:', err);
      const errorMessage = err?.message || (err instanceof Error ? err.message : String(err) || 'An unexpected error occurred');
      console.error('Save caught error:', errorMessage);
      Alert.alert('Error', `Failed to save profile: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Profile Settings' }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen 
        options={{
          title: 'Profile Settings',
          headerRight: () => (
            <Pressable onPress={handleSave} disabled={saving} style={styles.headerButton}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Save size={20} color={colors.primary} />
              )}
            </Pressable>
          ),
        }}
      />
      
      <View style={styles.section}>
        <View style={styles.iconHeader}>
          <User size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Personal Information</Text>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            placeholderTextColor={colors.mediumGray}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="Enter your age"
            placeholderTextColor={colors.mediumGray}
            keyboardType="number-pad"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Enter your city"
            placeholderTextColor={colors.mediumGray}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>State / Province</Text>
          <TextInput
            style={styles.input}
            value={state}
            onChangeText={setState}
            placeholder="Enter your state"
            placeholderTextColor={colors.mediumGray}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Country</Text>
          <TextInput
            style={styles.input}
            value={country}
            onChangeText={setCountry}
            placeholder="Enter your country"
            placeholderTextColor={colors.mediumGray}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Favorite Category</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {CATEGORIES.map((category) => (
              <Pressable
                key={category}
                style={[
                  styles.categoryChip,
                  favoriteCategory === category && styles.selectedCategoryChip
                ]}
                onPress={() => setFavoriteCategory(category)}
              >
                <Text 
                  style={[
                    styles.categoryChipText,
                    favoriteCategory === category && styles.selectedCategoryChipText
                  ]}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
      
      {profile?.member_since && (
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Member Since</Text>
          <Text style={styles.infoValue}>{formatDate(profile.member_since)}</Text>
        </View>
      )}
      
      <Pressable 
        style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Save size={18} color="white" />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.subtext,
  },
  headerButton: {
    padding: 8,
  },
  section: {
    marginBottom: 24,
  },
  iconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoriesContainer: {
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedCategoryChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedCategoryChipText: {
    color: 'white',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.subtext,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
