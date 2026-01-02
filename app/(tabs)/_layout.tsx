import React from "react";
import { Tabs, useRouter } from "expo-router";
import { View, Pressable, StyleSheet } from "react-native";
import { Shirt, Calendar, User, Plus } from "lucide-react-native";
import { colors, tokens } from "@/constants/colors";

const FloatingActionButton = () => {
  const router = useRouter();
  
  return (
    <View style={styles.floatingButtonContainer}>
      <Pressable
        style={styles.floatingButton}
        onPress={() => router.push('/quick-actions')}
      >
        <Plus size={28} color={colors.background} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
};

export default function TabLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.mediumGray,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Closet",
            tabBarIcon: ({ color }) => <Shirt size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="outfits"
          options={{
            title: "Outfit",
            tabBarIcon: ({ color }) => (
              <View style={styles.outfitIconContainer}>
                <Shirt size={20} color={color} />
                <Shirt size={16} color={color} style={styles.overlayIcon} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Calendar",
            tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => <User size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="wardrobe"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="wishlist"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            href: null,
          }}
        />
      </Tabs>
      <FloatingActionButton />
    </>
  );
}

const styles = StyleSheet.create({
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D4C5B0',
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.shadow.lg,
    elevation: 8,
  },
  outfitIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayIcon: {
    position: 'absolute',
    top: 4,
    left: 4,
  },
});