import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const soberSteps = [
  { id: 'S', title: 'STOP', desc: 'Stop waar je mee bezig bent. Neem een actieve, waardige houding aan.', icon: 'hand-stop' },
  { id: 'O', title: 'OBSERVEER', desc: 'Wat merk je op in je lichaam? Welke gedachten en gevoelens zijn er nu?', icon: 'eye-outline' },
  { id: 'B', title: 'BEWUST ADEMEN', desc: 'Breng je volledige aandacht naar je ademhaling. Volg elke in- en uitademing.', icon: 'weather-windy' },
  { id: 'E', title: 'EXPANSIE', desc: 'Breid je bewustzijn uit naar je hele lichaam en de ruimte om je heen.', icon: 'arrow-expand-all' },
  { id: 'R', title: 'RESPONS', desc: 'Kies nu bewust hoe je reageert, in plaats van je automatisme te volgen.', icon: 'check-circle-outline' },
];

export default function SoberScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const next = () => {
    if (currentStep < soberSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.back();
    }
  };

  const step = soberSteps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressContainer}>
        {soberSteps.map((s, index) => (
          <View key={s.id} style={[styles.progressDot, index <= currentStep && styles.activeDot]} />
        ))}
      </View>

      <View style={styles.content}>
        <Text style={styles.letter}>{step.id}</Text>
        <MaterialCommunityIcons name={step.icon as any} size={60} color="#E67E22" />
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.desc}>{step.desc}</Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={next}>
        <Text style={styles.btnText}>
          {currentStep === soberSteps.length - 1 ? 'Klaar & Bewust' : 'Volgende stap'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5E6', padding: 20 },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  progressDot: { width: 40, height: 6, backgroundColor: '#FAD7A0', borderRadius: 3, marginHorizontal: 4 },
  activeDot: { backgroundColor: '#E67E22' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  letter: { fontSize: 80, fontWeight: '900', color: 'rgba(230, 126, 34, 0.1)', position: 'absolute' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A2E44', marginTop: 20 },
  desc: { fontSize: 18, color: '#2C3E50', textAlign: 'center', marginTop: 15, lineHeight: 26 },
  btn: { backgroundColor: '#E67E22', padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 40 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 }
});