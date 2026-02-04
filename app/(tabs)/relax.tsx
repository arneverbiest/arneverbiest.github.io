import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const moods = [
  { label: 'Veel Trek', icon: 'water-percent', target: 'urgesurf', color: '#E74C3C' },
  { label: 'Onrustig', icon: 'Waves', target: 'breathe', color: '#3498DB' },
  { label: 'Piekeren', icon: 'brain', target: 'sober', color: '#9B59B6' },
  { label: 'Lusteloos', icon: 'battery-low', target: 'sensorygarden', color: '#27AE60' },
];

export default function RelaxScreen() {
  const router = useRouter();
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const exercises = [
    { id: 'breathe', title: 'Ademhaling', icon: 'weather-windy', color: '#3498DB', route: 'Relax/breathe' },
    { id: 'sober', title: 'SOBER Methode', icon: 'stop-circle-outline', color: '#E67E22', route: 'Relax/sober' },
    { id: 'urgesurf', title: 'Gevoelsurfen', icon: 'surfing', color: '#2980B9', route: 'Relax/urgesurf' },
    { id: 'sensorygarden', title: 'Zintuigentuin', icon: 'flower-outline', color: '#27AE60', route: 'Relax/sensorygarden' },
    { id: 'safehaven', title: 'Veilige Haven', icon: 'heart-settings-outline', color: '#9B59B6', route: 'Relax/safehaven' },
    { id: 'rockwater', title: 'Rots & Water', icon: 'diamond-stone', color: '#7F8C8D', route: 'Relax/rockwater' },
    { id: 'bodyscan', title: 'Body Scan', icon: 'human-handsup', color: '#9B59B6', route: 'Relax/bodyscan' },
    { id: 'grounding', title: '5-4-3-2-1', icon: 'earth', color: '#16A085', route: 'Relax/grounding' },
    { id: 'silentwalk', title: 'Stille Wandeling', icon: 'walk', color: '#1ABC9C', route: 'Relax/silentwalk' },

  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>Hoe voel je je? 🧠</Text>
      <Text style={styles.subHeader}>Klik op je huidige staat voor een suggestie.</Text>

      {/* MOOD SELECTOR */}
      <View style={styles.moodGrid}>
        {moods.map((m) => (
          <TouchableOpacity 
            key={m.label} 
            style={[styles.moodBtn, { borderColor: m.color }]} 
            onPress={() => setSuggestion(m.target)}
          >
            <MaterialCommunityIcons name={m.icon as any} size={24} color={m.color} />
            <Text style={[styles.moodText, { color: m.color }]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ALLE OEFENINGEN */}
      <Text style={styles.sectionTitle}>Alle Oefeningen</Text>
      <View style={styles.exerciseGrid}>
        {exercises.map((ex) => {
          const isSuggested = suggestion === ex.id;
          return (
            <TouchableOpacity 
              key={ex.id} 
              style={[
                styles.exCard, 
                isSuggested && { borderColor: ex.color, borderWidth: 2, transform: [{ scale: 1.05 }] }
              ]}
              onPress={() => router.push(ex.route as any)}
            >
              <View style={[styles.iconBox, { backgroundColor: ex.color + '22' }]}>
                <MaterialCommunityIcons name={ex.icon as any} size={30} color={ex.color} />
              </View>
              <Text style={styles.exTitle}>{ex.title}</Text>
              {isSuggested && <Text style={styles.suggestedTag}>Aanbevolen</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      {suggestion && (
        <TouchableOpacity style={styles.resetBtn} onPress={() => setSuggestion(null)}>
          <Text style={styles.resetText}>Toon alles</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20, paddingTop: 60 },
  header: { fontSize: 26, fontWeight: 'bold', color: '#1E293B' },
  subHeader: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30 },
  moodBtn: { width: '48%', borderWidth: 1, padding: 12, borderRadius: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: '#FFF' },
  moodText: { marginLeft: 10, fontWeight: 'bold', fontSize: 13 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 15 },
  exerciseGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  exCard: { width: '48%', backgroundColor: '#FFF', padding: 15, borderRadius: 20, marginBottom: 15, alignItems: 'center', elevation: 2 },
  iconBox: { padding: 15, borderRadius: 15, marginBottom: 10 },
  exTitle: { fontSize: 14, fontWeight: '600', color: '#334155', textAlign: 'center' },
  suggestedTag: { marginTop: 5, fontSize: 10, color: '#E74C3C', fontWeight: 'bold', textTransform: 'uppercase' },
  resetBtn: { marginTop: 10, alignSelf: 'center', padding: 10 },
  resetText: { color: '#64748B', textDecorationLine: 'underline' }
});