import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const steps = [
  { id: 5, title: 'Zien', desc: 'Noem 5 dingen die je nu ziet.', icon: 'eye-outline' },
  { id: 4, title: 'Voelen', desc: 'Noem 4 dingen die je nu voelt (bijv. je voeten op de grond).', icon: 'hand-pointing-up' },
  { id: 3, title: 'Horen', desc: 'Noem 3 geluiden die je nu hoort.', icon: 'ear-hearing' },
  { id: 2, title: 'Ruiken', desc: 'Noem 2 dingen die je nu ruikt (of lekker vindt ruiken).', icon: 'scent' },
  { id: 1, title: 'Proeven', desc: 'Noem 1 ding dat je nu proeft (of je favoriete smaak).', icon: 'silverware-variant' },
];

export default function GroundingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.back();
    }
  };

  const step = steps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <MaterialCommunityIcons name="close" size={28} color="#2C3E50" />
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.progress}>{currentStep + 1} / 5</Text>
      </View>

      <View style={styles.content}>
        <MaterialCommunityIcons name={step.icon as any} size={80} color="#27AE60" />
        <Text style={styles.title}>{step.id} Dingen om te {step.title}</Text>
        <Text style={styles.desc}>{step.desc}</Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={next}>
        <Text style={styles.btnText}>
          {currentStep === steps.length - 1 ? 'Klaar' : 'Volgende'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', padding: 20 },
  header: { alignItems: 'flex-end', marginTop: 20 },
  progress: { fontWeight: 'bold', color: '#7F8C8D' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginTop: 20, textAlign: 'center' },
  desc: { fontSize: 18, color: '#7F8C8D', marginTop: 15, textAlign: 'center', lineHeight: 26 },
  btn: { backgroundColor: '#27AE60', padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 40 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 }
});