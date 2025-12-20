import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  Dimensions,
  StatusBar,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import OrgBottom from '../src/components/OrgBottom'; // <--- IMPORT ADDED

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

// Ensure these paths are correct relative to this file
const TEAM_MEMBERS = [
  { id: 1, name: 'Asim', role: 'Founder', img: require('../img/Asim.png') },
  { id: 2, name: 'Ashal', role: 'Tech Lead', img: require('../img/Ashal.png') },
  { id: 3, name: 'Prashan', role: 'Community', img: require('../img/Prashan.png') },
  { id: 4, name: 'Sumarga', role: 'Ops', img: require('../img/Sumarga.png') },
];

export default function About() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Sticky Header */}
      <View style={styles.header}>
        <Pressable 
          onPress={() => router.back()} 
          style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
        </Pressable>
        <Text style={styles.headerTitle}>About StrayMandu</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=800' }}
            style={styles.heroImage}
            imageStyle={{ borderRadius: 24 }}
          >
            <View style={styles.heroOverlay}>
              <View style={styles.sinceBadge}>
                <Text style={styles.sinceText}>SINCE 2023</Text>
              </View>
              <Text style={styles.heroTitle}>Saving Nepal's Strays, One Tap at a Time</Text>
            </View>
          </ImageBackground>
        </View>

        {/* Mission Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="pets" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Our Mission</Text>
          </View>
          <Text style={styles.cardBody}>
            We connect compassionate citizens with rescue organizations to provide immediate aid to injured and abandoned dogs in Kathmandu.
          </Text>
        </View>

        {/* Vision Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="visibility" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Our Vision</Text>
          </View>
          <Text style={styles.cardBody}>
            A Nepal where every dog has a safe home and a full belly. We dream of a community where humans and street dogs coexist in harmony.
          </Text>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500' }} 
            style={styles.visionImage} 
          />
        </View>

        {/* Team Section */}
        <View style={styles.teamSection}>
          <Text style={styles.sectionHeading}>Meet the Pack</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.teamScroll}
            snapToInterval={114} 
            decelerationRate="fast"
          >
            {TEAM_MEMBERS.map((member) => (
              <View key={member.id} style={styles.teamMember}>
                <Image 
                  source={member.img} 
                  style={styles.memberAvatar}
                  fadeDuration={300}
                />
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Contact Footer Card */}
        <View style={styles.contactCard}>
          <View>
            <Text style={styles.contactHeading}>Get in touch</Text>
            <Text style={styles.contactSub}>We'd love to hear from you</Text>
          </View>
          <View style={styles.socialIcons}>
            <Pressable style={styles.socialBtn}>
              <MaterialIcons name="mail-outline" size={20} color={COLORS.textMain} />
            </Pressable>
            <Pressable style={styles.socialBtn}>
              <MaterialIcons name="language" size={20} color={COLORS.textMain} />
            </Pressable>
            <Pressable style={styles.socialBtn}>
              <MaterialIcons name="share" size={20} color={COLORS.textMain} />
            </Pressable>
          </View>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <MaterialIcons name="pets" size={24} color={COLORS.primary} style={{ marginBottom: 8 }} />
          <Text style={styles.versionText}>StrayMandu v2.4.1</Text>
          <Text style={styles.copyrightText}>© 2024 StrayMandu Initiative</Text>
        </View>
      </ScrollView>

      {/* REUSABLE COMPONENT */}
      <OrgBottom activePage="aboutus" />

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
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    padding: 16,
    paddingBottom: 100, // <--- INCREASED PADDING so content isn't hidden by nav
  },
  heroContainer: {
    height: 320,
    width: '100%',
    marginBottom: 20,
  },
  heroImage: {
    flex: 1,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 24,
  },
  heroOverlay: {
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.35)',
    height: '100%',
    justifyContent: 'flex-end',
  },
  sinceBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  sinceText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textMain,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    lineHeight: 34,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  card: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(55,236,19,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  cardBody: {
    fontSize: 14,
    color: COLORS.textSub,
    lineHeight: 22,
    fontWeight: '500',
  },
  visionImage: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginTop: 16,
  },
  teamSection: {
    marginVertical: 10,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textMain,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  teamScroll: {
    paddingRight: 20,
  },
  teamMember: {
    alignItems: 'center',
    marginRight: 24,
    width: 90,
  },
  memberAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.primary,
    marginBottom: 8,
    backgroundColor: '#E5E7EB',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  memberRole: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  contactCard: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  contactHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  contactSub: {
    fontSize: 12,
    color: COLORS.gray,
  },
  socialIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  socialBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    opacity: 0.5,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSub,
  },
  copyrightText: {
    fontSize: 11,
    color: COLORS.textSub,
    marginTop: 4,
  },
});