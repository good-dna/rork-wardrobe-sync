import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { colors, tokens } from '@/constants/colors';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shirt, Trash2, Save } from 'lucide-react-native';

interface ItemFormData {
  name: string;
  category: string;
  brand: string;
  colors: string;
  size: string;
  condition: string;
  purchase_price: string;
  estimated_value: string;
}

const categories = ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories'];
const conditions = ['New', 'Like New', 'Good', 'Fair', 'Worn'];

export default function ClosetItemScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isNew = id === 'new';

  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    category: 'Tops',
    brand: '',
    colors: '',
    size: '',
    condition: 'Good',
    purchase_price: '',
    estimated_value: '',
  });

  const { data: item, isLoading } = useQuery({
    queryKey: ['item', id, isNew],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id as string)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !isNew && !!id,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        category: item.category || 'Tops',
        brand: item.brand || '',
        colors: item.colors?.join(', ') || '',
        size: item.size || '',
        condition: item.condition || 'Good',
        purchase_price: item.purchase_price?.toString() || '',
        estimated_value: item.estimated_value?.toString() || '',
      });
    }
  }, [item]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const colorsArray = formData.colors
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);

      const itemData = {
        user_id: user.id,
        name: formData.name,
        category: formData.category,
        brand: formData.brand || null,
        colors: colorsArray,
        size: formData.size || null,
        condition: formData.condition || null,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
      };

      if (isNew) {
        const { error } = await supabase.from('items').insert(itemData);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('items')
          .update(itemData)
          .eq('id', id as string);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      router.back();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const logWearMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || isNew) throw new Error('Cannot log wear');
      
      const { error } = await supabase
        .from('wear_logs')
        .insert({
          user_id: user.id,
          item_id: id as string,
          worn_at: new Date().toISOString(),
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      Alert.alert('Success', 'Wear logged successfully!');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id as string);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', user?.id] });
      router.back();
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
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

  return (
    <>
      <Stack.Screen
        options={{
          title: isNew ? 'New Item' : 'Item Details',
          headerRight: () => (
            !isNew && (
              <Pressable onPress={handleDelete} style={styles.headerButton}>
                <Trash2 size={20} color={colors.error} />
              </Pressable>
            )
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <Shirt size={48} color={colors.primary} />
        </View>

        {!isNew && item && (
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{item.times_worn}</Text>
              <Text style={styles.statLabel}>Times Worn</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {item.last_worn_at
                  ? new Date(item.last_worn_at).toLocaleDateString()
                  : 'Never'}
              </Text>
              <Text style={styles.statLabel}>Last Worn</Text>
            </View>
          </View>
        )}

        <View style={styles.form}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={text => setFormData({ ...formData, name: text })}
            placeholder="e.g., Blue Denim Jacket"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>Category *</Text>
          <View style={styles.chipContainer}>
            {categories.map(cat => (
              <Pressable
                key={cat}
                style={[
                  styles.chip,
                  formData.category === cat && styles.chipActive,
                ]}
                onPress={() => setFormData({ ...formData, category: cat })}
              >
                <Text
                  style={[
                    styles.chipText,
                    formData.category === cat && styles.chipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Brand</Text>
          <TextInput
            style={styles.input}
            value={formData.brand}
            onChangeText={text => setFormData({ ...formData, brand: text })}
            placeholder="e.g., Levi's"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>Colors (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={formData.colors}
            onChangeText={text => setFormData({ ...formData, colors: text })}
            placeholder="e.g., Blue, White"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>Size</Text>
          <TextInput
            style={styles.input}
            value={formData.size}
            onChangeText={text => setFormData({ ...formData, size: text })}
            placeholder="e.g., M, 32, 9.5"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>Condition</Text>
          <View style={styles.chipContainer}>
            {conditions.map(cond => (
              <Pressable
                key={cond}
                style={[
                  styles.chip,
                  formData.condition === cond && styles.chipActive,
                ]}
                onPress={() => setFormData({ ...formData, condition: cond })}
              >
                <Text
                  style={[
                    styles.chipText,
                    formData.condition === cond && styles.chipTextActive,
                  ]}
                >
                  {cond}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Purchase Price ($)</Text>
          <TextInput
            style={styles.input}
            value={formData.purchase_price}
            onChangeText={text => setFormData({ ...formData, purchase_price: text })}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Estimated Value ($)</Text>
          <TextInput
            style={styles.input}
            value={formData.estimated_value}
            onChangeText={text => setFormData({ ...formData, estimated_value: text })}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
          />
        </View>

        {!isNew && (
          <Pressable
            style={styles.logWearButton}
            onPress={() => logWearMutation.mutate()}
            disabled={logWearMutation.isPending}
          >
            <Text style={styles.logWearButtonText}>
              {logWearMutation.isPending ? 'Logging...' : 'Log Wear'}
            </Text>
          </Pressable>
        )}

        <Pressable
          style={styles.saveButton}
          onPress={() => saveMutation.mutate()}
          disabled={!formData.name || saveMutation.isPending}
        >
          <Save size={20} color={colors.background} />
          <Text style={styles.saveButtonText}>
            {saveMutation.isPending ? 'Saving...' : 'Save Item'}
          </Text>
        </Pressable>
      </ScrollView>
    </>
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
  },
  headerButton: {
    padding: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: tokens.spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: tokens.spacing.lg,
    gap: tokens.spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  form: {
    marginBottom: tokens.spacing.lg,
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
  logWearButton: {
    backgroundColor: colors.secondary,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  logWearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});
