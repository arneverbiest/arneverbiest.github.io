import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, TextInput, Alert, Platform } from 'react-native';
import { db } from '../../firebaseConfig';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function BugsAdminScreen() {
  const [loading, setLoading] = useState(false);
  const [bugs, setBugs] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userIn, setUserIn] = useState('');
  const [passIn, setPassIn] = useState('');
  const router = useRouter();

  // Login logica
  const handleAdminLogin = () => {
    if (userIn === 'admin' && passIn === 'admin') {
      setIsAuthenticated(true);
      fetchBugs();
    } else {
      Alert.alert("Toegang geweigerd", "Onjuiste gegevens.");
    }
  };

  const fetchBugs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "bugs"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setBugs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { 
      console.error("Fetch error:", e); 
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const safeStatus = currentStatus || 'open';
    const next = safeStatus === 'open' ? 'fixed' : 'open';
    try {
      await updateDoc(doc(db, "bugs", id), { status: next });
      setBugs(prev => prev.map(b => b.id === id ? { ...b, status: next } : b));
    } catch (e) { console.error(e); }
  };

  const deleteBug = async (id: string) => {
    Alert.alert("Verwijderen", "Weet je het zeker?", [
      { text: "Annuleer", style: "cancel" },
      { text: "Verwijder", style: "destructive", onPress: async () => {
          await deleteDoc(doc(db, "bugs", id));
          setBugs(prev => prev.filter(b => b.id !== id));
      }}
    ]);
  };

  // AUTH SCHERM
  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <Ionicons name="lock-closed" size={60} color="#64748B" />
        <Text style={styles.authTitle}>Beheerderspaneel</Text>
        <TextInput 
          style={styles.authInput} 
          placeholder="Gebruikersnaam" 
          value={userIn} 
          onChangeText={setUserIn} 
          autoCapitalize="none"
        />
        <TextInput 
          style={styles.authInput} 
          placeholder="Wachtwoord" 
          secureTextEntry 
          value={passIn} 
          onChangeText={setPassIn} 
        />
        <TouchableOpacity style={styles.authBtn} onPress={handleAdminLogin}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Inloggen</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace("/")} style={{ marginTop: 20 }}>
          <Text style={{ color: '#64748B' }}>Terug naar Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bug Tracker 🐞</Text>
        <TouchableOpacity onPress={fetchBugs} style={styles.refreshIcon}>
          <Ionicons name="refresh" size={24} color="#64748B" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#007AFF" /></View>
      ) : (
        <FlatList
          data={bugs}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.emptyText}>Geen bugmeldingen gevonden.</Text>}
          renderItem={({ item }) => {
            const status = item.status || 'open';
            const pagePath = item.page || 'onbekende pagina';

            return (
              <View style={[styles.card, status === 'fixed' && styles.fixedCard]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: status === 'open' ? '#FEE2E2' : '#DCFCE7' }]}>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: status === 'open' ? '#EF4444' : '#16A34A' }}>
                      {status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.meta}>{item.platform || 'app'} | {item.userEmail || 'Anoniem'}</Text>
                </View>

                <Text style={styles.desc}>{item.description || item.message || 'Geen omschrijving'}</Text>

                {/* PAGINA WEERGAVE */}
                <View style={styles.pageBadge}>
                  <Ionicons name="navigate-circle-outline" size={14} color="#64748B" />
                  <Text style={styles.pageText}>{pagePath}</Text>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => toggleStatus(item.id, status)} style={styles.statusBtn}>
                    <Text style={styles.statusBtnText}>{status === 'open' ? 'Markeer als opgelost' : 'Heropenen'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteBug(item.id)}>
                    <Ionicons name="trash-outline" size={22} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 10 : 50, 
    paddingBottom: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  refreshIcon: { padding: 5 },
  title: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
  authContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#F8FAFC' },
  authTitle: { fontSize: 24, fontWeight: 'bold', marginVertical: 20, color: '#1E293B' },
  authInput: { width: '100%', backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  authBtn: { width: '100%', backgroundColor: '#1E293B', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  fixedCard: { opacity: 0.5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  meta: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  desc: { fontSize: 15, color: '#334155', lineHeight: 22, fontWeight: '500' },
  pageBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F1F5F9', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8, 
    marginTop: 12, 
    alignSelf: 'flex-start',
    gap: 6
  },
  pageText: { fontSize: 12, color: '#64748B', fontWeight: 'bold' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, alignItems: 'center' },
  statusBtn: { backgroundColor: '#F1F5F9', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  statusBtnText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  emptyText: { textAlign: 'center', marginTop: 100, color: '#94A3B8', fontSize: 16 }
});