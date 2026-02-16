import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, Text } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorscheme = useColorScheme() ?? 'light';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#27AE60',
        headerShown: false,
        tabBarButton: Platform.OS === 'web' ? undefined : HapticTab,
        tabBarStyle: {
          position: 'relative',
          borderTopWidth: 1,
          backgroundColor: 'white',
        }
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: () => <Text>🏠</Text> }} />
      <Tabs.Screen name="log" options={{ title: 'Loggen', tabBarIcon: () => <Text>✍️</Text> }} />
      <Tabs.Screen name="insights" options={{ title: 'Inzichten', tabBarIcon: () => <Text>📊</Text> }} />
      <Tabs.Screen name="tree" options={{ title: 'Waardeboom', tabBarIcon: () => <Text>🌳</Text> }} />
      <Tabs.Screen name="relax" options={{ title: 'Relax', tabBarIcon: () => <Text>🧘</Text> }} />
      <Tabs.Screen name="settings" options={{ title: 'Instellingen', tabBarIcon: () => <Text>⚙️</Text> }} />
    </Tabs>
  );
}