import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Linking, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function GlobalSOS() {
  const [modalVisible, setModalVisible] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchActionPlan = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      // We halen de data op uit jouw specifie cupboard
      const docRef = doc(db, "users", user.uid, "settings", "actionPlan");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setPlan(docSnap.data());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setModalVisible(true);
    fetchActionPlan();
  };

  return (
    <View>
      <TouchableOpacity style={styles.sosCircle} onPress={handleOpen} activeOpacity={0.8}>
        <Ionicons name="megaphone" size={24} color="white" />
        <Text style={styles.sosLabel}>SOS</Text>
      </TouchableOpacity>

      <Modal animationType="slide" visible={modalVisible} transparent={false}>
        <SafeAreaView style={styles.fullScreenContainer}>
          {/* HEADER ZOALS IN JE NOODPLAN */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.backBtn}>
              <Ionicons name="chevron-down" size={30} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mijn Noodplan 🛟</Text>
            <View style={{ width: 40 }} /> 
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {loading ? (
              <ActivityIndicator size="large" color="#E74C3C" style={{ marginTop: 50 }} />
            ) : (
              <View>
                {/* KAART 1: HELPENDE GEDACHTE */}
                <View style={styles.planCard}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="bulb-outline" size={22} color="#E74C3C" />
                    <Text style={styles.cardTitle}>Helpende gedachte</Text>
                  </View>
                  <Text style={styles.cardBody}>{plan?.helpingThought || "Denk aan waarom je bent begonnen. Deze drang is tijdelijk."}</Text>
                </View>

                {/* KAART 2: AFLEIDINGEN */}
                <View style={styles.planCard}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="bicycle-outline" size={22} color="#E74C3C" />
                    <Text style={styles.cardTitle}>Wat kan ik nu doen?</Text>
                  </View>
                  <Text style={styles.cardBody}>{plan?.distractions || "1. Ga wandelen\n2. Drink water\n3. Bel iemand"}</Text>
                </View>

                {/* KAART 3: CONTACTPERSOON */}
                <View style={styles.planCard}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="people-outline" size={22} color="#E74C3C" />
                    <Text style={styles.cardTitle}>Wie kan ik bellen?</Text>
                  </View>
                  <Text style={styles.cardBody}>{plan?.contactPerson || "Nog geen contact ingesteld"}</Text>
                </View>

                {/* NOODKNOP ONDERAAN */}
                <TouchableOpacity style={styles.emergencyAction} onPress={() => Linking.openURL('tel:112')}>
                  <Ionicons name="alert-circle" size={24} color="white" />
                  <Text style={styles.emergencyText}>BEL NOODNUMMER 112</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sosCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E74C3C', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  sosLabel: { color: 'white', fontSize: 10, fontWeight: 'bold', marginTop: -2 },
  fullScreenContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: 'white' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  backBtn: { padding: 5 },
  scrollContent: { padding: 20 },
  planCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#E74C3C' },
  cardBody: { fontSize: 15, color: '#475569', lineHeight: 22 },
  emergencyAction: { flexDirection: 'row', backgroundColor: '#E74C3C', padding: 20, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 } ,
  emergencyText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});