import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Platform, Dimensions, Animated, PanResponder, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { db, auth } from '../firebaseConfig';
import { doc, writeBatch } from 'firebase/firestore';
import { VALUE_QUESTIONS } from '../src/constants/questions';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

const CAT_EMOJIS: Record<string, string> = {
  ZELF: '👤', VERBINDING: '🤝', PRESTATIE: '🏆', HARMONIE: '🌿', DYNAMIEK: '⚡'
};

export default function SelectValuesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // States voor de logica
  const [pool, setPool] = useState<any[]>(VALUE_QUESTIONS); // De waarden die nog getoond moeten worden
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedInRound, setSelectedInRound] = useState<any[]>([]); // Wat je in DEZE ronde 'Ja' hebt gegeven
  const [confirmedTotal, setConfirmedTotal] = useState<any[]>([]); // Wat al definitief gekozen is uit vorige rondes
  const [showReview, setShowReview] = useState(false);

  // Animatie Ref
  const position = useRef(new Animated.ValueXY()).current;

  // Refs voor keyboard/logic sync
  const stateRef = useRef({ currentIndex, selectedInRound, pool, confirmedTotal, showReview });
  useEffect(() => {
    stateRef.current = { currentIndex, selectedInRound, pool, confirmedTotal, showReview };
  }, [currentIndex, selectedInRound, pool, confirmedTotal, showReview]);

  // --- LOGICA VOOR KEUZE ---
  const handleNext = useCallback((accepted: boolean) => {
    const { currentIndex: idx, selectedInRound: sel, pool: p } = stateRef.current;
    if (!p[idx]) return;

    if (accepted) {
      setSelectedInRound([...sel, p[idx]]);
    }

    // Ga naar volgende of toon review
    if (idx < p.length - 1) {
      setCurrentIndex(idx + 1);
    } else {
      setShowReview(true);
    }
  }, []);

  // --- SWIPE HANDLERS ---
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (e, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          completeSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          completeSwipe('left');
        } else {
          Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const completeSwipe = (direction: 'left' | 'right') => {
    Animated.timing(position, {
      toValue: { x: direction === 'right' ? width : -width, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      handleNext(direction === 'right');
    });
  };

  // --- KEYBOARD SUPPORT ---
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKey = (e: KeyboardEvent) => {
        if (stateRef.current.showReview) return;
        if (e.key === 'ArrowRight') completeSwipe('right');
        if (e.key === 'ArrowLeft') completeSwipe('left');
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }
  }, []);

  // --- OPSLAAN OF VERDER GAAN ---
  const processSelection = async () => {
    const totalSelected = [...selectedInRound]; // We kijken nu alleen naar wat in de laatste ronde 'Ja' kreeg

    if (totalSelected.length === 7) {
      // EXACT 7: Opslaan naar Firebase
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) return;
        const batch = writeBatch(db);
        totalSelected.forEach(val => {
          const id = val.value.toLowerCase().replace(/\s/g, '_');
          batch.set(doc(db, "users", user.uid, "tree", id), {
            name: val.value, level: 1, xp: 0, category: val.cat
          });
        });
        await batch.commit();
        router.replace('/(tabs)/tree');
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    else if (totalSelected.length > 7) {
      // MEER DAN 7: De nieuwe pool wordt je huidige selectie (verfijnen)
      setPool(totalSelected);
      setSelectedInRound([]);
      setCurrentIndex(0);
      setShowReview(false);
    }
    else if (totalSelected.length < 7 && totalSelected.length > 0) {
      // MINDER DAN 7: Je gaat OPNIEUW door de pool van de VORIGE ronde
      // Maar we houden de selectie van deze ronde even vast als 'geheugensteuntje' of we laten de gebruiker gewoon opnieuw kiezen uit de vorige vijver.
      Alert.alert(
        "Te weinig waarden",
        `Je hebt er nu ${totalSelected.length} gekozen, maar we hebben er 7 nodig. Kies er nog een paar uit je vorige selectie.`,
        [{
          text: "Oké", onPress: () => {
            // We behouden de pool (de lijst waaruit je net koos) 
            // zodat je opnieuw kunt kijken wat je de vorige keer liet liggen.
            setSelectedInRound([]);
            setCurrentIndex(0);
            setShowReview(false);
          }
        }]
      );
    } else {
      // 0 geselecteerd
      Alert.alert("Oeps", "Je moet wel minstens één waarde kiezen.");
      setShowReview(false);
      setCurrentIndex(0);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#27AE60" /></View>;

  const currentVal = pool[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Stop</Text></TouchableOpacity>
        <Text style={styles.counterText}>{[...confirmedTotal, ...selectedInRound].length} / 7</Text>
      </View>

      <View style={styles.cardContainer}>
        {currentVal ? (
          <Animated.View {...panResponder.panHandlers} style={[styles.swipeCard, position.getLayout()]}>
            <Text style={styles.emoji}>{CAT_EMOJIS[currentVal.cat]}</Text>
            <Text style={styles.cardValText}>{currentVal.value}</Text>
            <Text style={styles.hintText}>$\leftarrow$ Nee  |  Ja $\rightarrow$</Text>
          </Animated.View>
        ) : (
          <ActivityIndicator color="#27AE60" />
        )}
      </View>

      <Modal visible={showReview} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '75%' }]}>
            <Text style={styles.modalTitle}>Selectie: {[...confirmedTotal, ...selectedInRound].length} waarden</Text>
            <ScrollView style={{ width: '100%' }}>
              {[...confirmedTotal, ...selectedInRound].map((v, i) => (
                <View key={i} style={styles.reviewItem}>
                  <Text style={{ fontSize: 18 }}>{CAT_EMOJIS[v.cat]} {v.value}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={processSelection}>
              <Text style={styles.saveBtnText}>
                {selectedInRound.length === 7
                  ? "Dit zijn mijn 7 waarden!"
                  : selectedInRound.length > 7
                    ? `Verfijn deze ${selectedInRound.length} waarden`
                    : `Kies er nog ${7 - selectedInRound.length} bij uit de lijst`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20, alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 40, alignItems: 'center' },
  backText: { color: '#64748B', fontWeight: 'bold', fontSize: 16 },
  counterText: { fontSize: 32, fontWeight: 'bold', color: '#27AE60' },
  cardContainer: { width: width * 0.85, height: 450, marginTop: 40, justifyContent: 'center' },
  swipeCard: { backgroundColor: 'white', borderRadius: 30, padding: 30, height: '100%', alignItems: 'center', justifyContent: 'center', elevation: 12, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15 },
  emoji: { fontSize: 80, marginBottom: 20 },
  cardValText: { fontSize: 36, fontWeight: 'bold', textAlign: 'center', color: '#1E293B' },
  hintText: { marginTop: 40, color: '#94A3B8', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: 'white', borderRadius: 30, padding: 25, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  reviewItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', width: '100%' },
  saveBtn: { backgroundColor: '#1E293B', padding: 20, borderRadius: 15, width: '100%', alignItems: 'center', marginTop: 15 },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});