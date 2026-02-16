import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';

interface NavHeaderProps {
  title: string;
  backTo?: string; // Optioneel: forceer een specifieke route
}

export const NavHeader = ({ title, backTo }: NavHeaderProps) => {
  const router = useRouter();

  const handleBack = () => {
    if (backTo) {
      router.push(backTo as any);
    } else {
      router.back();
    }
  };

  return (
    <Stack.Screen 
      options={{ 
        title: title,
        headerShown: true,
        headerShadowVisible: false, // Houdt het strak
        headerStyle: { backgroundColor: '#F8FAFC' },
        headerTitleStyle: { fontWeight: 'bold', color: '#1E293B' },
        headerLeft: () => (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Terug</Text>
          </TouchableOpacity>
        ),
      }} 
    />
  );
};

const styles = StyleSheet.create({
  backBtn: {
    marginLeft: 5,
    padding: 5,
  },
  backText: {
    color: '#27AE60',
    fontWeight: 'bold',
    fontSize: 16,
  },
});