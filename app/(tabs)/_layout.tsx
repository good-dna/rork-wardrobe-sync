import React, { useState } from "react";
import { Tabs, useRouter } from "expo-router";
import { View, StyleSheet, Pressable, Modal } from "react-native";
import { Shirt, Sparkles, Calendar, User, Plus, ShoppingBag } from 'lucide-react-native';
import { colors, tokens } from "@/constants/colors";
import Typography from "@/components/ui/Typography";

function FloatingTabBar() {
  const router = useRouter();
  const [showActionSheet, setShowActionSheet] = useState(false);

  const handleActionPress = (action: 'item' | 'outfit' | 'ootd') => {
    setShowActionSheet(false);
    if (action === 'item') {
      router.push('/add-item' as any);
    } else if (action === 'outfit') {
      router.push('/add-outfit' as any);
    } else if (action === 'ootd') {
      router.push('/calendar' as any);
    }
  };

  return (
    <>
      <Pressable
        style={styles.floatingButton}
        onPress={() => setShowActionSheet(true)}
      >
        <Plus size={32} color={colors.text} strokeWidth={2.5} />
      </Pressable>

      <Modal
        visible={showActionSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionSheet(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowActionSheet(false)}
        >
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHandle} />
            
            <Pressable
              style={styles.actionItem}
              onPress={() => handleActionPress('item')}
            >
              <View style={styles.actionIcon}>
                <Shirt size={24} color={colors.primary} />
              </View>
              <View style={styles.actionTextContainer}>
                <Typography variant="body" style={styles.actionTitle}>Add Item</Typography>
                <Typography variant="caption" color={colors.textSecondary}>Add clothing to your closet</Typography>
              </View>
            </Pressable>

            <Pressable
              style={styles.actionItem}
              onPress={() => handleActionPress('outfit')}
            >
              <View style={styles.actionIcon}>
                <Sparkles size={24} color={colors.secondary} />
              </View>
              <View style={styles.actionTextContainer}>
                <Typography variant="body" style={styles.actionTitle}>Create Outfit</Typography>
                <Typography variant="caption" color={colors.textSecondary}>Generate outfit combinations</Typography>
              </View>
            </Pressable>

            <Pressable
              style={styles.actionItem}
              onPress={() => handleActionPress('ootd')}
            >
              <View style={styles.actionIcon}>
                <Calendar size={24} color={colors.success} />
              </View>
              <View style={styles.actionTextContainer}>
                <Typography variant="body" style={styles.actionTitle}>Plan OOTD</Typography>
                <Typography variant="caption" color={colors.textSecondary}>Schedule outfit for a day</Typography>
              </View>
            </Pressable>
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
            height: 72,
            paddingBottom: 12,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            marginTop: 2,
          },
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
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => <User size={22} color={color} />,
          }}
        />
        <Tabs.Screen name="wishlist" options={{ href: null }} />
        <Tabs.Screen name="analytics" options={{ href: null }} />
      </Tabs>
      <FloatingTabBar />
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 70,
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8D5C4',
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.shadow.lg,
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: 40,
    paddingTop: tokens.spacing.md,
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: tokens.spacing.lg,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.lg,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
});