import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { colors, tokens } from '@/constants/colors';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Calendar, LogOut, Save } from 'lucide-react-native';

interface ProfileFormData {
  full_name: string;
  age: string;
  city: string;
  state: string;
  country: string;
  favorite_category: string;
}

const categories = ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories'];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    age: '',
    city: '',
    state: '',
    country: '',
    favorite_category: '',
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        age: profile.age?.toString() || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || '',
        favorite_category: profile.favorite_category || '',
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name || null,
          age: formData.age ? parseInt(formData.age) : null,
          city: formData.city || null,
          state: formData.state || null,
          country: formData.country || null,
          favorite_category: formData.favorite_category || null,
        })
        .eq('id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/launch' as any);
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const memberSince = profile?.member_since
    ? new Date(profile.member_since).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Unknown';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <User size={40} color={colors.primary} />
        </View>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.memberSinceCard}>
        <Calendar size={20} color={colors.primary} />
        <View style={styles.memberSinceContent}>
          <Text style={styles.memberSinceLabel}>Member Since</Text>
          <Text style={styles.memberSinceValue}>{memberSince}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          {!isEditing ? (
            <Pressable onPress={() => setIsEditing(true)} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => setIsEditing(false)} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={formData.full_name}
            onChangeText={text => setFormData({ ...formData, full_name: text })}
            placeholder="Enter your full name"
            placeholderTextColor={colors.textSecondary}
            editable={isEditing}
          />

          <Text style={styles.label}>Age</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={formData.age}
            onChangeText={text => setFormData({ ...formData, age: text })}
            placeholder="Enter your age"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            editable={isEditing}
          />

          <Text style={styles.label}>City</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={formData.city}
            onChangeText={text => setFormData({ ...formData, city: text })}
            placeholder="Enter your city"
            placeholderTextColor={colors.textSecondary}
            editable={isEditing}
          />

          <Text style={styles.label}>State</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={formData.state}
            onChangeText={text => setFormData({ ...formData, state: text })}
            placeholder="Enter your state"
            placeholderTextColor={colors.textSecondary}
            editable={isEditing}
          />

          <Text style={styles.label}>Country</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={formData.country}
            onChangeText={text => setFormData({ ...formData, country: text })}
            placeholder="Enter your country"
            placeholderTextColor={colors.textSecondary}
            editable={isEditing}
          />

          <Text style={styles.label}>Favorite Category</Text>
          {isEditing ? (
            <View style={styles.chipContainer}>
              {categories.map(cat => (
                <Pressable
                  key={cat}
                  style={[
                    styles.chip,
                    formData.favorite_category === cat && styles.chipActive,
                  ]}
                  onPress={() => setFormData({ ...formData, favorite_category: cat })}
                >
                  <Text
                    style={[
                      styles.chipText,
                      formData.favorite_category === cat && styles.chipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={formData.favorite_category}
              editable={false}
              placeholder="Not set"
              placeholderTextColor={colors.textSecondary}
            />
          )}
        </View>

        {isEditing && (
          <Pressable
            style={styles.saveButton}
            onPress={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            <Save size={20} color={colors.background} />
            <Text style={styles.saveButtonText}>
              {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={colors.error} />
          <Text style={styles.logoutButtonText}>Log Out</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    padding: tokens.spacing.md,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.md,
  },
  email: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  memberSinceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  memberSinceContent: {
    marginLeft: tokens.spacing.md,
  },
  memberSinceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  memberSinceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  section: {
    marginBottom: tokens.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.primary,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.backgroundSecondary,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  form: {
    marginBottom: tokens.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: tokens.spacing.md,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: tokens.radius.full,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: tokens.spacing.md,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  logoutButton: {
    backgroundColor: colors.backgroundSecondary,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
});
