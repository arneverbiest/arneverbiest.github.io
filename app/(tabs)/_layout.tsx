import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Text } from 'react-native';
import tree from "./tree"; // Zorg dat de boom geladen wordt

export default function TabLayout() {
  const colorscheme = useColorScheme() ?? 'light';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorscheme].tabIconDefault,
        headerShown: false,
        // Alleen haptic feedback op mobiel om web-errors te voorkomen
        tabBarButton: Platform.OS === 'web' ? undefined : HapticTab,
        tabBarStyle: {
          // Zorg dat de balk niet over de content heen zweeft op mobiel
          position: 'relative',
          elevation: 0,
          borderTopWidth: 1,
        }
      }}>

      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}></Text>,
        }}
      />

   <Tabs.Screen
        name="log"
        options={{
          title: 'Loggen',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>✍️</Text>,
        }}
      />
      
      
         <Tabs.Screen
        name="insights"
        options={{
          title: 'overzicht',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📔</Text>,
        }}
      />


      <Tabs.Screen
        name="relax"
        options={{
          title: 'relax',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🧘</Text>,
        }}
      />



            <Tabs.Screen
        name="tree"
        options={{
          title: 'waardeboom',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🌳</Text>,
        }}
      />
      


      <Tabs.Screen
        name="settings"
        options={{
          title: 'instellingen',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}