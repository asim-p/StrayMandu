import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';


// Get API URL from environment variables (backend URL)
const BASE = API_URL;

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


 * CREATE AXIOS INSTANCE
 * This is a custom axios client with base configuration
 * 
 * Why separate instance?
 * - Easier to manage API calls in one place
 * - Can add interceptors (middleware) for requests/responses
 * - Cleaner code
 */
const api = axios.create({
  baseURL: BASE,
  timeout: 10000,  // Wait 10 seconds max for response
});


api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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


export const authService = {

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


  register: async (userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    user_type: 'reporter' | 'tender';
  }): Promise<AuthResponse> => {
    try {
      // Send signup request to backend
      const response = await api.post<AuthResponse>('/api/users/register', userData);
      
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

 
  logout: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

 
  getToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem('authToken');
  },


  getUser: async () => {
    const userJson = await AsyncStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  },

  isAuthenticated: async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;  // Convert to boolean (true if token exists)
  },
};
