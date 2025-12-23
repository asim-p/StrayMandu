import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  StatusBar,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BottomNav from '../src/components/BottomNav'; // Ensure path is correct

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#37ec13',
  backgroundLight: '#f6f8f6',
  surfaceLight: '#ffffff',
  textMain: '#121811',
  textSub: '#5c6f57',
  white: '#FFFFFF',
  gray: '#9CA3AF',
};

export default function Donate() {
  const router = useRouter();

  const handleSaveQR = () => {
    Alert.alert("Save QR", "Do you want to save this QR code to your gallery?");
  };

  const handleConfirmDonation = () => {
    Alert.alert("Thank You!", "Rescuers will be notified of incoming support. Every rupee counts! 🐾");
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          onPress={() => router.back()} 
          style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
        </Pressable>
        <Text style={styles.headerTitle}>Support the Cause</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Text Content */}
        <View style={styles.contentSection}>
          <Text style={styles.heroTitle}>Help us feed a stray today</Text>
          <Text style={styles.heroSubtitle}>
            Scan the QR code below with eSewa, Khalti, or your mobile banking app to donate.
          </Text>
        </View>

        {/* QR Card */}
        <View style={styles.qrContainer}>
          <View style={styles.qrCard}>
            <View style={styles.qrDecorLine} />
            <Pressable onLongPress={handleSaveQR} style={styles.qrFrame}>
              <Image
                source={require('../img/QR.png')} // Changed to valid placeholder for test
                style={styles.qrImage}
                resizeMode="contain"
              />
            </Pressable>
            <View style={styles.scanBadge}>
              <MaterialIcons name="qr-code-scanner" size={18} color={COLORS.primary} />
              <Text style={styles.scanBadgeText}>SCAN TO PAY</Text>
            </View>
          </View>
          <Text style={styles.saveInstruction}>Long press to save QR to gallery</Text>
        </View>

        {/* Trust Badge */}
        <View style={styles.trustBadge}>
          <MaterialIcons name="verified-user" size={16} color={COLORS.gray} />
          <Text style={styles.trustText}>Secure Payment via ConnectIPS</Text>
        </View>

        {/* Donated Button (Moved inside ScrollView to avoid Nav overlap) */}
        <Pressable 
          onPress={handleConfirmDonation}
          style={({ pressed }) => [
            styles.donateButton,
            pressed && { transform: [{ scale: 0.98 }], backgroundColor: '#32d611' }
          ]}
        >
          <Text style={styles.donateButtonText}>I've Donated</Text>
          <MaterialIcons name="check-circle" size={20} color={COLORS.textMain} />
        </Pressable>

      </ScrollView>

      {/* REUSABLE COMPONENT - INSIDE THE FUNCTION */}
      <BottomNav activePage="donate" />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surfaceLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for BottomNav
    alignItems: 'center',
  },
  contentSection: {
    paddingHorizontal: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textMain,
    textAlign: 'center',
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: 14,
    color: COLORS.textSub,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    fontWeight: '500',
  },
  qrContainer: {
    marginTop: 30,
    alignItems: 'center',
    width: '100%',
  },
  qrCard: {
    width: width * 0.85,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 40,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  qrDecorLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: COLORS.primary,
    opacity: 0.8,
  },
  qrFrame: {
    padding: 15,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F8FAFC',
    elevation: 2,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  scanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  scanBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSub,
    letterSpacing: 1.5,
  },
  saveInstruction: {
    marginTop: 16,
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    gap: 6,
    opacity: 0.6,
    marginBottom: 30,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray,
  },
  // Updated Button Style to work inside ScrollView
  donateButton: {
    backgroundColor: COLORS.primary,
    height: 60,
    width: width * 0.85, // specific width since it's no longer absolute
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 20, // Add spacing from bottom
  },
  donateButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textMain,
  },
});