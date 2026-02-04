import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const walkSteps = [
  { title: "Beginnen", text: "Loop op een normaal tempo. Merk simpelweg op dat je beweegt." },
  { title: "Voetzolen", text: "Focus op het contact tussen je voeten en de grond. Hak, zool, tenen." },
  { title: "Ademhaling", text: "Koppel je ademhaling aan je passen. Bijv: 3 passen inademen, 3 passen uitademen." },
  { title: "Omgeving", text: "Breid je aandacht uit. Zie de ruimte om je heen zonder ergens naar te staren." },
  { title: "Volledig Bewust", text: "Voel de wind, de temperatuur en je hele lichaam in beweging." },
];

export default function SilentWalkScreen() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((s) => {
          const newSec = s + 1;
          // Elke 120 seconden (2 minuten) naar de volgende stap
          if (newSec % 120 === 0 && currentIdx < walkSteps.length - 1) {
            setCurrentIdx((prev) => prev + 1);
            Vibration.vibrate(500); // Korte trilling als herinnering
          }
          return newSec;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, currentIdx]);

  const step = walkSteps[currentIdx];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <MaterialCommunityIcons name="close" size={28} color="#2C3E50" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.timerCircle}>
          <Text style={styles.timerText}>
            {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
          </Text>
        </View>

        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepDesc}>{step.text}</Text>
        
        <Text style={styles.progressText}>Stap {currentIdx + 1} van {walkSteps.length}</Text>
      </View>

      <TouchableOpacity 
        style={[styles.mainBtn, { backgroundColor: isActive ? '#E74C3C' : '#27AE60' }]} 
        onPress={() => setIsActive(!isActive)}
      >
        <Text style={styles.btnText}>{isActive ? 'PAUZE' : 'START WANDELING'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', padding: 25 },
  closeBtn: { marginTop: 40 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  timerCircle: { width: 150, height: 150, borderRadius: 75, borderWidth: 5, borderColor: '#27AE60', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  timerText: { fontSize: 32, fontWeight: 'bold', color: '#2C3E50' },
  stepTitle: { fontSize: 26, fontWeight: 'bold', color: '#2E7D32', marginBottom: 15 },
  stepDesc: { fontSize: 18, color: '#546E7A', textAlign: 'center', lineHeight: 28, paddingHorizontal: 20 },
  progressText: { marginTop: 30, color: '#BDC3C7', fontWeight: 'bold' },
  mainBtn: { padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 40 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 }
});