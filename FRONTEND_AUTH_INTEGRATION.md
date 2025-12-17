# Connecting Frontend Login to Backend Authentication

## 📊 Current State

**Backend** (`authController.js`):
- ✅ `/api/users/login` endpoint expects `{ email, password }`
- ✅ Returns `{ token, user }` on success
- ✅ Uses JWT for authentication

**Frontend** (`login.tsx`):
- ❌ `handleLogin()` just logs to console
- ❌ No API call to backend
- ❌ No token storage

---

## 🔧 Step-by-Step Implementation

### Step 1: Create an Auth API Service

Create `frontend/src/services/authService.ts`:

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    _id: string;
    email: string;
    name: string;
    user_type: 'reporter' | 'tender';
  };
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add token to requests automatically
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (token expired)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear storage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  /**
   * Login user with email and password
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/api/users/login', credentials);
      
      // Store token and user data
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Login failed');
      }
      throw error;
    }
  },

  /**
   * Register new user
   */
  register: async (userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    user_type: 'reporter' | 'tender';
  }): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/api/users/signup', userData);
      
      // Auto-login after signup
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Registration failed');
      }
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  /**
   * Get stored token
   */
  getToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem('authToken');
  },

  /**
   * Get stored user data
   */
  getUser: async () => {
    const userJson = await AsyncStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  },
};
```

### Step 2: Install Dependencies

```bash
cd frontend

# Install axios for API calls
npm install axios

# Install AsyncStorage for token storage
npx expo install @react-native-async-storage/async-storage
```

### Step 3: Update login.tsx

Replace the `handleLogin` function:

```typescript
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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { authService } from '@/src/services/authService';

// ... existing COLORS and other code ...

export default function Login() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);  // Loading state

  const handleLogin = async () => {
    // Validation
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Call backend API
      const response = await authService.login({ email, password });
      
      console.log('Login successful:', response.user);
      
      // Navigate to home/dashboard
      router.replace('/Tabs/home');
      
    } catch (error) {
      // Show error message
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      Alert.alert('Login Failed', errorMessage);
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundLight} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { minHeight: height - 50 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ... existing header and welcome section ... */}

          <View style={styles.mainContainer}>
            <View style={styles.welcomeSection}>
              <Text style={styles.title}>Welcome Back!</Text>
              <Text style={styles.subtitle}>
                Login to continue supporting the street dogs of Kathmandu.
              </Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[
                  styles.inputWrapper, 
                  emailFocused && styles.inputWrapperFocused
                ]}>
                  <MaterialIcons 
                    name="alternate-email" 
                    size={20} 
                    color={emailFocused ? COLORS.primary : COLORS.textLightGray} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="rescuer@straymandu.com"
                    placeholderTextColor={COLORS.textLightGray}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[
                  styles.inputWrapper,
                  passwordFocused && styles.inputWrapperFocused
                ]}>
                  <MaterialIcons 
                    name="lock-outline" 
                    size={20} 
                    color={passwordFocused ? COLORS.primary : COLORS.textLightGray} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textLightGray}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    editable={!loading}
                  />
                  <Pressable 
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    style={styles.eyeIcon}
                  >
                    <MaterialIcons 
                      name={isPasswordVisible ? "visibility" : "visibility-off"} 
                      size={20} 
                      color={COLORS.textLightGray} 
                    />
                  </Pressable>
                </View>
              </View>

              {/* Login Button */}
              <Pressable 
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && !loading && styles.buttonPressed,
                  loading && styles.loginButtonDisabled,
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

            {/* ... rest of component ... */}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Add this style
const styles = StyleSheet.create({
  // ... existing styles ...
  loginButtonDisabled: {
    opacity: 0.6,
  },
});
```

### Step 4: Create Auth Context (Optional but Recommended)

Create `frontend/src/context/AuthContext.tsx`:

```typescript
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/src/services/authService';

interface User {
  _id: string;
  email: string;
  name: string;
  user_type: 'reporter' | 'tender';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isSignout: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (data: any) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignout, setIsSignout] = useState(false);

  // Restore token on app start
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUser = await AsyncStorage.getItem('user');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Failed to restore token:', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const authContext: AuthContextType = {
    user,
    token,
    isLoading,
    isSignout,
    login: async (email: string, password: string) => {
      try {
        const response = await authService.login({ email, password });
        setToken(response.token);
        setUser(response.user);
        setIsSignout(false);
      } catch (error) {
        throw error;
      }
    },
    logout: async () => {
      await authService.logout();
      setToken(null);
      setUser(null);
      setIsSignout(true);
    },
    signup: async (data: any) => {
      try {
        const response = await authService.register(data);
        setToken(response.token);
        setUser(response.user);
        setIsSignout(false);
      } catch (error) {
        throw error;
      }
    },
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Step 5: Setup .env Variables

Create `frontend/.env.local`:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000
```

### Step 6: Update Backend .env

Make sure `backend/.env` has:

```env
MONGODB_URI=mongodb://localhost:27017/straymandu
JWT_SECRET=your_secret_key_here
PORT=5000
NODE_ENV=development
```

---

## 🔄 Complete Flow

```
1. User enters email & password in login.tsx
        ↓
2. handleLogin() validates input
        ↓
3. Calls authService.login({ email, password })
        ↓
4. authService makes POST request to /api/users/login
        ↓
5. Backend authController.login() processes request
        ├─ Finds user by email
        ├─ Compares password with bcryptjs
        ├─ Generates JWT token
        └─ Returns { token, user }
        ↓
6. Frontend stores token in AsyncStorage
        ↓
7. Stores user data in AsyncStorage
        ↓
8. Navigates to /Tabs/home (authenticated route)
```

---

## 🚀 Testing

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Start Frontend
```bash
cd frontend
npm start
```

### 3. Test Login
1. Create a test user first via signup
2. Try logging in with that email/password
3. Check browser console for logs
4. Should navigate to home page on success

### 4. Verify Token Storage
```bash
# Check if token is stored (in Expo Go or simulator)
# Create a debug screen to display stored data
```

---

## 🔒 Protected API Calls

Once you have the token, use it in other API calls:

```typescript
// In any component that needs to fetch dog reports
const getDogReports = async () => {
  const token = await authService.getToken();
  
  const response = await axios.get('/api/dogs', {
    headers: {
      Authorization: `Bearer ${token}`,
    }
  });
  
  return response.data;
};
```

Or use the interceptor (already set up in authService):

```typescript
// This will automatically add token to all requests
const response = await api.get('/api/dogs');
```

---

## ✅ Checklist

- [ ] Install axios and AsyncStorage
- [ ] Create `authService.ts`
- [ ] Update `login.tsx` with handleLogin logic
- [ ] Update backend `.env` with JWT_SECRET
- [ ] Update frontend `.env.local` with API_URL
- [ ] Test login flow
- [ ] Verify token is stored
- [ ] Test protected API calls

Let me know if you need help implementing any of these steps!
