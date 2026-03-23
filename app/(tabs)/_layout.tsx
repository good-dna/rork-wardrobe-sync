import React, { useState } from "react";
import { Tabs, useRouter } from "expo-router";
import { View, StyleSheet, Pressable, Modal, Text } from "react-native";
import { Shirt, Sparkles, Calendar, User, Plus, ShoppingBag, Wand2 } from 'lucide-react-native';
import { colors, tokens } from "@/constants/colors";

function FloatingAddButton() {
  const router = useRouter();
  const [showSheet, setShowSheet] = useState(false);

  return (
    <>
      <Pressable style={styles.floatingButton} onPress={() => setShowSheet(true)}>
        <Plus size={28} color={colors.background} strokeWidth={2.5} />
      </Pressable>

      <Modal visible={showSheet} transparent animationType="slide" onRequestClose={() => setShowSheet(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowSheet(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            {[
              { label: 'Add Item', sub: 'Add clothing to your closet', icon: <Shirt size={22} color={colors.primary} />, route: '/add-item' },
              { label: 'Create Outfit', sub: 'Build outfit combinations', icon: <Sparkles size={22} color={colors.secondary} />, route: '/add-outfit' },
              { label: 'Plan OOTD', sub: 'Schedule outfit for a day', icon: <Calendar size={22} color={colors.success} />, route: '/(tabs)/calendar' },
            ].map(({ label, sub, icon, route }) => (
              <Pressable key={label} style={styles.sheetItem} onPress={() => { setShowSheet(false); router.push(route as any); }}>
                <View style={styles.sheetIcon}>{icon}</View>
                <View style={styles.sheetText}>
                  <Text style={styles.sheetLabel}>{label}</Text>
                  <Text style={styles.sheetSub}>{sub}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export default function TabLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mediumGray,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          tabBarLabelStyle: { fontSize: 10, marginTop: 2 },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Shirt size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="wardrobe"
          options={{
            title: "Wardrobe",
            tabBarIcon: ({ color }) => <ShoppingBag size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="outfits"
          options={{
            title: "Outfits",
            tabBarIcon: ({ color }) => <Sparkles size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Calendar",
            tabBarIcon: ({ color }) => <Calendar size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="ai-stylist"
          options={{
            title: "AI Stylist",
            tabBarIcon: ({ color }) => <Wand2 size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => <User size={22} color={color} />,
          }}
        />
        <Tabs.Screen name="analytics" options={{ href: null }} />
        <Tabs.Screen name="wishlist" options={{ href: null }} />
      </Tabs>
      <FloatingAddButton />
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 76,
    left: '50%',
    marginLeft: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: 48,
    paddingTop: tokens.spacing.md,
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: colors.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: tokens.spacing.lg,
  },
  sheetItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: tokens.spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sheetIcon: {
    width: 48, height: 48, borderRadius: tokens.radius.lg,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center', marginRight: tokens.spacing.md,
  },
  sheetText: { flex: 1 },
  sheetLabel: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 2 },
  sheetSub: { fontSize: 13, color: colors.textSecondary },
});
