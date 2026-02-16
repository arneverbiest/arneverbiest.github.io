import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, orderBy, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AdminBugBoard() {
  const [bugs, setBugs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.replace('/');
      return;
    }

    try {
      // Check of de gebruiker admin-rechten heeft in zijn profiel
      const userDoc = await getDoc(doc(db, "users", user.uid, "settings", "actionPlan"));
      if (userDoc.exists() && userDoc.data().isAdmin === true) {
        setIsAuthorized(true);
        fetchBugs();
      } else {
        Alert.alert("Toegang geweigerd", "Je hebt geen rechten om deze pagina te bekijken.");
        router.replace('/');
      }
    } catch (e) {
      console.error(e);
      router.replace('/');
    }
  };

  const fetchBugs = async () => {
    try {
      const q = query(collection(db, "bugs"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setBugs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markAsSolved = async (bugId: string) => {
    try {
      await updateDoc(doc(db, "bugs", bugId), { status: 'solved' });
      fetchBugs(); // Ververs de lijst
    } catch (e) {
      Alert.alert("Fout", "Kon status niet updaten.");
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#E74C3C" />;
  if (!isAuthorized) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>Bug Reports</Text>
      </View>

      <FlatList
        data={bugs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.bugCard, item.status === 'solved' && styles.solvedCard]}>
            <View style={styles.bugHeader}>
              <Text style={styles.pageText}>Pagina: {item.page}</Text>
              <Text style={styles.statusBadge}>{item.status}</Text>
            </View>
            <Text style={styles.message}>"{item.message}"</Text>
            <Text style={styles.userText}>Door: {item.userEmail}</Text>
            
            {item.status !== 'solved' && (
              <TouchableOpacity 
                style={styles.solveBtn} 
                onPress={() => markAsSolved(item.id)}
              >
                <Text style={styles.solveBtnText}>Markeer als opgelost</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Geen meldingen gevonden.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, gap: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
  bugCard: { backgroundColor: 'white', padding: 20, borderRadius: 15, marginBottom: 15, elevation: 2 },
  solvedCard: { opacity: 0.6, backgroundColor: '#F1F5F9' },
  bugHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  pageText: { fontSize: 12, fontWeight: 'bold', color: '#E74C3C' },
  statusBadge: { fontSize: 10, textTransform: 'uppercase', color: '#64748B' },
  message: { fontSize: 15, color: '#1E293B', marginBottom: 10, fontStyle: 'italic' },
  userText: { fontSize: 12, color: '#94A3B8' },
  solveBtn: { backgroundColor: '#27AE60', padding: 10, borderRadius: 8, marginTop: 15, alignItems: 'center' },
  solveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  empty: { textAlign: 'center', marginTop: 50, color: '#94A3B8' }
});