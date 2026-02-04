import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Mapping van de namen in je noodplan naar de app routes
const RELAX_ROUTES: Record<string, string> = {
  '🌬️ Ademhaling': '/Relax/breathe',
  '🌬️ Sober': '/Relax/sober',
  '🌬️ Gevoelsurfen': '/Relax/urgesurf',
  '🌬️ Veilige haven': '/Relax/safehaven',
  '🌬️ 5-4-3-2-1': '/Relax/grounding',
  '🚶 Mindful Wandelen': '/Relax/silentwalk',
  '💤 Bodyscan': '/Relax/bodyscan',
  '💎 Rots & Water': '/Relax/rockwater'
};

const GlobalSOS: React.FC = () => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<{
    reasons: string;
    copingOrder: string[];
    contacts: { name: string; phone: string }[];
  }>({ reasons: '', copingOrder: [], contacts: [] });

  const openSOS = async () => {
    setLoading(true);
    setModalVisible(true);
    const user = auth.currentUser;
    if (user) {
      try {
        const snap = await getDoc(doc(db, "users", user.uid, "settings", "actionPlan"));
        if (snap.exists()) {
          const data = snap.data();
          setPlan({
            reasons: data.reasons || '',
            // We zorgen dat alle acties (oefeningen + bel-acties) in de lijst staan
            copingOrder: Array.isArray(data.copingOrder) ? data.copingOrder : [],
            contacts: Array.isArray(data.contacts) ? data.contacts : []
          });
        }
      } catch (e) {
        console.error("Fout bij ophalen noodplan:", e);
      }
    }
    setLoading(false);
  };

  const makeCall = (number: string) => {
    const cleanNumber = number.replace(/[^0-9+]/g, '');
    if (cleanNumber) Linking.openURL(`tel:${cleanNumber}`);
  };

  const handleStepPress = (step: string) => {
    // 1. Check of het een specifieke bel-actie is die uit de copingOrder komt
    if (step.startsWith('📞 Bel')) {
      const contactName = step.replace('📞 Bel ', '').split(' (')[0]; // Haal naam op zonder tel nr
      const contact = plan.contacts.find(c => c.name === contactName);
      if (contact) {
        makeCall(contact.phone);
      } else {
        // Fallback: als de naam niet matcht, proberen we het nummer uit de string te vissen
        const phoneMatch = step.match(/\((.*?)\)/);
        if (phoneMatch) makeCall(phoneMatch[1]);
      }
      return;
    }

    // 2. Check of het een route is naar een relaxatie oefening
    const routePath = RELAX_ROUTES[step];
    if (routePath) {
      setModalVisible(false);
      router.push(routePath as any);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.floatingButton} onPress={openSOS} activeOpacity={0.8}>
        <MaterialCommunityIcons name="alert-decagram" size={28} color="white" />
        <Text style={styles.sosText}>HELP</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.headerIndicator} />
            <Text style={styles.modalHeader}>NOODPLAN GEACTIVEERD 🛡️</Text>
            
            {loading ? (
              <ActivityIndicator size="large" color="#E74C3C" style={{ marginVertical: 30 }} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                
                {plan.reasons ? (
                  <View style={styles.motivationBox}>
                    <Text style={styles.motivationLabel}>MIJN WAAROM:</Text>
                    <Text style={styles.motivationText}>"{plan.reasons}"</Text>
                  </View>
                ) : null}

                <Text style={styles.sectionLabel}>MIJN STAPPENPLAN</Text>
                
                {/* Gecombineerde lijst van acties uit je noodplan */}
                {plan.copingOrder.length > 0 ? plan.copingOrder.map((step, idx) => {
                  const isContact = step.startsWith('📞 Bel');
                  const hasRoute = !!RELAX_ROUTES[step];
                  
                  return (
                    <TouchableOpacity 
                      key={idx} 
                      style={[styles.stepRow, isContact && styles.stepRowContact]} 
                      onPress={() => handleStepPress(step)}
                    >
                      <View style={[styles.stepCircle, isContact && {backgroundColor: '#007AFF'}]}>
                        <Text style={styles.stepNumber}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{step}</Text>
                      <MaterialCommunityIcons 
                        name={isContact ? "phone" : (hasRoute ? "play-circle" : "check-circle-outline")} 
                        size={22} 
                        color={isContact ? "#007AFF" : (hasRoute ? "#E74C3C" : "#94A3B8")} 
                        style={{marginLeft: 'auto'}} 
                      />
                    </TouchableOpacity>
                  );
                }) : (
                  <Text style={styles.emptyText}>Geen stappen geconfigureerd in je noodplan.</Text>
                )}

                <View style={styles.divider} />

                <Text style={styles.sectionLabel}>DIRECTE HULP</Text>
                
                {/* De Druglijn als vaste waarde onderaan voor extra veiligheid */}
                <TouchableOpacity 
                  style={[styles.callBtn, {backgroundColor: '#E74C3C'}]} 
                  onPress={() => makeCall('078151020')}
                >
                  <MaterialCommunityIcons name="lifebuoy" size={20} color="white" />
                  <Text style={styles.callBtnText}> Bel De Druglijn</Text>
                </TouchableOpacity>

              </ScrollView>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>SLUITEN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute', bottom: 100, right: 20, 
    backgroundColor: '#E74C3C', width: 64, height: 64, borderRadius: 32, 
    justifyContent: 'center', alignItems: 'center', elevation: 10, zIndex: 9999,
  },
  sosText: { color: 'white', fontWeight: '900', fontSize: 10, marginTop: -2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#F8FAFC', borderTopLeftRadius: 30, borderTopRightRadius: 30, 
    padding: 20, maxHeight: '90%', paddingBottom: 40 
  },
  headerIndicator: { width: 40, height: 5, backgroundColor: '#CBD5E1', borderRadius: 3, alignSelf: 'center', marginBottom: 15 },
  modalHeader: { fontSize: 20, fontWeight: '900', color: '#E74C3C', marginBottom: 20, textAlign: 'center', letterSpacing: 1 },
  motivationBox: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: '#E74C3C', elevation: 2 },
  motivationLabel: { fontSize: 10, fontWeight: '900', color: '#E74C3C', marginBottom: 5 },
  motivationText: { fontStyle: 'italic', color: '#1E293B', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '900', color: '#64748B', marginBottom: 10, marginLeft: 5, letterSpacing: 1 },
  stepRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 18, borderRadius: 18, marginBottom: 10, elevation: 2 },
  stepRowContact: { borderRightWidth: 4, borderRightColor: '#007AFF' },
  stepCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#E74C3C', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  stepNumber: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  stepText: { fontSize: 16, fontWeight: '700', color: '#1E293B', flex: 1 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 20 },
  callBtn: { flexDirection: 'row', backgroundColor: '#007AFF', padding: 18, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 10, elevation: 3 },
  callBtnText: { color: 'white', fontWeight: 'bold', fontSize: 17, marginLeft: 10 },
  emptyText: { textAlign: 'center', color: '#94A3B8', padding: 20, fontStyle: 'italic' },
  closeBtn: { padding: 15, alignItems: 'center', marginTop: 10 },
  closeBtnText: { color: '#64748B', fontWeight: '900', fontSize: 13, letterSpacing: 2 }
});

export default GlobalSOS;