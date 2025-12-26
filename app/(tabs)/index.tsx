// app/(tabs)/index.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, Platform } from 'react-native';
import SoberCounter from '../../src/components/SoberCounter'; 
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'SoberStartDate';

// Wetenschappelijke info per mijlpaal
const MILESTONES = [
  { 
    days: 1, label: 'Eerste Stap', icon: '🌱', 
    info: "Je lever is hard aan het werk om alle gifstoffen te verwerken. Na 24 uur begint je bloedsuikerspiegel te stabiliseren en neemt de ontstekingswaarde in je lichaam al af." 
  },
  { 
    days: 3, label: 'Doorzetter', icon: '🔋', 
    info: "De meeste fysieke ontwenningsverschijnselen pieken nu. Je lichaam is officieel alcoholvrij. Je hydratatie verbetert en je nieren functioneren efficiënter." 
  },
  { 
    days: 7, label: 'Eerste Week', icon: '🏆', 
    info: "Je slaapkwaliteit verbetert drastisch (meer REM-slaap). Je hersenen beginnen de receptoren te herstellen die door alcohol verdoofd waren. Je hebt meer energie." 
  },
  { 
    days: 30, label: 'Maandkracht', icon: '💎', 
    info: "Je levervet kan met wel 15% zijn afgenomen. Je huid ziet er gezonder uit en je mentale 'mist' is grotendeels verdwenen. Je dopaminesysteem begint te normaliseren." 
  },
  { 
    days: 100, label: 'Eeuwigheid', icon: '🔥', 
    info: "Gefeliciteerd! Je neurale paden zijn hersteld. Je bent nu door de moeilijkste fase van de psychologische gewoontevorming heen. Je risico op vele ziektes is nu permanent verlaagd." 
  },
];




export default function HomeScreen() {
  const [daysSober, setDaysSober] = useState(0);

  const loadData = async () => {
    const storedDate = await AsyncStorage.getItem(STORAGE_KEY);
    if (storedDate) {
      const start = new Date(storedDate);
      const diff = Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      setDaysSober(Math.max(0, diff));
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));


  const showMilestoneInfo = (m: typeof MILESTONES[0], isAchieved: boolean) => {
    const title = `${m.icon} ${m.label}`;
    const message = `${isAchieved ? "BEHAALD! \n\n" : "TOEKOMSTIG DOEL: \n\n"}${m.info}`;

    if (Platform.OS === 'web') {
      // Browser versie
      window.alert(`${title}\n\n${message}`);
    } else {
      // Mobiele versie (iOS/Android)
      Alert.alert(title, message, [{ text: "Inspirerend!" }]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.welcomeText}>Mijn Vooruitgang</Text>
        </View>

        {/* De SoberCounter krijgt nu de loadData functie mee om direct te verversen */}
        <SoberCounter onDateChange={(days) => setDaysSober(days)} />

        <View style={styles.milestoneSection}>
          <Text style={styles.sectionTitle}>Mijlpalen (klik voor info)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.milestoneScroll}>
            {MILESTONES.map((m) => {
              const isAchieved = daysSober >= m.days;
              return (
                <TouchableOpacity 
                  key={m.days} 
                  onPress={() => showMilestoneInfo(m, isAchieved)}
                  activeOpacity={0.7}
                  style={[styles.badgeCard, !isAchieved && styles.badgeLocked]}
                >
                  <Text style={[styles.badgeIcon, !isAchieved && styles.grayscale]}>{m.icon}</Text>
                  <Text style={[styles.badgeLabel, !isAchieved && styles.lockedText]}>{m.label}</Text>
                  <Text style={styles.badgeDays}>{m.days}d</Text>
                  {!isAchieved && <View style={styles.lockIcon}><Text style={{fontSize: 10}}>🔒</Text></View>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.infoBox}>
           <Text style={styles.infoTitle}>💡 Wist je dat?</Text>
           <Text style={styles.infoText}>
             Na slechts 20 minuten zonder alcohol daalt je hartslag en bloeddruk al naar een normaler niveau. Elke minuut telt.
           </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F4F8' },
  container: { flex: 1 },
  content: { padding: 20 },
  headerSection: { marginTop: 10, marginBottom: 10 },
  welcomeText: { fontSize: 28, fontWeight: 'bold', color: '#1A2E44' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A2E44', marginBottom: 15 },
  milestoneSection: { marginTop: 10 },
  milestoneScroll: { flexDirection: 'row', paddingBottom: 10 },
  badgeCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 22,
    marginRight: 12,
    alignItems: 'center',
    width: 105,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  badgeLocked: { backgroundColor: '#E5E8E8', borderColor: '#D5DBDB', elevation: 0 },
  badgeIcon: { fontSize: 32, marginBottom: 5 },
  grayscale: { opacity: 0.2 },
  badgeLabel: { fontSize: 12, fontWeight: 'bold', color: '#2C3E50', textAlign: 'center' },
  lockedText: { color: '#95A5A6' },
  badgeDays: { fontSize: 10, color: '#7F8C8D', marginTop: 4 },
  lockIcon: { position: 'absolute', top: 10, right: 10 },
  infoBox: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 20,
    marginTop: 25,
    borderLeftWidth: 5,
    borderLeftColor: '#007AFF',
  },
  infoTitle: { fontWeight: 'bold', color: '#007AFF', marginBottom: 5 },
  infoText: { color: '#34495E', lineHeight: 20, fontSize: 14 },
});