import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { trackExerciseComplete } from '../../src/utils/progressTracker';

const instructions = [
  { time: 0, text: "Merk de drang op. Waar in je lichaam voel je het?" },
  { time: 60, text: "Strijd er niet tegen. Stel je voor dat het een golf is in de oceaan." },
  { time: 180, text: "De golf wordt nu krachtiger. Blijf rustig ademhalen en balanceer op je plank." },
  { time: 300, text: "Je bent op de piek. Dit is het lastigste punt, maar je houdt vol!" },
  { time: 480, text: "De golf begint langzaam af te zwakken. Voel de ontspanning terugkomen." },
  { time: 600, text: "De zee wordt rustig. Je bent veilig aan land gekomen." },
];

export default function UrgeSurfScreen() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const waveAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
    let interval: any; // Verander 'NodeJS.Timeout' naar 'any'
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);

      // Start golf-animatie
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 0,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const currentInstruction = [...instructions].reverse().find(i => seconds >= i.time)?.text;

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleFinish = async () => {
    await trackExerciseComplete('urgesurf');
    router.back();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <MaterialCommunityIcons name="close" size={28} color="#FFF" />
      </TouchableOpacity>

      <Text style={styles.timer}>{formatTime(seconds)}</Text>

      <View style={styles.waveContainer}>
        <Animated.View style={[styles.wave, {
          transform: [{
            translateY: waveAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -50]
            })
          }]
        }]}>
          <MaterialCommunityIcons name="waves" size={150} color="rgba(255,255,255,0.3)" />
        </Animated.View>
        <Text style={styles.instruction}>{currentInstruction}</Text>
      </View>

      <TouchableOpacity 
        style={[styles.btn, isActive ? styles.btnStop : styles.btnStart]} 
        onPress={() => setIsActive(!isActive)}
      >
        <Text style={styles.btnText}>{isActive ? 'PAUZEER SURF' : 'START SURFEN'}</Text>
      </TouchableOpacity>

      {seconds >= 600 && (
        <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
          <Text style={styles.btnText}>VOLTOOID</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2980B9', padding: 20, justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { alignSelf: 'flex-start', marginTop: 40 },
  timer: { fontSize: 48, fontWeight: 'bold', color: '#FFF', marginTop: 20 },
  waveContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  wave: { marginBottom: 20 },
  instruction: { fontSize: 20, color: '#FFF', textAlign: 'center', paddingHorizontal: 20, lineHeight: 30 },
  btn: { width: '100%', padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 20 },
  btnStart: { backgroundColor: '#27AE60' },
  btnStop: { backgroundColor: '#E67E22' },
  finishBtn: { width: '100%', padding: 20, borderRadius: 15, alignItems: 'center', backgroundColor: '#FFF', marginBottom: 40 },
  btnText: { fontWeight: 'bold', fontSize: 18, color: '#1A2E44' }
});