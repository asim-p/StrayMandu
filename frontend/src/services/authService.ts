import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AUTHSERVICE.TS - Authentication Service
 * 
 * PURPOSE:
 * This service handles all authentication-related API calls to the backend.
 * It centralizes login/signup logic and manages JWT tokens.
 * 
 * WHAT IT DOES:
 * 1. Makes API requests to backend (/api/users/login, /api/users/signup)
 * 2. Stores JWT tokens securely in AsyncStorage
 * 3. Automatically adds tokens to all future API requests
 * 4. Handles errors and provides meaningful error messages
 * 5. Manages user session (login, logout, check auth status)
 * PURPOSE:
 * This service handles all authentication-related API calls to the backend.
 * It centralizes login/signup logic and manages JWT tokens.
 * 
 * WHAT IT DOES:
 * 1. Makes API requests to backend (/api/users/login, /api/users/signup)
 * 2. Stores JWT tokens securely in AsyncStorage
 * 3. Automatically adds tokens to all future API requests
 * 4. Handles errors and provides meaningful error messages
 * 5. Manages user session (login, logout, check auth status)
 */

// Get API URL from environment variables (backend URL)
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * TypeScript Interface: What data the login request expects
 */
interface LoginRequest {
  email: string;
  password: string;
}

/**
 * TypeScript Interface: What the backend returns after successful login/signup
 */
interface AuthResponse {
  token: string;  // JWT token for authenticated requests
  user: {
    _id: string;
    email: string;
    name: string;
    user_type: 'volunteer' | 'organization';
  };
}

/**
 * CREATE AXIOS INSTANCE
 * This is a custom axios client with base configuration
 * 
 * Why separate instance?
 * - Easier to manage API calls in one place
 * - Can add interceptors (middleware) for requests/responses
 * - Cleaner code
 */
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,  // Wait 10 seconds max for response
});

/**
 * REQUEST INTERCEPTOR
 * Runs BEFORE every API request
 * 
 * WHAT IT DOES:
 * - Gets the stored token from AsyncStorage
 * - Automatically adds it to the Authorization header
 * - So every request includes: Authorization: Bearer <token>
 * 
 * BENEFIT:
 * You don't have to manually add the token to every request!
 */
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * RESPONSE INTERCEPTOR
 * Runs AFTER every API response
 * 
 * WHAT IT DOES:
 * - Checks if response has 401 error (unauthorized)
 * - This means token is invalid/expired
 * - Clears the token from storage so user needs to login again
 * 
 * BENEFIT:
 * Automatically logs out user if their session expires
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

/**
 * EXPORT AUTHSERVICE OBJECT
 * Contains all authentication methods
 */
