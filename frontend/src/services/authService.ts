import { auth } from "../config/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from "firebase/auth";


export const authService = {
  // Sign Up
  register: async (email: string, pass: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      return userCredential.user;
    } catch (error: any) {
      throw error.message;
    }
  },

  // Log In
  login: async (email: string, pass: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      return userCredential.user;
    } catch (error: any) {
      throw error.message;
    }
  },

  // Log Out
  logout: async () => {
    await signOut(auth);
  }
};