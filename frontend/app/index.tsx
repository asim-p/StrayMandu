import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
  ImageBackground,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';

import { useRouter, type Href } from 'expo-router';

const { width } = Dimensions.get('window');

export default function Home() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(width))[0];

  const openMenu = () => {
    setMenuVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setMenuVisible(false));
  };

  const navigateTo = (path: Href) => {
    closeMenu();
    setTimeout(() => router.push(path), 300);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f6f8f6"
        translucent={false}
      />
      
      <View style={styles.container}>
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <View style={styles.logoContainer}>
              <Text style={styles.pawIcon}>🐾</Text>
            </View>
            <Text style={styles.appName}>StrayMandu</Text>
          </View>
          <Pressable 
            style={styles.menuButton}
            onPress={openMenu}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </Pressable>
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Image Section */}
          <View style={styles.heroContainer}>
            <ImageBackground
              source={require("../img/f2.png")}
              style={styles.heroImageCard}
              imageStyle={styles.heroImage}
            >
              <View style={styles.gradientOverlay} />
              
              <View style={styles.badgeContainer}>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>ACTIVE RESCUERS NEARBY</Text>
                </View>
              </View>
            </ImageBackground>
          </View>

          {/* Content Section */}
          <View style={styles.contentSection}>
            <Text style={styles.mainHeadline}>
              Every Bark{'\n'}
              <Text style={styles.headlineAccent}>Deserves a Home</Text>
            </Text>
            
            <Text style={styles.bodyText}>
              Be the voice for the voiceless. Join the community helping Kathmandu's street dogs find care and safety.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed
              ]}
              onPress={() => router.push('/tabs/report')}
            >
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.primaryButtonText}>Report a Stray</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed
              ]}
              onPress={() => router.push('/tabs/reportdocs')}
            >
              <Text style={styles.secondaryButtonText}>How You Can Help</Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already a volunteer?{' '}
              <Text 
                style={styles.footerLink}
                onPress={() => router.push('/login')}
              >
                Log in
              </Text>
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* Side Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.backdrop}
            onPress={closeMenu}
          />
          
          <Animated.View 
            style={[
              styles.menuContainer,
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
            {/* Decorative gradient blob */}
            <View style={styles.decorativeBlob} />

            <ScrollView 
              style={styles.menuScroll}
              contentContainerStyle={styles.menuContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Menu Header */}
              <View style={styles.menuHeader}>
                <View style={styles.menuHeaderLeft}>
                  <View style={styles.menuLogoContainer}>
                    <Text style={styles.menuPawIcon}>🐾</Text>
                  </View>
                  <Text style={styles.menuAppName}>StrayMandu</Text>
                </View>
                <Pressable 
                  style={styles.closeButton}
                  onPress={closeMenu}
                >
                  <Text style={styles.closeIcon}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.divider} />

              {/* Navigation Items */}
              <View style={styles.navSection}>
                <Pressable 
                  style={[styles.navItem, styles.navItemActive]}
                  onPress={() => navigateTo('/')}
                >
                  <Text style={[styles.navIcon, styles.navIconActive]}>🏠</Text>
                  <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
                </Pressable>

                <Pressable 
                  style={styles.navItem}
                  onPress={() => navigateTo('/tabs/report')}
                >
                  <Text style={styles.navIcon}>📍</Text>
                  <Text style={styles.navText}>Report a Stray</Text>
                </Pressable>

                <Pressable 
                  style={styles.navItem}
                  onPress={() => navigateTo('/tabs/reportdocs')}
                >
                  <Text style={styles.navIcon}>💚</Text>
                  <Text style={styles.navText}>How You Can Help</Text>
                </Pressable>

                <Pressable 
                  style={styles.navItem}
                  onPress={() => navigateTo('/tabs/home')}
                >
                  <Text style={styles.navIcon}>ℹ️</Text>
                  <Text style={styles.navText}>About Us</Text>
                </Pressable>

                <Pressable 
                  style={styles.navItem}
                  onPress={() => navigateTo('/tabs/home')}
                >
                  <Text style={styles.navIcon}>⚙️</Text>
                  <Text style={styles.navText}>App Settings</Text>
                </Pressable>
              </View>

              {/* Bottom Section */}
              <View style={styles.menuBottom}>
                <View style={styles.joinSection}>
                  <Text style={styles.joinTitle}>Join the community</Text>
                  <Text style={styles.joinSubtitle}>
                    Track your rescues and follow updates.
                  </Text>
                </View>

                <View style={styles.authButtons}>
                  <Pressable 
                    style={styles.loginButton}
                    onPress={() => navigateTo('/login')}
                  >
                    <Text style={styles.loginButtonText}>Log In</Text>
                  </Pressable>

                  <Pressable 
                    style={styles.signupButton}
                    onPress={() => navigateTo('/signup')}
                  >
                    <Text style={styles.signupButtonText}>Sign Up</Text>
                  </Pressable>
                </View>

                <View style={styles.menuFooter}>
                  <Text style={styles.version}>Non-chalants</Text>
                  <View style={styles.socialLinks}>
                    <Text style={styles.socialLink}>IdeaX 2025</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f6f8f6',
  },
  container: {
    flex: 1,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
    zIndex: 10,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(19, 34, 16, 0.05)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pawIcon: {
    fontSize: 20,
    color: '#37ec13',
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#121811',
    letterSpacing: -0.27,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  menuIcon: {
    fontSize: 24,
    color: '#121811',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  heroContainer: {
    marginTop: 16,
    width: '100%',
  },
  heroImageCard: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  heroImage: {
    borderRadius: 40,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  badgeContainer: {
    padding: 16,
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingLeft: 8,
    paddingRight: 16,
    borderRadius: 16,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#121811',
    letterSpacing: 1.5,
  },
  contentSection: {
    paddingTop: 32,
    paddingBottom: 16,
    alignItems: 'center',
  },
  mainHeadline: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    color: '#121811',
    lineHeight: 35.2,
    letterSpacing: -0.48,
  },
  headlineAccent: {
    color: 'rgba(55, 236, 19, 0.9)',
  },
  bodyText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(18, 24, 17, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 16,
    paddingHorizontal: 8,
    maxWidth: 320,
  },
  actionButtons: {
    marginTop: 'auto',
    gap: 12,
    paddingTop: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#37ec13',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#37ec13',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  locationIcon: {
    fontSize: 24,
    color: '#132210',
  },
  primaryButtonText: {
    color: '#132210',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 18,
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(18, 24, 17, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#121811',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 16,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  footer: {
    paddingTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(18, 24, 17, 0.6)',
    textAlign: 'center',
  },
  footerLink: {
    fontWeight: '700',
    color: '#121811',
    textDecorationLine: 'underline',
  },
  // Menu Styles
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  menuContainer: {
    width: '85%',
    maxWidth: 350,
    height: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    overflow: 'hidden',
  },
  decorativeBlob: {
    position: 'absolute',
    top: -64,
    right: -64,
    width: 128,
    height: 128,
    backgroundColor: 'rgba(60, 208, 61, 0.1)',
    borderRadius: 64,
    opacity: 0.6,
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
    zIndex: 10,
  },
  menuHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuLogoContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(60, 208, 61, 0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuPawIcon: {
    fontSize: 20,
  },
  menuAppName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    width: 40,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 24,
    marginBottom: 24,
  },
  navSection: {
    paddingHorizontal: 16,
    gap: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  navItemActive: {
    backgroundColor: 'rgba(60, 208, 61, 0.1)',
  },
  navIcon: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  navIconActive: {
    color: '#3CD03D',
  },
  navText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  navTextActive: {
    color: '#3CD03D',
    fontWeight: '600',
  },
  menuBottom: {
    marginTop: 'auto',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  joinSection: {
    marginBottom: 16,
  },
  joinTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  joinSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  authButtons: {
    gap: 12,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#3CD03D',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#3CD03D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signupButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  menuFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
  },
  version: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 16,
  },
  socialLink: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});