export const authService = {
  /**
   * LOGIN
   * 
   * WHAT IT DOES:
   * 1. Takes email and password from user
   * 2. Sends POST request to backend /api/users/login
   * 3. Backend verifies credentials (checks password hash)
   * 4. Backend returns JWT token if credentials are correct
   * 5. We store the token in AsyncStorage for future use
   * 6. We store the user data for displaying user info
   * 
   * EXAMPLE USAGE:
   * try {
   *   const response = await authService.login({ 
   *     email: 'user@example.com', 
   *     password: 'password123' 
   *   });
   *   console.log('Logged in:', response.user.name);
   * } catch (error) {
   *   console.log('Login failed:', error.message);
   * }
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      // STEP 1: Send login request to backend
      const response = await api.post<AuthResponse>('/api/users/login', credentials);
      
      // STEP 2: Backend returned token and user
      // STEP 3: Save token to AsyncStorage (permanent storage)
      // - This token persists even if app is closed
      // - Allows user to stay logged in after restart
      await AsyncStorage.setItem('authToken', response.data.token);
      
      // STEP 4: Save user data to AsyncStorage
      // - Useful for displaying user name, email, etc.
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      
      // STEP 5: Return the data (login.tsx will use this)
      return response.data;
    } catch (error) {
      // Handle errors from axios
      if (axios.isAxiosError(error)) {
        // If backend sent error message, use it
        // Otherwise use generic message
        throw new Error(error.response?.data?.message || 'Login failed');
      }
      throw error;
    }
  },

/**
   * SIGNUP / REGISTER
   * 
   * WHAT IT DOES:
   * 1. Takes user data (email, password, name, etc.)
   * 2. Sends POST request to backend /api/users/signup
   * 3. Backend hashes password and saves new user to MongoDB
   * 4. Backend returns JWT token (auto-login after signup)
   * 5. We store token and user data
   * 
   * EXAMPLE USAGE:
   * try {
   *   const response = await authService.register({
   *     email: 'newuser@example.com',
   *     password: 'password123',
   *     name: 'John Doe',
   *     user_type: 'reporter'
   *   });
   *   console.log('Account created!');
   * } catch (error) {
   *   console.log('Signup failed:', error.message);
   * }
   */
  register: async (userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    user_type: 'reporter' | 'tender';
  }): Promise<AuthResponse> => {
    try {
      // Send signup request to backend
      const response = await api.post<AuthResponse>('/api/users/signup', userData);
      
      // Auto-login: save token so user is immediately logged in
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
   * LOGOUT
   * 
   * WHAT IT DOES:
   * 1. Removes token from AsyncStorage
   * 2. Removes user data from AsyncStorage
   * 3. User is no longer authenticated
   * 
   * NOTE:
   * We don't call backend logout API because JWT doesn't require it
   * JWT is stateless - token is valid until it expires
   * 
   * EXAMPLE USAGE:
   * await authService.logout();
   * navigation.replace('/login');
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
   * GET TOKEN
   * 
   * WHAT IT DOES:
   * Retrieves the stored JWT token from AsyncStorage
   * 
   * USEFUL FOR:
   * - Making authenticated API calls in other services
   * - Checking if user is logged in
   * - Sending token to other APIs
   * 
   * RETURNS:
   * Token string, or null if not found
   * 
   * EXAMPLE USAGE:
   * const token = await authService.getToken();
   * if (token) {
   *   console.log('User is logged in');
   * } else {
   *   console.log('User is NOT logged in');
   * }
   */
  getToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem('authToken');
  },

  /**
   * GET USER
   * 
   * WHAT IT DOES:
   * Retrieves the stored user data from AsyncStorage
   * 
   * USEFUL FOR:
   * - Display user name/email in UI
   * - Check user type (reporter vs tender)
   * - Show user profile
   * 
   * RETURNS:
   * User object, or null if not found
   * 
   * EXAMPLE USAGE:
   * const user = await authService.getUser();
   * if (user) {
   *   console.log('User:', user.name);
   *   console.log('Type:', user.user_type);
   * }
   */
  getUser: async () => {
    const userJson = await AsyncStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  },

  /**
   * IS AUTHENTICATED
   * 
   * WHAT IT DOES:
   * Checks if user has a valid token (is logged in)
   * 
   * USEFUL FOR:
   * - Route guards (show login page or dashboard)
   * - Protecting screens that need authentication
   * 
   * RETURNS:
   * true if token exists, false otherwise
   * 
   * EXAMPLE USAGE:
   * const isLoggedIn = await authService.isAuthenticated();
   * if (isLoggedIn) {
   *   navigation.replace('/dashboard');
   * } else {
   *   navigation.replace('/login');
   * }
   */
  isAuthenticated: async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;  // Convert to boolean (true if token exists)
  },
};

/**
 * SUMMARY
 * 
 * authService handles:
 * ✓ Login - authenticates user and gets token
 * ✓ Signup - creates new user and auto-logins
 * ✓ Logout - clears token and user data
 * ✓ Token Management - stores/retrieves JWT token
 * ✓ User Management - stores/retrieves user data
 * ✓ Auto Token Injection - adds token to all API requests automatically
 * ✓ Error Handling - provides meaningful error messages
 * 
 * FLOW:
 * 1. User enters email/password in login.tsx
 * 2. login.tsx calls authService.login()
 * 3. authService makes POST /api/users/login request
 * 4. Backend verifies and returns token
 * 5. authService stores token in AsyncStorage
 * 6. login.tsx navigates to home screen
 * 7. All future requests automatically include token (via interceptor)
 * 
 * SECURITY:
 * - Token is stored securely in AsyncStorage
 * - Token is automatically sent with every request
 * - If token expires (401), user is logged out automatically
 * - Password is NOT stored, only token is
 */
