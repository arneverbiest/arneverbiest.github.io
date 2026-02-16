import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NavHeader } from '@/src/components/NavHeader';

export default function DagboekScreen() {
  const router = useRouter();
  const [hasValues, setHasValues] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      checkValues();
    }, [])
  );

  const checkValues = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // We controleren of er waarden zijn opgeslagen in de 'settings'
      const snap = await getDoc(doc(db, "users", user.uid, "settings", "values"));
      
      if (snap.exists() && snap.data().items && snap.data().items.length > 0) {
        setHasValues(true);
      } else {
        setHasValues(false);
      }
    } catch (e) {
      console.error("Fout bij laden waarden:", e);
      setHasValues(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <NavHeader title=''/>
        <Text style={styles.pageTitle}>Mijn Dagboek</Text>

        {hasValues === false ? (
          // DIT WORDT GETOOND ALS ER GEEN WAARDEN ZIJN
          <View style={styles.emptyContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="book-outline" size={50} color="#3498DB" />
            </View>
            <Text style={styles.emptyTitle}>Begin je reis</Text>
            <Text style={styles.emptyDesc}>
              Om waardevol te kunnen reflecteren in je dagboek, is het belangrijk om eerst te weten wat jouw kernwaarden zijn. 
              Stel je waardenboom op om een kompas te hebben voor je dagelijkse verhalen.
            </Text>
            
            <TouchableOpacity 
              style={styles.linkBtn} 
              onPress={() => router.push('/tree')} 
            >
              <Text style={styles.linkBtnText}>Waarden selecteren</Text>
              <Ionicons name="leaf" size={18} color="#FFF" style={{marginLeft: 10}} />
            </TouchableOpacity>
          </View>
        ) : (
          // HIER KOMT DE NORMALE DAGBOEK CONTENT
          <View>
            <TouchableOpacity style={styles.newEntryBtn}>
              <Ionicons name="add" size={24} color="#FFF" />
              <Text style={styles.newEntryText}>Nieuwe reflectie schrijven</Text>
            </TouchableOpacity>
            
            {/* Lijst met eerdere dagboek entries zou hier komen */}
            <Text style={styles.sectionTitle}>Eerdere reflecties</Text>
            <Text style={styles.infoText}>Je reflecteert vandaag op basis van jouw gekozen waarden.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingTop: 60 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#1E293B', marginBottom: 20 },
  
  // Empty State styling
  emptyContainer: { 
    backgroundColor: 'white', 
    borderRadius: 30, 
    padding: 30, 
    alignItems: 'center', 
    marginTop: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 15
  },
  iconCircle: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    backgroundColor: '#EBF5FB', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 20
  },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  emptyDesc: { 
    fontSize: 14, 
    color: '#64748B', 
    textAlign: 'center', 
    lineHeight: 22, 
    marginBottom: 30 
  },
  linkBtn: { 
    backgroundColor: '#3498DB', 
    flexDirection: 'row', 
    paddingHorizontal: 25, 
    paddingVertical: 16, 
    borderRadius: 20, 
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center'
  },
  linkBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  newEntryBtn: { 
    backgroundColor: '#2ECC71', 
    flexDirection: 'row', 
    padding: 18, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 30
  },
  newEntryText: { color: '#FFF', fontWeight: 'bold', marginLeft: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 15 },
  infoText: { color: '#64748B', fontStyle: 'italic' }
});