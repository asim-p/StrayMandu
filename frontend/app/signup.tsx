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
} from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '../src/services/authService'; 
import { db } from '../src/config/firebase'; // Added Firebase DB import
import { doc, setDoc } from 'firebase/firestore'; // Added Firestore methods
import { MaterialIcons, AntDesign, Feather } from '@expo/vector-icons';
import StyledAlert from '../src/components/Alert';

// Theme colors
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
        <Text style={styles.label}>Sign up as</Text>
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

export default function Signup() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  
  const [userType, setUserType] = useState<'volunteer' | 'organization'>('volunteer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Focus states for styling
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const [alertState, setAlertState] = useState<{
    visible: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info';
  }>({ visible: false, title: '', message: '', type: 'info' });

  const handleSignup = async (): Promise<void> => {
    // Validation
    if (!name?.trim()) {
      setAlertState({ visible: true, title: 'Name Required', message: 'Please enter your name.', type: 'warning' });
      return;
    }
    if (!email?.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setAlertState({ visible: true, title: 'Invalid Email', message: 'Please enter a valid email address.', type: 'warning' });
      return;
    }
    if (password.length < 6) {
      setAlertState({ visible: true, title: 'Password Error', message: 'Password must be at least 6 characters.', type: 'warning' });
      return;
    }
    if (password !== confirmPassword) {
      setAlertState({ visible: true, title: 'Password Error', message: 'Passwords do not match!', type: 'warning' });
      return;
    }

    try {
      setLoading(true);
      
      // 1. Create User in Firebase Authentication
      const user = await authService.register(email.trim(), password);

      // 2. Store Additional User Profile in Firestore
      // We use the 'user.uid' as the document ID to link Auth and Database
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber?.trim() || '',
        userType: userType,
        createdAt: new Date().toISOString(),
      });

      setAlertState({
        visible: true,
        title: 'Success!',
        message: 'Account created successfully!',
        type: 'success',
      });

      setTimeout(() => {
        router.replace('/home');
      }, 1500);

    } catch (err: any) {
      console.error('Signup error:', err);
      
      // Handle Firebase specific error messages
      let friendlyMessage = "Unable to create account. Please try again.";
      if (err.includes("email-already-in-use")) {
        friendlyMessage = "This email is already registered. Try logging in.";
      } else if (err.includes("network-request-failed")) {
        friendlyMessage = "Network error. Please check your internet connection.";
      }

      setAlertState({
        visible: true,
        title: 'Signup Failed',
        message: friendlyMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundLight} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { minHeight: height - 50 }]} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.headerLeft}>
              <View style={styles.logoCircle}><MaterialIcons name="pets" size={20} color={COLORS.primary} /></View>
              <Text style={styles.appName}>StrayMandu</Text>
            </Pressable>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#374151" />
            </Pressable>
          </View>

          <View style={styles.mainContainer}>
            <View style={styles.welcomeSection}>
              <Text style={styles.title}>Join Our Rescuers</Text>
              <Text style={styles.subtitle}>Create an account and start making a difference for street dogs in Nepal.</Text>
            </View>

            <View style={styles.formContainer}>
              <UserTypeSelector selectedType={userType} onSelect={setUserType} />
                
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{userType === 'volunteer' ? 'Full Name' : 'Organization Name'}</Text>
                <View style={[styles.inputWrapper, nameFocused && styles.inputWrapperFocused]}>
                  <Feather name={userType === 'volunteer' ? "user" : "briefcase"} size={20} color={nameFocused ? COLORS.primary : COLORS.textLightGray} style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder={userType === 'volunteer' ? "Your Name" : "Rescue Group Name"} value={name} onChangeText={setName} onFocus={() => setNameFocused(true)} onBlur={() => setNameFocused(false)} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                  <MaterialIcons name="alternate-email" size={20} color={emailFocused ? COLORS.primary : COLORS.textLightGray} style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="volunteer@straymandu.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)} />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number (Optional)</Text>
                <View style={[styles.inputWrapper, phoneFocused && styles.inputWrapperFocused]}>
                  <Feather name="phone" size={20} color={phoneFocused ? COLORS.primary : COLORS.textLightGray} style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="e.g. 98xxxxxxxx" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" onFocus={() => setPhoneFocused(true)} onBlur={() => setPhoneFocused(false)} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
                  <MaterialIcons name="lock-outline" size={20} color={passwordFocused ? COLORS.primary : COLORS.textLightGray} style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry={!isPasswordVisible} onFocus={() => setPasswordFocused(true)} onBlur={() => setPasswordFocused(false)} />
                  <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                    <MaterialIcons name={isPasswordVisible ? "visibility" : "visibility-off"} size={20} color={COLORS.textLightGray} />
                  </Pressable>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={[styles.inputWrapper, confirmPasswordFocused && styles.inputWrapperFocused]}>
                  <MaterialIcons name="lock-outline" size={20} color={confirmPasswordFocused ? COLORS.primary : COLORS.textLightGray} style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="••••••••" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!isConfirmPasswordVisible} onFocus={() => setConfirmPasswordFocused(true)} onBlur={() => setConfirmPasswordFocused(false)} />
                  <Pressable onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} style={styles.eyeIcon}>
                    <MaterialIcons name={isConfirmPasswordVisible ? "visibility" : "visibility-off"} size={20} color={COLORS.textLightGray} />
                  </Pressable>
                </View>
              </View>

              <Pressable 
                style={({ pressed }) => [styles.signupButton, pressed && styles.buttonPressed, loading && { opacity: 0.6 }]}
                onPress={handleSignup}
                disabled={loading}
              >
                <Text style={styles.signupButtonText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#121811" />
              </Pressable>
            </View>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or quickly sign up with</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable style={({ pressed }) => [styles.googleButton, pressed && styles.buttonPressed]}>
              <AntDesign name="google" size={20} color="#DB4437" />
              <Text style={styles.googleButtonText}>Sign Up with Google</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={() => router.push('/login')}><Text style={styles.loginText}>Log in</Text></Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <StyledAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onDismiss={() => setAlertState({ ...alertState, visible: false })}
      />
    </SafeAreaView>
  );
}

// --- Styles for the new User Type Selector ---
const typeStyles = StyleSheet.create({
    selectorContainer: {
        marginBottom: 16,
        gap: 8,
    },
    optionsWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    option: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 10,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: COLORS.radioBorder,
        backgroundColor: COLORS.surfaceLight,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    optionActive: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(57, 229, 61, 0.1)',
    },
    optionText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textGray,
    },
    optionTextActive: {
        color: COLORS.textDark,
    }
});

// --- General Page Styles (Copied and retained for context) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(57, 229, 61, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
    letterSpacing: -0.5,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 450,
    alignSelf: 'center',
    width: '100%',
  },
  welcomeSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textGray,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: '90%',
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textDark,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  signupButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  signupButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#121811',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    color: COLORS.textLightGray,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLight,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.googleBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textGray,
  },
  loginText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});