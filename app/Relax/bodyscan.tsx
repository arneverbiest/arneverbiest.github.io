import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { trackExerciseComplete } from '../../src/utils/progressTracker';



const bodySteps = [
  { part: 'Voeten', instruction: 'Voel je hielen op de grond. Ontspan je tenen.' },
  { part: 'Benen', instruction: 'Laat je knieën zwaar worden. Ontspan je bovenbenen.' },
  { part: 'Buik & Rug', instruction: 'Adem rustig naar je buik. Laat spanning in je rug los.' },
  { part: 'Schouders', instruction: 'Laat je schouders zakken, weg van je oren.' },
  { part: 'Gezicht', instruction: 'Ontspan je kaken en je voorhoofd.' },
  { part: 'Volledige Rust', instruction: 'Voel je hele lichaam als één rustig geheel.' },
];

export default function BodyScanScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const progress = useState(new Animated.Value(0))[0];
  const router = useRouter();

  useEffect(() => {
    let timer: any; // Verander het type naar 'any' of gebruik de onderstaande window syntax
    
    if (isActive && stepIndex < bodySteps.length) {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: false,
      }).start();

      // Gebruik window.setTimeout om TypeScript te vertellen dat we een getal verwachten
      timer = window.setTimeout(() => {
        if (stepIndex < bodySteps.length - 1) {
          setStepIndex(stepIndex + 1);
        } else {
          setIsActive(false);
          setStepIndex(0); // Reset naar het begin als we klaar zijn
            trackExerciseComplete('bodyscan'); // Sla de voortgang op!
            Alert.alert("Goed gedaan!", "Je hebt de Body Scan voltooid. (+1 Zen-punt)");
        }
      }, 10000);
    }
    
    return () => window.clearTimeout(timer);
  }, [isActive, stepIndex]); 
  const toggle = () => {
    if (stepIndex === bodySteps.length - 1) setStepIndex(0);
    setIsActive(!isActive);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <MaterialCommunityIcons name="close" size={28} color="#2C3E50" />
      </TouchableOpacity>

      <View style={styles.content}>
        <MaterialCommunityIcons 
          name={isActive ? "human-handsup" : "human-greeting"} 
          size={100} 
          color="#9B59B6" 
        />
        
        <Text style={styles.partTitle}>{bodySteps[stepIndex].part}</Text>
        <Text style={styles.instructionText}>{bodySteps[stepIndex].instruction}</Text>

        {isActive && (
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFill, {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              })
            }]} />
          </View>
        )}
      </View>

      <TouchableOpacity style={[styles.mainBtn, { backgroundColor: isActive ? '#E74C3C' : '#9B59B6' }]} onPress={toggle}>
        <Text style={styles.btnText}>
          {isActive ? 'PAUZE' : (stepIndex === 0 ? 'START SCAN' : 'HERVAT')}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F4FF', padding: 20 },
  closeBtn: { marginTop: 20 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  partTitle: { fontSize: 32, fontWeight: 'bold', color: '#2C3E50', marginTop: 30 },
  instructionText: { fontSize: 20, color: '#7F8C8D', textAlign: 'center', marginTop: 15, lineHeight: 28 },
  progressBarBg: { width: '100%', height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, marginTop: 40, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#9B59B6' },
  mainBtn: { padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 40 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 }
});