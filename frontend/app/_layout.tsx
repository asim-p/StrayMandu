import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // 1. Get the current route name
    // If segments is empty (root), we default to "index"
    const currentRoute = segments[0] || "index";

    // 2. Define the "Guest Only" pages
    // These are the ONLY pages a logged-in user is NOT allowed to see
    const guestOnlyRoutes = ["index", "login", "signup"];

    // 3. Check if the current page is a guest page
    const isGuestPage = guestOnlyRoutes.includes(currentRoute);

    if (user && isGuestPage) {
      // SCENARIO: User is Logged In, but trying to view Login/Signup/Index.
      // ACTION: Redirect them to the main app (Home).
      router.replace("/home");
      
    } else if (!user && !isGuestPage) {
      // SCENARIO: User is Logged Out, but trying to view Home/Map/Profile.
      // ACTION: Kick them out to the start page.
      router.replace("/");
    }
    
    // SCENARIO: User is Logged In and goes to "/map".
    // "map" is NOT in guestOnlyRoutes.
    // The code does nothing, allowing the user to view the map.

  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#39E53D" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* List ALL your pages here so the router knows they exist */}
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="home" />
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