import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { db, auth } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { resetTree } from '../src/services/treeservice';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, interpolate, Extrapolate } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;

const ALL_VALUES_LIST = ["Aandacht", "Eerlijkheid", "Macht", "Stabiliteit", "Aanpassen", "Empathie", "Milieubewust", "Structuur", "Acceptatie", "Enthousiasme", "Mindful", "Tactvol", "Afwisseling", "Erkenning", "Moed", "Tevredenheid", "Altruïsme", "Excelleren", "Nauwkeurigheid", "Toewijding", "Ambitieus", "Familie", "Nederigheid", "Traditie", "Assertiviteit", "Flexibiliteit", "Nieuwsgierigheid", "Trouw", "Attent", "Gastvrijheid", "Nut", "Uitdaging", "Authenticiteit", "Geduld", "Ontspanning", "Veiligheid", "Autonomie", "Gelijkwaardigheid", "Ontwikkeling", "Verantwoordelijkheid", "Avontuurlijkheid", "Georganiseerd", "Openheid", "Verbeelding", "Balans", "Gezag", "Oprechtheid", "Verbinding", "Behulpzaamheid", "Gezelligheid", "Optimisme", "Verdraagzaamheid", "Bekwaamheid", "Gezondheid", "Originaliteit", "Vergeving", "Bemoedigend", "Groei", "Passie", "Vertrouwen", "Bescheidenheid", "Hoffelijkheid", "Plezier", "Verwondering", "Beschermen", "Hoop", "Plichtsgetrouw", "Vriendschap", "Vrijgevigheid", "Betrokkenheid", "Hulpvaardigheid", "Praktisch", "Vrijheid", "Betrouwbaarheid", "Humor", "Professionaliteit", "Vrijheid", "Bewustzijn", "Ijverig", "Rationaliteit", "Waardering", "Bijdragen", "Innovatief", "Rechtvaardigheid", "Warmte", "Comfort", "Integriteit", "Wederkerig", "Compassie", "Intimiteit", "Roem", "Welvaart", "Compromis", "Inzet", "Romantiek", "Wijsheid", "Creativiteit", "Inzicht", "Rust", "Zelfbeheersing", "Dankbaarheid", "Kennis", "Samenwerking", "Zelfkennis", "Discipline", "Kracht", "Schoonheid", "Zelfwaardering", "Dienstbaarheid", "Kunst", "Seksualiteit", "Zinvolheid", "Diepgang", "Kwaliteit", "Sociaal", "Zorgzaamheid", "Doelgerichtheid", "Leiderschap", "Solidariteit", "Duurzaamheid", "Liefde", "Spanning", "Eenvoud", "Loyaliteit", "Spiritualiteit"];

export default function SelectValuesScreen() {
  const [remainingValues, setRemainingValues] = useState(ALL_VALUES_LIST);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const router = useRouter();
  const translateX = useSharedValue(0);

  // 1. De logica functie
  const handleChoice = useCallback((isImportant: boolean) => {
    const currentVal = remainingValues[currentIndex];
    if (!currentVal) return;

    const newSelected = isImportant ? [...selectedValues, currentVal] : selectedValues;

    if (currentIndex < remainingValues.length - 1) {
      setSelectedValues(newSelected);
      setCurrentIndex(prev => prev + 1);
      translateX.value = 0;
    } else {
      // Gebruik een kleine timeout om te zorgen dat de laatste state wordt meegenomen
      setTimeout(() => finalizeRound(newSelected), 10);
    }
  }, [currentIndex, remainingValues, selectedValues]);

  const finalizeRound = (finalSelection: string[]) => {
    if (finalSelection.length === 7) {
      Alert.alert("Check", `7 gekozen.`, [{ text: "Start", onPress: () => saveToFirebase(finalSelection) }]);
    } else if (finalSelection.length < 7) {
      setRemainingValues(ALL_VALUES_LIST.filter(v => !finalSelection.includes(v)));
      setCurrentIndex(0);
      setSelectedValues(finalSelection);
    } else {
      setRemainingValues(finalSelection);
      setCurrentIndex(0);
      setSelectedValues([]);
    }
  };

  const saveToFirebase = async (values: string[]) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await resetTree();
      for (const val of values) {
        const id = val.toLowerCase().replace(/\s/g, '_');
        await setDoc(doc(db, "users", user.uid, "tree", id), { name: val, level: 3, lastFed: new Date().toISOString() });
      }
      router.replace('/tree');
    } catch (e) { console.log(e); }
  };

  // 2. DE TOETSENBORD FIX: Luister op 'document' ipv 'window' en check focus
  useEffect(() => {
    const handleKeyPress = (event: any) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleChoice(true);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handleChoice(false);
      }
    };

    // Voeg toe aan het document
    document.addEventListener('keydown', handleKeyPress);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleChoice]); // Koppel aan de callback die altijd de actuele state heeft

  const gesture = Gesture.Pan()
    .onUpdate((e) => { translateX.value = e.translationX; })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        runOnJS(handleChoice)(true);
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        runOnJS(handleChoice)(false);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${interpolate(translateX.value, [-width, 0, width], [-8, 0, 8], Extrapolate.CLAMP)}deg` }
    ]
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Waarden Swipe</Text>
          <Text style={styles.countText}>{selectedValues.length} / 7</Text>
        </View>

        <View style={styles.cardContainer}>
          <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.card, animatedStyle]}>
              <MaterialCommunityIcons name="heart-flash" size={50} color="#27AE60" />
              <Text style={styles.cardText}>{remainingValues[currentIndex]}</Text>
              <Text style={styles.hintText}>Gebruik ← of →</Text>
            </Animated.View>
          </GestureDetector>
        </View>

        <View style={styles.footer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressInner, { width: `${((currentIndex + 1) / remainingValues.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{currentIndex + 1} / {remainingValues.length}</Text>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20, justifyContent: 'space-between' },
  header: { alignItems: 'center', marginTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
  countText: { fontSize: 18, color: '#27AE60', fontWeight: 'bold' },
  cardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { width: width * 0.8, height: 300, backgroundColor: '#FFF', borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  cardText: { fontSize: 30, fontWeight: 'bold', color: '#334155', textAlign: 'center', padding: 20 },
  hintText: { position: 'absolute', bottom: 15, color: '#94A3B8', fontSize: 12 },
  footer: { marginBottom: 20, alignItems: 'center' },
  progressBar: { width: '100%', height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  progressInner: { height: '100%', backgroundColor: '#27AE60' },
  progressLabel: { marginTop: 8, color: '#94A3B8', fontSize: 11 }
});