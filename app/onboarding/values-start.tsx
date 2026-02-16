import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function ValuesStartScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.fullWidth}>
        <Text style={styles.heroTitle}>Hoe wil je beginnen?</Text>
        
        <TouchableOpacity style={styles.mainCard} onPress={() => router.push('/quiz')}>
          <Text style={styles.cardTitle}>🧠 Doe de Quiz</Text>
          <Text style={styles.cardSub}>Ontdek je waarden via vragen</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.mainCard, {marginTop: 20}]} 
          onPress={() => router.push('/select-values')} 
        >
          <Text style={styles.cardTitle}>🌿 Handmatig Kiezen</Text>
          <Text style={styles.cardSub}>Selecteer zelf je belangrijkste waarden</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20, alignItems: 'center', justifyContent: 'center' },
  fullWidth: { width: '100%', alignItems: 'center' },
  heroTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 40, color: '#1E293B', textAlign: 'center' },
  mainCard: { backgroundColor: 'white', width: '100%', padding: 25, borderRadius: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  cardSub: { fontSize: 14, color: '#64748B', marginTop: 5 },
});