import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import GlobalSOS from '../src/components/GlobalSOS';

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === 'login';

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, segments, initializing]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack 
        screenOptions={{ 
          headerShown: true,             // Standaard overal aan
          headerBackTitle: 'Terug',      // Tekst naast het pijltje (iOS)
          headerShadowVisible: false,    // Geen harde lijn onder de header
          headerStyle: { backgroundColor: '#F8FAFC' }, // Matcht met je pagina achtergrond
          headerTitleStyle: { fontWeight: 'bold', color: '#1E293B' },
        }}
      >
        {/* Login: Geen header nodig */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        
        {/* Tabs: Geen header nodig (de tabs hebben vaak hun eigen titels) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Andere schermen (zoals recovery_overview) erven de headerShown: true over */}
        <Stack.Screen 
          name="log/recovery_overview" 
          options={{ title: 'Analyse' }} 
        />
        <Stack.Screen 
          name="log/weekly_goals" 
          options={{ title: 'Weekly Goals' }} 
        />
      </Stack>

      {user && <GlobalSOS />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});