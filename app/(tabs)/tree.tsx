import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Dimensions, Animated, Modal, DimensionValue } from 'react-native';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native'; 
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, writeBatch } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

const CAT_EMOJIS: Record<string, string> = {
  ZELF: '👤', VERBINDING: '🤝', PRESTATIE: '🏆', HARMONIE: '🌿', DYNAMIEK: '⚡'
};

// --- VISUELE BOOM COMPONENT ---
const TreeVisual = ({ data, onReset }: { data: any[], onReset: () => void }) => {
  const router = useRouter();
  const [treeDone, setTreeDone] = useState(false);
  const [selectedLeaf, setSelectedLeaf] = useState<any>(null);
  const growAnim = useRef(new Animated.Value(0)).current;

  const fruitPositions: { top: DimensionValue; left: DimensionValue }[] = [
    { top: '20%', left: '48%' }, { top: '32%', left: '45%' }, 
    { top: '28%', left: '52%' }, { top: '44%', left: '44%' }, 
    { top: '41%', left: '50%' }, { top: '51%', left: '53%' }, 
    { top: '56%', left: '44%' }, 
  ];

  useEffect(() => {
    if (treeDone) {
      Animated.spring(growAnim, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }).start();
    }
  }, [treeDone]);

  return (
    <View style={styles.treeContainer}>
      <Text style={styles.gardenTitle}>Mijn Innerlijke Tuin</Text>
      
      <View style={styles.lottieWrapper}>
        <LottieView
          autoPlay
          loop={false}
          speed={6}
          onAnimationFinish={() => setTreeDone(true)}
          style={styles.lottieTree}
          source={require('../../assets/freetree.json')} 
        />

        {data.slice(0, 7).map((val, index) => (
          <Animated.View 
            key={index} 
            style={[styles.fruitWrap, { top: fruitPositions[index].top, left: fruitPositions[index].left, transform: [{ scale: growAnim }] }]}
          >
            <TouchableOpacity 
              onPress={() => setSelectedLeaf(val)}
              style={[styles.fruit, { backgroundColor: val.category === 'ZELF' ? '#F1C40F' : val.category === 'VERBINDING' ? '#E91E63' : val.category === 'PRESTATIE' ? '#3498DB' : val.category === 'HARMONIE' ? '#2ECC71' : '#E67E22' }]}
            >
              <View style={styles.stem} />
              <Text style={styles.fruitText}>{CAT_EMOJIS[val.category] || '🍎'}</Text>
            </TouchableOpacity>
            {treeDone && (
              <View style={styles.fruitLabel}>
                <Text style={styles.labelTitle} numberOfLines={1}>{val.name}</Text>
              </View>
            )}
          </Animated.View>
        ))}
      </View>

      <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
        <Text style={styles.resetBtnText}>Tuin Resetten</Text>
      </TouchableOpacity>

      <Modal visible={!!selectedLeaf} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalEmoji}>{selectedLeaf ? CAT_EMOJIS[selectedLeaf.category] : ''}</Text>
            <Text style={styles.modalTitle}>{selectedLeaf?.name}</Text>
            <TouchableOpacity 
              style={styles.diaryBtn}
              onPress={() => { setSelectedLeaf(null); router.push({ pathname: "/insight/Logbook", params: { valueId: selectedLeaf.id } }); }}
            >
              <Text style={styles.diaryBtnText}>Open Dagboek</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedLeaf(null)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Sluiten</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// --- HOOFD SCHERM ---
export default function TreeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasTree, setHasTree] = useState(false);
  const [treeData, setTreeData] = useState<any[]>([]);

  useEffect(() => { checkTreeData(); }, []);

  const checkTreeData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const snap = await getDocs(collection(db, "users", user.uid, "tree"));
      setHasTree(!snap.empty);
      setTreeData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleReset = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    Alert.alert("Tuin Resetten", "Weet je zeker dat je opnieuw wilt beginnen?", [
      { text: "Annuleren", style: "cancel" },
      { text: "Ja, reset alles", style: "destructive", onPress: async () => {
          setLoading(true);
          try {
            const treeColl = collection(db, "users", user.uid, "tree");
            const snapshot = await getDocs(treeColl);
            const batch = writeBatch(db);
            snapshot.docs.forEach((d) => batch.delete(d.ref));
            await batch.commit();
            setHasTree(false);
            setTreeData([]);
          } catch (e) { console.error(e); } finally { setLoading(false); }
        }
      }
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#27AE60" /></View>;

  if (hasTree) return <TreeVisual data={treeData} onReset={handleReset} />;

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
          <Text style={styles.cardSub}>Swipe door alle mogelijke waarden</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', padding: 20, alignItems: 'center', justifyContent: 'center' },
  fullWidth: { width: '100%', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 40, color: '#1E293B', textAlign: 'center' },
  mainCard: { backgroundColor: 'white', width: '100%', padding: 25, borderRadius: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  cardSub: { fontSize: 14, color: '#64748B', marginTop: 5 },
  
  treeContainer: { flex: 1, backgroundColor: 'transparent' },
  gardenTitle: { textAlign: 'center', marginTop: 60, fontSize: 24, fontWeight: 'bold', color: '#065F46' },
  lottieWrapper: { flex: 1, width: width, justifyContent: 'center', alignItems: 'center' },
  lottieTree: { width: '100%', height: '100%' },
  fruitWrap: { position: 'absolute', alignItems: 'center', zIndex: 100 },
  fruit: { width: 45, height: 50, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  stem: { position: 'absolute', top: -5, width: 3, height: 8, backgroundColor: '#4B3621' },
  fruitText: { fontSize: 16 },
  fruitLabel: { marginTop: 4, backgroundColor: 'white', paddingHorizontal: 4, borderRadius: 5, borderWidth: 1, borderColor: '#27AE60' },
  labelTitle: { fontSize: 8, fontWeight: 'bold', width: 50, textAlign: 'center' },
  
  resetBtn: { position: 'absolute', bottom: 100, alignSelf: 'center', zIndex: 999, backgroundColor: 'rgba(255,255,255,0.8)', padding: 12, borderRadius: 15 },
  resetBtnText: { color: '#EF4444', fontWeight: 'bold', fontSize: 16 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: 'white', borderRadius: 25, padding: 25, alignItems: 'center' },
  modalEmoji: { fontSize: 45 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginVertical: 10 },
  diaryBtn: { backgroundColor: '#27AE60', padding: 15, borderRadius: 12, width: '100%', alignItems: 'center' },
  diaryBtnText: { color: 'white', fontWeight: 'bold' },
  closeBtn: { marginTop: 15 },
  closeBtnText: { color: '#94A3B8' }
});