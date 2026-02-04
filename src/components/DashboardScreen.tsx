import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useFocusEffect } from 'expo-router';

const HomeScreen: React.FC = () => {
  const [days, setDays] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const fetchCounter = async () => {
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, "users", user.uid, "settings", "counter");
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const startDate = new Date(snap.data().startDate);
            const diff = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            setDays(diff > 0 ? diff : 0);
          }
        }
      };
      fetchCounter();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.counterCard}>
          <Text style={styles.counterTitle}>Je bent al</Text>
          <Text style={styles.dayText}>{days}</Text>
          <Text style={styles.counterSub}>Dagen herstellende</Text>
        </View>

        <View style={styles.quoteBox}>
          <Text style={styles.quoteText}>"De enige manier om te winnen, is door niet te spelen met je verslaving."</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  content: { padding: 20, paddingTop: 60 },
  counterCard: { 
    backgroundColor: '#FFF', padding: 40, borderRadius: 30, 
    alignItems: 'center', elevation: 5, shadowColor: '#000', 
    shadowOpacity: 0.1, shadowRadius: 10 
  },
  counterTitle: { fontSize: 18, color: '#7F8C8D', fontWeight: '600' },
  dayText: { fontSize: 80, fontWeight: '900', color: '#007AFF', marginVertical: 10 },
  counterSub: { fontSize: 18, color: '#34495E', fontWeight: 'bold' },
  quoteBox: { marginTop: 30, padding: 20, backgroundColor: '#D6EAF8', borderRadius: 15 },
  quoteText: { fontStyle: 'italic', textAlign: 'center', color: '#2C3E50' }
});

export default HomeScreen;