import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Animated, DimensionValue } from 'react-native';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native'; 
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, writeBatch, onSnapshot, query } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const CAT_EMOJIS: Record<string, string> = { ZELF: '👤', VERBINDING: '🤝', PRESTATIE: '🏆', HARMONIE: '🌿', DYNAMIEK: '⚡' };

export default function TreeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [treeDone, setTreeDone] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false); // Eigen popup state
  const growAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "users", user.uid, "tree"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setTreeData(data);
      setLoading(false);
      
      if (data.length === 0 && !loading) {
        router.replace('/onboarding/values-start');
      }
    });

    return () => unsubscribe();
  }, [loading]);

  useEffect(() => {
    if (treeDone && treeData.length > 0) {
      Animated.spring(growAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    }
  }, [treeDone, treeData.length]);

  const executeReset = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    setLoading(true);
    setShowConfirm(false);
    
    try {
      const treeColl = collection(db, "users", user.uid, "tree");
      const snapshot = await getDocs(treeColl);
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      
      console.log("Database leeg, navigeren...");
      router.replace('/onboarding/values-start');
    } catch (e) {
      console.error("Fout:", e);
      setLoading(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#27AE60" /></View>;

  const fruitPositions: { top: DimensionValue; left: DimensionValue }[] = [
    { top: '22%', left: '48%' }, { top: '35%', left: '42%' }, { top: '30%', left: '55%' }, 
    { top: '45%', left: '44%' }, { top: '42%', left: '52%' }, { top: '52%', left: '53%' }, { top: '56%', left: '44%' }, 
  ];

  return (
    <View style={styles.masterContainer}>
      <Text style={styles.gardenTitle}>Mijn Innerlijke Tuin</Text>
      
      <View style={styles.lottieWrapper} pointerEvents="box-none">
        <LottieView
          autoPlay loop={false} speed={6}
          onAnimationFinish={() => setTreeDone(true)}
          style={styles.lottieTree}
          source={require('../../assets/freetree.json')} 
        />
        {treeData.slice(0, 7).map((val, index) => (
          <Animated.View key={val.id || index} style={[styles.fruitWrap, { top: fruitPositions[index].top, left: fruitPositions[index].left, transform: [{ scale: growAnim }], opacity: treeDone ? 1 : 0 }]}>
            <View style={[styles.fruit, { backgroundColor: '#27AE60' }]}>
               <Text style={styles.fruitText}>{CAT_EMOJIS[val.category] || '🍎'}</Text>
            </View>
          </Animated.View>
        ))}
      </View>
      
      {/* Handmatige Reset Knop */}
      <TouchableOpacity 
        style={styles.resetBtn} 
        onPress={() => setShowConfirm(true)}
      >
        <MaterialCommunityIcons name="trash-can-outline" size={24} color="#EF4444" />
        <Text style={styles.resetBtnText}>Tuin Resetten</Text>
      </TouchableOpacity>

      {/* CUSTOM CONFIRMATION MODAL (Geen systeem alert) */}
      {showConfirm && (
        <View style={styles.customAlertOverlay}>
          <View style={styles.customAlertBox}>
            <Text style={styles.alertTitle}>Tuin wissen?</Text>
            <Text style={styles.alertSub}>Je begint dan weer helemaal vanaf het begin.</Text>
            
            <TouchableOpacity style={styles.confirmBtn} onPress={executeReset}>
              <Text style={styles.confirmText}>Ja, wis alles</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowConfirm(false)}>
              <Text style={styles.cancelText}>Annuleren</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  masterContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gardenTitle: { textAlign: 'center', marginTop: 60, fontSize: 24, fontWeight: 'bold', color: '#065F46' },
  lottieWrapper: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  lottieTree: { width: width, height: height * 0.7 },
  fruitWrap: { position: 'absolute', alignItems: 'center', zIndex: 20 },
  fruit: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fruitText: { fontSize: 18 },
  resetBtn: { 
    position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: 'white', 
    paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, elevation: 10, 
    flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 100 
  },
  resetBtnText: { color: '#EF4444', fontWeight: 'bold', fontSize: 18 },

  // Custom Alert Styles
  customAlertOverlay: { 
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 
  },
  customAlertBox: { 
    width: '80%', backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 13, elevation: 20
  },
  alertTitle: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  alertSub: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 25 },
  confirmBtn: { backgroundColor: '#EF4444', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  confirmText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { width: '100%', padding: 15, alignItems: 'center' },
  cancelText: { color: '#94A3B8', fontWeight: 'bold' }
});