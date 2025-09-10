import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Shirt, Calendar, Search, User } from 'lucide-react-native';
import { colors } from '@/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home size={24} color={color} fill={focused ? color : 'none'} />
          ),
        }}
      />
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: 'Closet',
          tabBarIcon: ({ color, focused }) => (
            <Shirt size={24} color={color} fill={focused ? color : 'none'} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused }) => (
            <Calendar size={24} color={color} fill={focused ? color : 'none'} />
          ),
        }}
      />
      <Tabs.Screen
        name="outfits"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <Search size={24} color={color} fill={focused ? color : 'none'} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User size={24} color={color} fill={focused ? color : 'none'} />
          ),
        }}
      />
      {/* Hide other tabs */}
      <Tabs.Screen
        name="wishlist"
        options={{
          href: null, // This hides the tab
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          href: null, // This hides the tab
        }}
      />
    </Tabs>
  );
}