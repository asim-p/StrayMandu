import { useRouter, Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { authService } from '../../src/services/authService';

export default function ProtectedLayout() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await authService.isAuthenticated();
      if (!isAuth) {
        router.replace('/login'); // Redirect to login if not authenticated
      } else {
        setIsChecking(false); // Allow rendering if authenticated
      }
    };
    checkAuth();
  }, [router]);

  if (isChecking) {
    return null; // Or a loading spinner if you have one
  }

  return <Slot />; // Render the protected routes (e.g., home.tsx)
}