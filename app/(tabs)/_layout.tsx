import React from 'react';
import { Tabs } from 'expo-router';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorscheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colorscheme === 'dark' ? Colors.dark.tint : Colors.light.tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>

      {/* HOME TAB (met de SoberCounter) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol name="house" color={color} />,
        }}
      />

      {/* DE NIEUWE 5G SCHEMA TAB */}
      <Tabs.Screen
        name="five-g" 
        options={{
          title: '5G Schema',
          tabBarIcon: ({ color }) => <IconSymbol name="list.bullet" color={color} />,
        }}
      />

      
      <Tabs.Screen
      name="Logbook"
      options={{
        title: 'Logboek',
      tabBarIcon:({color}) => <IconSymbol name="book.fill" color={color}/>
      }}
      />

      <Tabs.Screen
        name="breathe"
        options={{
          title: 'ademhaling',
          tabBarIcon: ({color}) => <IconSymbol name="lungs.fill" color={color}/>,
        }}
      />

    <Tabs.Screen
    name= "plan"
    options={{
      title: 'Noodplan',
      tabBarIcon: ({ color}) => <IconSymbol name="shield.fill" color={color}/>,
    }}
    />

    <Tabs.Screen
    name="act"
    options={{
      title: 'waarden',
      tabBarIcon: ({ color}) => <IconSymbol name="star.fill" color={color}/>
    }}
    />

    </Tabs>
  );
}