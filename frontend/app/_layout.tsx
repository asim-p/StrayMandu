import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../src/config/firebase";

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isCheckingRole, setIsCheckingRole] = useState(false);

  useEffect(() => {
    if (loading || isCheckingRole) return;

    const determineRoute = async () => {
      const currentRoute = segments[0] || "index";
      const guestOnlyRoutes = ["index", "login", "signup"];
      const isGuestPage = guestOnlyRoutes.includes(currentRoute);

      if (user && isGuestPage) {
        setIsCheckingRole(true);
        try {
          // Check if user exists in the 'organizations' collection
          const orgDoc = await getDoc(doc(db, "organizations", user.uid));
          
          if (orgDoc.exists()) {
            router.replace("/OrgHome");
          } else {
            // Default to volunteer home
            router.replace("/home");
          }
        } catch (error) {
          console.error("Error checking role:", error);
          router.replace("/home"); // Fallback
        } finally {
          setIsCheckingRole(false);
        }
      } else if (!user && !isGuestPage) {
        router.replace("/");
      }
    };

    determineRoute();
  }, [user, loading, segments]);

  // Show loading spinner if auth is loading OR if we are fetching the user role
  if (loading || isCheckingRole) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#F5F7F6' }}>
        <ActivityIndicator size="large" color="#39E53D" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="home" />
      <Stack.Screen name="OrgHome" /> 
      <Stack.Screen name="map" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}