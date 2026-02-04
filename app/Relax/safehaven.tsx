import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const scripts = [
  { title: "De Reis", text: "Sluit je ogen of focus op een punt voor je. Haal diep adem. Stel je voor dat je over een pad loopt naar een plek waar je je volledig veilig voelt." },
  { title: "Jouw Plek", text: "Kijk om je heen. Is het een bos, een strand, of een kamer? Wat zie je? Let op de kleuren en het licht." },
  { title: "Zintuigen", text: "Wat hoor je? Misschien het ruisen van bladeren of verre golven. Wat ruik je? De frisse lucht, of misschien iets vertrouwds?" },
  { title: "Geborgenheid", text: "Voel de temperatuur op je huid. Zoek een plekje om te zitten. Je bent hier volkomen veilig. Niets kan je hier raken." },
  { title: "Zelfcompassie", text: "Leg je hand op je hart. Zeg tegen jezelf: 'Ik ben hier. Ik ben veilig. Ik zorg voor mezelf.' Blijf hier zolang je wilt." },
];

export default function SafeHavenScreen() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  const next = () => {
    if (step < scripts.length - 1) setStep(step + 1);
    else router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <MaterialCommunityIcons name="head-heart" size={50} color="#9B59B6" style={styles.icon} />
        <Text style={styles.stepTitle}>{scripts[step].title}</Text>
        <Text style={styles.stepText}>{scripts[step].text}</Text>
        
        <TouchableOpacity style={styles.nextBtn} onPress={next}>
          <Text style={styles.nextBtnText}>
            {step === scripts.length - 1 ? "Breng dit gevoel mee terug" : "Ga dieper..."}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDF2FB', justifyContent: 'center', padding: 25 },
  card: { backgroundColor: '#FFF', padding: 30, borderRadius: 30, elevation: 5, alignItems: 'center' },
  icon: { marginBottom: 20 },
  stepTitle: { fontSize: 24, fontWeight: 'bold', color: '#4A4E69', marginBottom: 15 },
  stepText: { fontSize: 18, color: '#95A5A6', textAlign: 'center', lineHeight: 28, marginBottom: 30 },
  nextBtn: { backgroundColor: '#9B59B6', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 25 },
  nextBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});