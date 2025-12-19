import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, AntDesign, Feather } from '@expo/vector-icons';

// --- FIREBASE IMPORTS ---
import { authService } from '../src/services/authService';
import { db } from '../src/config/firebase'; 
import { doc, getDoc } from 'firebase/firestore';

const COLORS = {
  primary: '#39E53D',
  backgroundLight: '#F5F7F6',
  surfaceLight: '#FFFFFF',
  textDark: '#121811',
  textGray: '#6B7280',
  textLightGray: '#9CA3AF',
  radioBorder: '#D1D5DB',
  googleBorder: '#E5E7EB',
};

// --- Custom Component for User Type Selection ---
interface UserTypeSelectorProps {
  selectedType: 'volunteer' | 'organization';
  onSelect: (type: 'volunteer' | 'organization') => void;
}

const UserTypeSelector: React.FC<UserTypeSelectorProps> = ({ selectedType, onSelect }) => (
  <View style={typeStyles.selectorContainer}>
    <Text style={styles.label}>Login as</Text>
    <View style={typeStyles.optionsWrapper}>
      <Pressable
        style={[typeStyles.option, selectedType === 'volunteer' && typeStyles.optionActive]}
        onPress={() => onSelect('volunteer')}
      >
        <Feather name="users" size={20} color={selectedType === 'volunteer' ? COLORS.primary : COLORS.textGray} />
        <Text style={[typeStyles.optionText, selectedType === 'volunteer' && typeStyles.optionTextActive]}>Volunteer</Text>
      </Pressable>

      <Pressable
        style={[typeStyles.option, selectedType === 'organization' && typeStyles.optionActive]}
        onPress={() => onSelect('organization')}
      >
        <MaterialIcons name="apartment" size={20} color={selectedType === 'organization' ? COLORS.primary : COLORS.textGray} />
        <Text style={[typeStyles.optionText, selectedType === 'organization' && typeStyles.optionTextActive]}>Organization</Text>
      </Pressable>
    </View>
  </View>
);

