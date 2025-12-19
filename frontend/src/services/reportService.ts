// src/services/reportService.ts
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Define the shape of our data for type safety
export interface DogReportData {
  reporterId: string; // The user UID from auth
  emergency: boolean;
  name?: string;
  breed: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string; // Optional human readable address
  };
  gender: 'Male' | 'Female' | 'Unknown';
  color: string;
  characteristics: string;
  condition: 'Neutral' | 'Healthy' | 'Injured' | 'Aggressive' | 'Unknown';
  description: string;
  imageUrls: string[]; // Array of Cloudinary URLs
  
  // UPDATED: Expanded status options
  status: 'pending' | 'ongoing' | 'resolved' | 'acknowledged';
  
  // NEW: Field for the rescuer, optional/null initially
  rescuerID?: string | null; 
}

export const saveDogReport = async (data: DogReportData) => {
  try {
    // 'reports' is the name of the collection in Firestore
    const docRef = await addDoc(collection(db, 'reports'), {
      ...data,
      // Ensure rescuerID is written to DB as null if not provided
      rescuerID: data.rescuerID || null, 
      createdAt: serverTimestamp(), // Let Firebase handle the server-side timestamp
    });
    console.log("Report Document written with ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
};