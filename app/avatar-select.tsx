import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Image, ActivityIndicator, Alert, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Check, Star } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { colors } from '@/constants/colors';

const AVATAR_SETTINGS_KEY = 'klotho_avatar_settings_v2';
const GOLD = '#C8A45D';
const DARK = 'rgba(14,11,7,0.92)';

export default function AvatarSelectScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const avatarUrls = JSON.parse(params.avatarUrls || '[]');
  const [selected, setSelected] = useState(avatarUrls[0] || null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selected || !user) return;
    setSaving(true);
    try {
      await supabase.from('profiles').update({ avatar_url: selected, updated_at: new Date().toISOString() }).eq('id', user.id);
      await supabase.from('avatar_profiles').update({ selected_avatar_url: selected, generation_status: 'ready', updated_at: new Date().toISOString() }).eq('user_id', user.id);
      const saved = await AsyncStorage.getItem(AVATAR_SETTINGS_KEY);
      const settings = saved ? JSON.parse(saved) : {};
      settings.avatarUrl = selected;
      settings.selectedAvatarUri = selected;
      await AsyncStorage.setItem(AVATAR_SETTINGS_KEY, JSON.stringify(settings));
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Error', 'Failed to save avatar. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ImageBackground source={require('../assets/images/closet-backdrop.png')} style={{ flex: 1 }} resizeMode="cover">
      <View style={s.overlay} />
      <SafeAreaView style={s.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={s.logoText}>KLOTHO</Text>
          <Text style={s.title}>Choose Your Avatar</Text>
          <Text style={s.subtitle}>Pick your favorite look. You can regenerate anytime from your profile.</Text>
          <View style={s.avatarGrid}>
            {avatarUrls.map((url, idx) => (
              <Pressable key={idx} style={[s.avatarCard, selected === url && s.avatarCardActive]} onPress={() => setSelected(url)}>
                <View style={s.avatarFrame}>
                  <Text style={s.frameBrand}>KLOTHO</Text>
                  <Image source={{ uri: url }} style={s.avatarImg} resizeMode="cover" />
                </View>
                <View style={s.avatarFooter}>
                  <Text style={s.avatarLabel}>Look {idx + 1}</Text>
                  {selected === url && <View style={s.checkBadge}><Check size={12} color="#000" /></View>}
                </View>
              </Pressable>
            ))}
          </View>
          {selected && (
            <View style={s.selectedPreview}>
              <View style={s.selectedFrame}>
                <Text style={s.selectedBrand}>KLOTHO</Text>
                <Image source={{ uri: selected }} style={s.selectedImg} resizeMode="cover" />
              </View>
              <View style={s.selectedBadge}>
                <Star size={12} color="#000" />
                <Text style={s.selectedBadgeText}>Your Default Avatar</Text>
              </View>
            </View>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
        <View style={s.footer}>
          <Pressable style={[s.saveBtn, (!selected || saving) && s.saveBtnDisabled]} onPress={handleSave} disabled={!selected || saving}>
            {saving ? <ActivityIndicator size="small" color="#000" /> : <><Check size={20} color="#000" /><Text style={s.saveBtnText}>Save My Avatar</Text></>}
          </Pressable>
          <Text style={s.footerNote}>You can update your avatar anytime from your profile.</Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,6,3,0.6)' },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, alignItems: 'center' },
  logoText: { fontSize: 13, fontWeight: '900', color: GOLD, letterSpacing: 6, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 19, marginBottom: 28 },
  avatarGrid: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 24 },
  avatarCard: { flex: 1, backgroundColor: DARK, borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(200,164,93,0.2)' },
  avatarCardActive: { borderColor: GOLD },
  avatarFrame: { backgroundColor: '#1a1510', padding: 8, alignItems: 'center' },
  frameBrand: { fontSize: 8, fontWeight: '900', color: GOLD, letterSpacing: 3, marginBottom: 6 },
  avatarImg: { width: '100%', aspectRatio: 3 / 4, borderRadius: 8 },
  avatarFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10 },
  avatarLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  checkBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  selectedPreview: { alignItems: 'center', width: '100%' },
  selectedFrame: { width: '65%', backgroundColor: '#1a1510', borderRadius: 20, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: GOLD, marginBottom: 14 },
  selectedBrand: { fontSize: 16, fontWeight: '900', color: GOLD, letterSpacing: 5, marginBottom: 10 },
  selectedImg: { width: '100%', aspectRatio: 3 / 4, borderRadius: 12 },
  selectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: GOLD, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  selectedBadgeText: { fontSize: 12, fontWeight: '700', color: '#000' },
  footer: { paddingHorizontal: 20, paddingBottom: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(200,164,93,0.1)' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: GOLD, borderRadius: 16, paddingVertical: 16 },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },
  footerNote: { fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 8 },
});