export default function Login() {
  const router = useRouter();
  const { height } = useWindowDimensions();

  // Role State
  const [userType, setUserType] = useState<'volunteer' | 'organization'>('volunteer');
  
  // Input States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Focus UI States
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  /**
   * Main Login Handler with Role-Based Routing
   */
  const handleLogin = async (): Promise<void> => {
    // 1. Validation
    if (!email?.trim() || !password) {
      Alert.alert('Missing Info', 'Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);

      // 2. Authenticate User
      const userCredential = await authService.login(email.trim(), password);
      const uid = userCredential.user.uid;

      // 3. Fetch specific data from Firestore based on selection
      // Volunteers are in 'users' collection, Orgs are in 'organizations' collection
      const collectionName = userType === 'volunteer' ? 'users' : 'organizations';
      const userDoc = await getDoc(doc(db, collectionName, uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // 4. Dynamic Redirection
        if (userData.userType === 'organization') {
          console.log("Verified: Organization Role. Redirecting...");
          router.replace('/OrgHome');
        } else {
          console.log("Verified: Volunteer Role. Redirecting...");
          router.replace('/home');
        }
      } else {
        // Handle case where user selects the wrong role at login
        Alert.alert(
          'Account Mismatch', 
          `We couldn't find an ${userType} account with these credentials. Please check your "Login as" selection.`
        );
      }

    } catch (err: any) {
      console.error('Login error:', err);
      let friendlyMessage = 'Invalid email or password.';
      if (err.message?.includes('network-request-failed')) {
        friendlyMessage = 'Network error. Please check your connection.';
      }
      Alert.alert('Login Failed', friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundLight} />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { minHeight: height - 50 }]} 
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.headerLeft}>
              <View style={styles.logoCircle}><MaterialIcons name="pets" size={20} color={COLORS.primary} /></View>
              <Text style={styles.appName}>StrayMandu</Text>
            </Pressable>
          </View>

          <View style={styles.mainContainer}>
            <View style={styles.welcomeSection}>
              <Text style={styles.title}>Welcome Back!</Text>
              <Text style={styles.subtitle}>
                Login to continue your mission in helping Kathmandu's strays.
              </Text>
            </View>

            <View style={styles.formContainer}>
              {/* Role Selection UI */}
              <UserTypeSelector selectedType={userType} onSelect={setUserType} />

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                  <MaterialIcons 
                    name="alternate-email" 
                    size={20} 
                    color={emailFocused ? COLORS.primary : COLORS.textLightGray} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="rescuer@straymandu.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
                  <MaterialIcons 
                    name="lock-outline" 
                    size={20} 
                    color={passwordFocused ? COLORS.primary : COLORS.textLightGray} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                    <MaterialIcons 
                      name={isPasswordVisible ? "visibility" : "visibility-off"} 
                      size={20} 
                      color={COLORS.textLightGray} 
                    />
                  </Pressable>
                </View>
                <Pressable style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </Pressable>
              </View>

              {/* Action Button */}
              <Pressable 
                style={({ pressed }) => [
                  styles.loginButton, 
                  pressed && styles.buttonPressed, 
                  loading && { opacity: 0.7 }
                ]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#121811" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Log In</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#121811" />
                  </>
                )}
              </Pressable>
            </View>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable style={({ pressed }) => [styles.googleButton, pressed && styles.buttonPressed]}>
              <AntDesign name="google" size={20} color="#DB4437" />
              <Text style={styles.googleButtonText}>Log in with Google</Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Pressable onPress={() => router.push('/signup')}>
              <Text style={styles.signupLinkText}>Sign up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- STYLES ---

const typeStyles = StyleSheet.create({
  selectorContainer: { marginBottom: 8, gap: 8 },
  optionsWrapper: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  option: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 16,
    borderWidth: 1.5, borderColor: COLORS.radioBorder, backgroundColor: COLORS.surfaceLight,
    gap: 8, elevation: 1,
  },
  optionActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(57, 229, 61, 0.1)' },
  optionText: { fontSize: 14, fontWeight: '600', color: COLORS.textGray },
  optionTextActive: { color: COLORS.textDark }
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.backgroundLight },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(57, 229, 61, 0.1)', justifyContent: 'center', alignItems: 'center' },
  appName: { fontSize: 20, fontWeight: '700', color: COLORS.textDark, letterSpacing: -0.5 },
  mainContainer: { flex: 1, justifyContent: 'center', maxWidth: 450, alignSelf: 'center', width: '100%' },
  welcomeSection: { marginBottom: 24, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.textDark, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textGray, textAlign: 'center', lineHeight: 20, maxWidth: '90%' },
  formContainer: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceLight,
    borderRadius: 16, height: 56, paddingHorizontal: 16, elevation: 2,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  inputWrapperFocused: { borderColor: COLORS.primary, backgroundColor: '#FFFFFF' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: COLORS.textDark, height: '100%' },
  eyeIcon: { padding: 4 },
  forgotPassword: { alignSelf: 'flex-end', marginTop: 2 },
  forgotPasswordText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  loginButton: {
    flexDirection: 'row', backgroundColor: COLORS.primary, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 10, elevation: 4,
  },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  loginButtonText: { fontSize: 18, fontWeight: '700', color: '#121811' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { fontSize: 12, color: COLORS.textGray, fontWeight: '500' },
  googleButton: {
    flexDirection: 'row', height: 56, borderRadius: 28, borderWidth: 1,
    borderColor: COLORS.googleBorder, backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 1,
  },
  googleButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.textDark },
  footer: { marginTop: 24, flexDirection: 'row', justifyContent: 'center', paddingBottom: 20 },
  footerText: { fontSize: 14, color: COLORS.textGray },
  signupLinkText: { fontSize: 14, fontWeight: '700', color: COLORS.primary, textDecorationLine: 'underline' },
});