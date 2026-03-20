import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Save, User } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

const isValidDate = (val: string): boolean => {
  if (val.length !== 10) return false;
  const parts = val.split('/');
  if (parts.length !== 3) return false;
  const mm = parseInt(parts[0], 10);
  const dd = parseInt(parts[1], 10);
  const yyyy = parseInt(parts[2], 10);
  if (isNaN(mm) || isNaN(dd) || isNaN(yyyy)) return false;
  if (mm < 1 || mm > 12) return false;
  if (dd < 1 || dd > 31) return false;
  if (yyyy < 1900 || yyyy > new Date().getFullYear()) return false;
  const date = new Date(yyyy, mm - 1, dd);
  return date.getMonth() === mm - 1 && date.getDate() === dd;
};

export default function ProfileSettingsScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [timezone, setTimezone] = useState('');
  const [units, setUnits] = useState<'imperial' | 'metric'>('imperial');

  const dateHasError = dateOfBirth.length > 0 && !isValidDate(dateOfBirth);

  useEffect(() => {
    loadProfile();
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
              display_name: user.email?.split('@')[0] || '',
            })
            .select()
            .single();

          if (insertError) {
            Alert.alert('Error', `Failed to create profile: ${insertError.message}`);
            return;
          }
          initializeFormFields(newProfile);
        } else {
          Alert.alert('Error', `Failed to load profile: ${error.message}`);
        }
        return;
      }

      initializeFormFields(data);
    } catch (err: any) {
      Alert.alert('Error', `Failed to load profile: ${err?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const initializeFormFields = (profileData: any) => {
    setDisplayName(profileData.display_name || '');
    setAge(profileData.age?.toString() || '');
    // Convert YYYY-MM-DD from Supabase to MM/DD/YYYY for display
    if (profileData.date_of_birth) {
      const parts = profileData.date_of_birth.split('-');
      if (parts.length === 3) {
        setDateOfBirth(`${parts[1]}/${parts[2]}/${parts[0]}`);
      } else {
        setDateOfBirth(profileData.date_of_birth);
      }
    }
    setTimezone(profileData.timezone || '');
    setUnits(profileData.units === 'metric' ? 'metric' : 'imperial');
  };

  const handleDateChange = (val: string) => {
    // Strip everything except digits
    const digits = val.replace(/\D/g, '');

    // Auto-insert slashes after MM and DD
    let formatted = digits;
    if (digits.length >= 3 && digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else if (digits.length >= 5) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
    setDateOfBirth(formatted);
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Validation Error', 'Display name is required');
      return;
    }

    const ageNum = age ? parseInt(age, 10) : null;
    if (age && (isNaN(ageNum as number) || (ageNum as number) < 0 || (ageNum as number) > 120)) {
      Alert.alert('Validation Error', 'Age must be between 0 and 120');
      return;
    }

    if (dateOfBirth && !isValidDate(dateOfBirth)) {
      Alert.alert('Validation Error', 'Please enter a valid date in MM/DD/YYYY format');
      return;
    }

    try {
      setSaving(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert('Error', 'Not authenticated');
        return;
      }

      // Convert MM/DD/YYYY back to YYYY-MM-DD for Supabase
      let dbDate = null;
      if (dateOfBirth && isValidDate(dateOfBirth)) {
        const parts = dateOfBirth.split('/');
        dbDate = `${parts[2]}-${parts[0]}-${parts[1]}`;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email || '',
          display_name: displayName.trim(),
          age: ageNum,
          date_of_birth: dbDate,
          timezone: timezone.trim() || null,
          units: units,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        Alert.alert('Error', `Failed to save profile: ${error.message}`);
        return;
      }

      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', `Failed to save profile: ${err?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
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
            <Pressable onPress={handleSave} disabled={saving || dateHasError} style={styles.headerButton}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Save size={20} color={dateHasError ? colors.mediumGray : colors.primary} />
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
          <Text style={styles.label}>Display Name *</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your display name"
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
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={[styles.input, dateHasError && styles.inputError]}
            value={dateOfBirth}
            onChangeText={handleDateChange}
            placeholder="MM/DD/YYYY"
            placeholderTextColor={colors.mediumGray}
            keyboardType="number-pad"
            maxLength={10}
          />
          {dateHasError && (
            <Text style={styles.errorText}>Please enter a valid date (MM/DD/YYYY)</Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Timezone</Text>
          <TextInput
            style={styles.input}
            value={timezone}
            onChangeText={setTimezone}
            placeholder="e.g. America/New_York"
            placeholderTextColor={colors.mediumGray}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Temperature Units</Text>
          <View style={styles.unitsContainer}>
            <Pressable
              style={[styles.unitChip, units === 'imperial' && styles.selectedUnitChip]}
              onPress={() => setUnits('imperial')}
            >
              <Text style={[styles.unitChipText, units === 'imperial' && styles.selectedUnitChipText]}>
                °F Imperial
              </Text>
            </Pressable>
            <Pressable
              style={[styles.unitChip, units === 'metric' && styles.selectedUnitChip]}
              onPress={() => setUnits('metric')}
            >
              <Text style={[styles.unitChipText, units === 'metric' && styles.selectedUnitChipText]}>
                °C Metric
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Pressable
        style={[styles.saveButton, (saving || dateHasError) && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving || dateHasError}
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
    paddingBottom: 40,
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
    color: colors.textSecondary,
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
    marginBottom: 16,
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
  inputError: {
    borderColor: colors.error,
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  unitsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  unitChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedUnitChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitChipText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  selectedUnitChipText: {
    color: '#000000',
    fontWeight: '600',
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
    opacity: 0.4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
