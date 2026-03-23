import React from 'react';
import { StyleSheet, View, FlatList, Pressable, SafeAreaView, ScrollView, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Sparkles } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import OutfitCard from '@/components/OutfitCard';
import Typography from '@/components/ui/Typography';

export default function OutfitsScreen() {
  const router = useRouter();
  const { outfits } = useWardrobeStore();
  
  const handleAddOutfit = () => {
    router.push('/add-outfit' as any);
  };
  
  const handleOutfitPress = (id: string) => {
    router.push(`/outfit/${id}` as any);
  };
  
  return (
    <ImageBackground
      source={require('../../assets/images/closet-backdrop.png')}
      style={{ flex: 1 }}
      imageStyle={{ width: '100%', height: '100%' }}
      resizeMode="cover"
    >
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Typography variant="h1" style={styles.title}>My Outfits</Typography>
            <Typography variant="caption" color={colors.textSecondary}>
              {outfits.length} {outfits.length === 1 ? 'outfit' : 'outfits'}
            </Typography>
          </View>
          <Pressable style={styles.addButton} onPress={handleAddOutfit}>
            <Plus size={20} color={colors.background} strokeWidth={2.5} />
          </Pressable>
        </View>
        
        {outfits.length > 0 ? (
          <FlatList
            data={outfits}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable onPress={() => handleOutfitPress(item.id)}>
                <OutfitCard outfit={item} />
              </Pressable>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <ScrollView contentContainerStyle={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Sparkles size={48} color={colors.textSecondary} />
            </View>
            <Typography variant="h2" style={styles.emptyTitle}>
              No outfits yet
            </Typography>
            <Typography variant="body" color={colors.textSecondary} style={styles.emptyMessage}>
              Create outfit combinations from your wardrobe items
            </Typography>
            <Pressable style={styles.createButton} onPress={handleAddOutfit}>
              <Typography variant="body" color={colors.background} style={styles.createButtonText}>
                Create Your First Outfit
              </Typography>
            </Pressable>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
    paddingBottom: tokens.spacing.lg,
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.shadow.sm,
  },
  listContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: 90,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.xl,
    paddingBottom: 90,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent'Secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.lg,
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: tokens.spacing.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    marginBottom: tokens.spacing.xl,
  },
  createButton: {
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: tokens.radius.lg,
    ...tokens.shadow.sm,
  },
  createButtonText: {
    fontWeight: '600',
  },
});