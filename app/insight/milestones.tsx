import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavHeader } from '@/src/components/NavHeader';

const { width } = Dimensions.get('window');

interface Milestone {
  id: number;
  days: number;
  title: string;
  icon: any;
  color: string;
}

const MILESTONES: Milestone[] = [
  { id: 1, days: 1, title: "De Eerste Stap", icon: "seed-outline", color: "#81C784" },
  { id: 2, days: 3, title: "Doorzetter", icon: "sprout-outline", color: "#66BB6A" },
  { id: 3, days: 7, title: "Eerste Week", icon: "tree-outline", color: "#43A047" },
  { id: 4, days: 14, title: "Twee Weken", icon: "muffin", color: "#2E7D32" },
  { id: 5, days: 30, title: "Een Maand", icon: "medal", color: "#FBC02D" },
  { id: 6, days: 90, title: "Drie Maanden", icon: "trophy", color: "#FFA000" },
  { id: 7, days: 180, title: "Half Jaar", icon: "crown", color: "#E64A19" },
  { id: 8, days: 365, title: "Een Jaar", icon: "star-circle", color: "#D32F2F" },
];

export default function MilestonesScreen() {
  const [currentDays, setCurrentDays] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const fetchDays = async () => {
        const user = auth.currentUser;
        if (user) {
          const snap = await getDoc(doc(db, "users", user.uid, "settings", "counter"));
          if (snap.exists() && snap.data().startDate) {
            const start = new Date(snap.data().startDate);
            const diff = Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            setCurrentDays(diff > 0 ? diff : 0);
          }
        }
      };
      fetchDays();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <NavHeader title="" />
          <Text style={styles.title}>Mijn Mijlpalen 🏆</Text>
          <Text style={styles.subtitle}>Je bent momenteel {currentDays} dagen clean</Text>
        </View>

        <View style={styles.grid}>
          {MILESTONES.map((item) => {
            const isAchieved = currentDays >= item.days;
            return (
              <View key={item.id} style={[styles.badgeCard, !isAchieved && styles.lockedCard]}>
                <View style={[styles.iconCircle, { backgroundColor: isAchieved ? item.color : '#BDC3C7' }]}>
                  <MaterialCommunityIcons 
                    name={item.icon} 
                    size={40} 
                    color="#FFF" 
                  />
                </View>
                <Text style={[styles.badgeTitle, !isAchieved && styles.lockedText]}>{item.title}</Text>
                <Text style={styles.badgeDays}>{item.days} Dagen</Text>
                {!isAchieved && (
                  <Text style={styles.remainingText}>Nog {item.days - currentDays} te gaan</Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  scrollContent: { padding: 20, paddingTop: 40 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A2E44' },
  subtitle: { fontSize: 16, color: '#7F8C8D', marginTop: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  badgeCard: { 
    backgroundColor: '#FFF', 
    width: (width - 60) / 2, 
    padding: 20, 
    borderRadius: 20, 
    alignItems: 'center', 
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  lockedCard: { backgroundColor: '#E0E0E0', elevation: 0 },
  iconCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  badgeTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', color: '#2C3E50' },
  lockedText: { color: '#95A5A6' },
  badgeDays: { fontSize: 14, color: '#7F8C8D', marginTop: 2 },
  remainingText: { fontSize: 10, color: '#E74C3C', marginTop: 5, fontStyle: 'italic' }
});