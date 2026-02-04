import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BreatheScreen() {
  const router = useRouter();
  const [status, setStatus] = useState('Klaar?');
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const runAnimation = () => {
    setStatus('Adem in...');
    Animated.sequence([
      // Inademen
      Animated.timing(scaleAnim, {
        toValue: 2,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      // Vasthouden
      Animated.delay(1000), // Korte pauze
      // Uitademen
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.delay(1000),
    ]).start(() => {
        if(status !== 'Gestopt') runAnimation();
    });
  };

  useEffect(() => {
    if (status === 'Adem in...') {
        // Logica voor wisselen tekst tijdens animatie
        const interval = setInterval(() => {
            setStatus(prev => prev === 'Adem in...' ? 'Adem uit...' : 'Adem in...');
        }, 5000);
        return () => clearInterval(interval);
    }
  }, [status]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <MaterialCommunityIcons name="close" size={28} color="#FFF" />
      </TouchableOpacity>

      <Text style={styles.statusText}>{status}</Text>

      <View style={styles.circleContainer}>
        <Animated.View style={[styles.circle, { transform: [{ scale: scaleAnim }] }]} />
        <View style={styles.staticCircle} />
      </View>

      <TouchableOpacity 
        style={styles.startBtn} 
        onPress={() => {
            if(status === 'Klaar?') runAnimation();
            else setStatus('Klaar?');
        }}
      >
        <Text style={styles.btnText}>{status === 'Klaar?' ? 'START' : 'STOP'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2C3E50', justifyContent: 'center', alignItems: 'center' },
  backBtn: { position: 'absolute', top: 50, left: 20 },
  statusText: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 60 },
  circleContainer: { justifyContent: 'center', alignItems: 'center' },
  circle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(52, 152, 219, 0.5)' },
  staticCircle: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#3498DB', borderStyle: 'dashed' },
  startBtn: { marginTop: 100, backgroundColor: '#3498DB', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 }
});