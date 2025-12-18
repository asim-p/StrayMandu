import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  StatusBar,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, db } from '../src/config/firebase'; // Adjust this path based on your folder structure
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { authService } from '../src/services/authService'; // Adjust this path

const COLORS = {
  primary: '#37ec13',
  backgroundLight: '#f6f8f6',
  surfaceLight: '#ffffff',
  textMain: '#121811',
  textSub: '#5c6f57',
  white: '#FFFFFF',
  gray: '#9CA3AF',
  red: '#ef4444',
};

export default function Profile() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Real User State
  const [userData, setUserData] = useState({
    name: 'User',
    email: '',
    photoURL: null,
    location: 'Nepal', // Default
    reportsCount: 0,   // Default
  });

  useEffect(() => {
    // Listen for Auth changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 1. Get basic info from Auth
        const basicInfo = {
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          photoURL: user.photoURL,
          location: 'Kathmandu, Nepal',
          reportsCount: 0,
        };

        // 2. Optional: Get extra data (Location/Reports) from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            basicInfo.location = data.location || basicInfo.location;
            basicInfo.reportsCount = data.reportsCount || 0;
          }
        } catch (error) {
          console.log("Error fetching firestore data:", error);
        }

        setUserData(basicInfo);
      } else {
        // Redirect to login if not authenticated
        router.replace('/login');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive", 
        onPress: async () => {
          await authService.logout();
          router.replace('/login');
        } 
      }
    ]);
  };

  const ProfileButton = ({ icon, title, subtitle, onPress, showChevron = true, isLast = false, rightContent }: any) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        pressed && { backgroundColor: '#f9fafb' },
        !isLast && styles.menuBorder,
      ]}
    >
      <View style={styles.menuIconContainer}>
        <MaterialIcons name={icon} size={22} color={COLORS.textMain} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {rightContent ? rightContent : (showChevron && <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />)}
    </Pressable>
  );

  if (loading) return <View style={styles.loadingArea}><Text>Loading profile...</Text></View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* User Info Section */}
        <View style={styles.profileHero}>
          <View style={styles.avatarContainer}>
            <Image 
              source={userData.photoURL ? { uri: userData.photoURL } : require('../img/Asim.png')} 
              style={styles.avatar} 
            />
            <Pressable style={styles.cameraBtn}>
              <MaterialIcons name="photo-camera" size={18} color={COLORS.primary} />
            </Pressable>
          </View>
          <Text style={styles.userName}>{userData.name}</Text>
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={16} color={COLORS.textSub} />
            <Text style={styles.locationText}>{userData.location}</Text>
          </View>

          <Pressable style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
            <MaterialIcons name="edit" size={18} color={COLORS.textMain} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </Pressable>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconCircle, { backgroundColor: '#eff6ff' }]}>
              <MaterialIcons name="assignment" size={20} color="#2563eb" />
            </View>
            <Text style={styles.statNumber}>{userData.reportsCount}</Text>
            <Text style={styles.statLabel}>MY REPORTS</Text>
          </View>
        </View>

        {/* Activity Section */}
        <Text style={styles.sectionTitle}>My Activity</Text>
        <View style={styles.menuGroup}>
          <ProfileButton 
            icon="article" 
            title="My Reports" 
            subtitle="Check status of reported dogs" 
            onPress={() => router.push('/report')}
            isLast={true}
          />
        </View>

        {/* Settings Section */}
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.menuGroup}>
          <ProfileButton 
            icon="notifications" 
            title="Notifications" 
            rightContent={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#d1d5db', true: COLORS.primary }}
                thumbColor={Platform.OS === 'ios' ? '#fff' : notificationsEnabled ? '#fff' : '#f4f3f4'}
              />
            }
          />
          <ProfileButton icon="shield" title="Privacy & Security" />
          <ProfileButton 
            icon="translate" 
            title="Language" 
            rightContent={<Text style={styles.languageText}>English</Text>}
            isLast={true}
          />
        </View>

        {/* Logout Button */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color={COLORS.red} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        <View style={styles.footerInfo}>
          <MaterialIcons name="pets" size={20} color={COLORS.primary} style={{ marginBottom: 4 }} />
          <Text style={styles.versionText}>StrayMandu v2.4.1</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingArea: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.backgroundLight },
  safeArea: { flex: 1, backgroundColor: COLORS.backgroundLight },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  profileHero: { alignItems: 'center', paddingVertical: 20 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: COLORS.white },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.white, padding: 8, borderRadius: 20, elevation: 4 },
  userName: { fontSize: 24, fontWeight: '800', color: COLORS.textMain },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  locationText: { fontSize: 16, color: COLORS.textSub, fontWeight: '500' },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30, marginTop: 20, gap: 8, elevation: 5 },
  editBtnText: { fontSize: 14, fontWeight: '800', color: COLORS.textMain },
  statsContainer: { paddingHorizontal: 16, marginTop: 10 },
  statCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 16, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: '#e5e7eb' },
  statIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statNumber: { fontSize: 22, fontWeight: '900', color: COLORS.textMain },
  statLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textSub, letterSpacing: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain, marginTop: 30, marginBottom: 12, paddingHorizontal: 20 },
  menuGroup: { backgroundColor: COLORS.white, borderRadius: 24, marginHorizontal: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuIconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f1f4f0', justifyContent: 'center', alignItems: 'center' },
  menuTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMain },
  menuSubtitle: { fontSize: 13, color: COLORS.textSub, marginTop: 2 },
  languageText: { fontSize: 14, fontWeight: '700', color: COLORS.textSub },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', marginHorizontal: 16, marginTop: 30, padding: 16, borderRadius: 30, gap: 8, borderWidth: 1, borderColor: '#fee2e2' },
  logoutText: { fontSize: 16, fontWeight: '800', color: COLORS.red },
  footerInfo: { alignItems: 'center', marginTop: 30, opacity: 0.4 },
  versionText: { fontSize: 12, fontWeight: '700', color: COLORS.textSub },
});