import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Upload, Scan, Plus } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { router } from 'expo-router';

export default function AddScreen() {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const addMethods = [
    {
      id: 'camera',
      title: 'Take Photo',
      subtitle: 'Capture your sneaker with camera',
      icon: Camera,
      color: colors.primary,
      action: () => handleCameraAdd(),
    },
    {
      id: 'upload',
      title: 'Upload Photo',
      subtitle: 'Choose from your photo library',
      icon: Upload,
      color: colors.secondary,
      action: () => handleUploadAdd(),
    },
    {
      id: 'scan',
      title: 'Scan Barcode',
      subtitle: 'Scan product barcode or QR code',
      icon: Scan,
      color: colors.success,
      action: () => handleScanAdd(),
    },
    {
      id: 'manual',
      title: 'Manual Entry',
      subtitle: 'Add details manually',
      icon: Plus,
      color: colors.warning,
      action: () => handleManualAdd(),
    },
  ];

  const handleCameraAdd = () => {
    Alert.alert(
      'Camera Feature',
      'Camera integration will be available soon. This will allow you to take photos of your sneakers and automatically detect details.',
      [{ text: 'OK' }]
    );
  };

  const handleUploadAdd = () => {
    Alert.alert(
      'Upload Feature',
      'Photo upload will be available soon. You\'ll be able to select images from your gallery.',
      [{ text: 'OK' }]
    );
  };

  const handleScanAdd = () => {
    Alert.alert(
      'Barcode Scanner',
      'Barcode scanning will be available soon. This will automatically populate sneaker details.',
      [{ text: 'OK' }]
    );
  };

  const handleManualAdd = () => {
    router.push('/add-item');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add to Collection</Text>
        <Text style={styles.subtitle}>Choose how you'd like to add your sneaker</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.methodsContainer}>
          {addMethods.map((method) => {
            const IconComponent = method.icon;
            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodCard,
                  selectedMethod === method.id && styles.selectedCard
                ]}
                onPress={() => {
                  setSelectedMethod(method.id);
                  setTimeout(() => {
                    method.action();
                    setSelectedMethod(null);
                  }, 150);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: method.color }]}>
                  <IconComponent size={32} color={colors.background} />
                </View>
                <View style={styles.methodContent}>
                  <Text style={styles.methodTitle}>{method.title}</Text>
                  <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.quickStats}>
          <Text style={styles.statsTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Total Pairs</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>$0</Text>
              <Text style={styles.statLabel}>Collection Value</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Brands</Text>
            </View>
          </View>
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Pro Tips</Text>
          <View style={styles.tipsList}>
            <View style={styles.tip}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>
                Take photos in good lighting for better recognition
              </Text>
            </View>
            <View style={styles.tip}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>
                Include the shoebox for automatic size detection
              </Text>
            </View>
            <View style={styles.tip}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>
                Scan barcodes for instant product information
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.mediumGray,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  methodsContainer: {
    marginBottom: 32,
  },
  methodCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: colors.cardElevated,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  methodSubtitle: {
    fontSize: 14,
    color: colors.mediumGray,
  },
  quickStats: {
    marginBottom: 32,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.mediumGray,
    textAlign: 'center',
  },
  tips: {
    marginBottom: 32,
  },
  tipsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  tipsList: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});