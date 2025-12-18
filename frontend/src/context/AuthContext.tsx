import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

// 1. Define what data we want to share across the app
interface AuthContextType {
  user: User | null;      // The Firebase User object (or null if logged out)
  loading: boolean;       // Are we still checking if they are logged in?
  logout: () => Promise<void>; // A helper function to log out
}

// 2. Create the Context
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

// 3. Create the Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This listener fires whenever the user logs in, logs out, 
    // or when the app restarts and finds a stored session.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Update the user state
      setUser(currentUser);
      
      // CRITICAL: We are done checking, so set loading to false.
      // This tells the _layout.tsx it's safe to make a decision now.
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 4. Create a custom hook for easy access
export const useAuth = () => useContext(AuthContext);