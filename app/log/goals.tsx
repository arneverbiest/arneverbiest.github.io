import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const GOAL_CATEGORIES = [
  { id: 'verslaving', title: 'Verslaving', icon: 'shield-outline', color: '#E74C3C' },
  { id: 'gezondheid', title: 'Gezondheid', icon: 'fitness-outline', color: '#2ECC71' },
  { id: 'thuissituatie', title: 'Thuissituatie', icon: 'home-outline', color: '#3498DB' },
  { id: 'werk', title: 'Werk / Daginvulling', icon: 'briefcase-outline', color: '#F1C40F' },
  { id: 'vrijetijd', title: 'Vrijetijd', icon: 'sunny-outline', color: '#E67E22' },
  { id: 'sociale_contacten', title: 'Sociale Contacten', icon: 'people-outline', color: '#9B59B6' },
  { id: 'persoonlijke_groei', title: 'Persoonlijke Groei', icon: 'trending-up-outline', color: '#1ABC9C' },
  { id: 'persoonlijke_doelen', title: 'Overige Doelen', icon: 'flag-outline', color: '#95A5A6' },
];

export default function GoalCategoryScreen() {
  const router = useRouter();

  const handleSelect = (categoryId: string, categoryTitle: string) => {
    // We navigeren naar een detailpagina en geven de categorie mee als parameter
    router.push({
      pathname: "/log/goal_detail",
      params: { catId: categoryId, catTitle: categoryTitle }
    } as any);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerSection}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.header}>Kies een Leefgebied</Text>
        <Text style={styles.subHeader}>Voor welk gebied wil je een doel stellen?</Text>
      </View>

      <View style={styles.grid}>
        {GOAL_CATEGORIES.map((cat) => (
          <TouchableOpacity 
            key={cat.id} 
            style={styles.card}
            onPress={() => handleSelect(cat.id, cat.title)}
          >
            <View style={[styles.iconCircle, { backgroundColor: cat.color }]}>
              <Ionicons name={cat.icon as any} size={28} color="white" />
            </View>
            <Text style={styles.cardTitle}>{cat.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerSection: { padding: 25, paddingTop: 60, backgroundColor: 'white' },
  backBtn: { marginBottom: 15 },
  header: { fontSize: 26, fontWeight: 'bold', color: '#1E293B' },
  subHeader: { fontSize: 15, color: '#64748B', marginTop: 5 },
  grid: { padding: 15, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { 
    backgroundColor: 'white', 
    width: '47%', 
    borderRadius: 20, 
    padding: 20, 
    alignItems: 'center', 
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  iconCircle: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', color: '#334155' }
});