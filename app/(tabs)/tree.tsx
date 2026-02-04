import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Dimensions, PanResponder, Animated, ScrollView, DimensionValue, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native'; 
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { VALUE_QUESTIONS } from '../../src/constants/questions';

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

  // Jouw nieuwe geoptimaliseerde posities
  const fruitPositions: { top: DimensionValue; left: DimensionValue }[] = [
    { top: '20%', left: '48%' }, 
    { top: '32%', left: '45%' }, 
    { top: '28%', left: '52%' }, 
    { top: '44%', left: '44%' }, 
    { top: '41%', left: '50%' }, 
    { top: '51%', left: '53%' }, 
    { top: '56%', left: '44%' }, 
  ];

  useEffect(() => {
    if (treeDone) {
      Animated.spring(growAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [treeDone]);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'ZELF': return '#F1C40F'; 
      case 'VERBINDING': return '#E91E63'; 
      case 'PRESTATIE': return '#3498DB'; 
      case 'HARMONIE': return '#2ECC71'; 
      case 'DYNAMIEK': return '#E67E22'; 
      default: return '#27AE60';
    }
  };

  return (
    <View style={styles.treeContainer}>
      <Text style={styles.gardenTitle}>Mijn Innerlijke Tuin</Text>
      
      <View style={styles.lottieWrapper}>
        <LottieView
          autoPlay
          loop={false}
          speed={2.5}
          onAnimationFinish={() => setTreeDone(true)}
          style={styles.lottieTree}
          source={require('../../assets/freetree.json')} 
        />

        {data.slice(0, 7).map((val, index) => (
          <Animated.View 
            key={index} 
            style={[
              styles.fruitWrap, 
              { 
                top: fruitPositions[index].top,
                left: fruitPositions[index].left,
                transform: [{ scale: growAnim }] 
              }
            ]}
          >
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setSelectedLeaf(val)}
              style={[styles.fruit, { backgroundColor: getCategoryColor(val.category) }]}
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

      {/* --- VALUE MODAL (HET MENU) --- */}
      <Modal visible={!!selectedLeaf} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalEmoji}>{selectedLeaf ? CAT_EMOJIS[selectedLeaf.category] : ''}</Text>
            <Text style={styles.modalTitle}>{selectedLeaf?.name}</Text>
            <Text style={styles.modalSub}>{selectedLeaf?.category}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Level</Text>
                <Text style={styles.statValue}>{selectedLeaf?.level || 1}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Health</Text>
                <Text style={styles.statValue}>85%</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.diaryBtn}
              onPress={() => {
                const leafId = selectedLeaf.id;
                setSelectedLeaf(null);
                router.push({ pathname: "/diary", params: { valueId: leafId } });
              }}
            >
              <Text style={styles.diaryBtnText}>Open Dagboek</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setSelectedLeaf(null)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Sluiten</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {treeDone && (
        <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
          <Text style={styles.resetBtnText}>Tuin Resetten</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// --- HOOFD SCHERM ---
export default function TreeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasTree, setHasTree] = useState(false);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [isManual, setIsManual] = useState(false);
  const [round, setRound] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pool, setPool] = useState<any[]>(VALUE_QUESTIONS);
  const [confirmedValues, setConfirmedValues] = useState<any[]>([]);
  const [selectedInRound, setSelectedInRound] = useState<any[]>([]);
  const [showReview, setShowReview] = useState(false);
  const position = useRef(new Animated.ValueXY()).current;

  useEffect(() => { checkTreeData(); }, []);

  const checkTreeData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const snap = await getDocs(collection(db, "users", user.uid, "tree"));
      setHasTree(!snap.empty);
      if (!snap.empty) setTreeData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fullReset = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const treeColl = collection(db, "users", user.uid, "tree");
      const snapshot = await getDocs(treeColl);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      setHasTree(false); setIsManual(false); setShowReview(false);
      setConfirmedValues([]); setSelectedInRound([]); setPool(VALUE_QUESTIONS);
      setCurrentIndex(0); setRound(1);
    } catch (e) { Alert.alert("Fout", "Reset faalde."); } finally { setLoading(false); }
  };

  const completeSwipe = (direction: 'left' | 'right') => {
    if (!pool[currentIndex]) return;
    const currentItem = pool[currentIndex];
    const newRoundSelection = direction === 'right' ? [...selectedInRound, currentItem] : selectedInRound;
    Animated.timing(position, {
      toValue: { x: direction === 'right' ? width + 100 : -width - 100, y: 0 },
      duration: 250, useNativeDriver: false
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      if (currentIndex < pool.length - 1) {
        setSelectedInRound(newRoundSelection);
        setCurrentIndex(currentIndex + 1);
      } else {
        setSelectedInRound(newRoundSelection);
        setShowReview(true);
      }
    });
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (e, g) => { if(!showReview) position.setValue({ x: g.dx, y: g.dy }); },
    onPanResponderRelease: (e, g) => {
      if(showReview) return;
      if (g.dx > 120) completeSwipe('right');
      else if (g.dx < -120) completeSwipe('left');
      else Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    }
  });

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#27AE60" /></View>;
  if (hasTree) return <TreeVisual data={treeData} onReset={fullReset} />;

  // Selectie Schermen (Review / Swipe / Start)
  if (showReview) {
    const total = [...confirmedValues, ...selectedInRound];
    return (
      <View style={styles.container}>
        <Text style={styles.stepTitle}>Overzicht</Text>
        <ScrollView style={styles.reviewList}>
          {total.map((v, i) => (<View key={i} style={styles.reviewItem}><Text>{CAT_EMOJIS[v.cat]} {v.value}</Text></View>))}
        </ScrollView>
        <TouchableOpacity style={styles.saveBtn} onPress={() => {
           if(total.length === 7) {
             const batch = writeBatch(db);
             total.forEach(val => {
               const id = val.value.toLowerCase().replace(/\s/g, '_');
               batch.set(doc(db, "users", auth.currentUser!.uid, "tree", id), { name: val.value, level: 1, xp: 0, category: val.cat });
             });
             batch.commit().then(() => checkTreeData());
           } else {
             setPool(total); setConfirmedValues([]); setSelectedInRound([]); setCurrentIndex(0); setShowReview(false);
           }
        }}>
          <Text style={styles.saveBtnText}>{total.length === 7 ? "Bevestig" : "Verfijn"}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isManual) {
    const currentQ = pool[currentIndex];
    return (
      <View style={styles.container}>
        <Text style={styles.counterText}>{confirmedValues.length + selectedInRound.length} / 7</Text>
        <View style={styles.cardContainer}>
          {currentQ && (
            <Animated.View {...panResponder.panHandlers} style={[styles.swipeCard, position.getLayout()]}>
              <Text style={styles.emoji}>{CAT_EMOJIS[currentQ.cat]}</Text>
              <Text style={styles.cardValText}>{currentQ.value}</Text>
            </Animated.View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heroTitle}>Kies je methode</Text>
      <TouchableOpacity style={styles.mainCard} onPress={() => router.push('/quiz')}><Text style={styles.cardTitle}>🧠 Doe de Quiz</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.mainCard, {marginTop: 15}]} onPress={() => setIsManual(true)}><Text style={styles.cardTitle}>🌿 Handmatig Swipen</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20, alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 100, marginBottom: 40 },
  mainCard: { backgroundColor: 'white', width: '100%', padding: 25, borderRadius: 20, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  
  // --- BOOM & FRUIT ---
  treeContainer: { flex: 1, backgroundColor: '#ECFDF5' },
  gardenTitle: { textAlign: 'center', marginTop: 60, fontSize: 24, fontWeight: 'bold', color: '#065F46' },
  lottieWrapper: { flex: 1, width: width, height: height * 0.7, justifyContent: 'center', alignItems: 'center' },
  lottieTree: { width: '100%', height: '100%' },
  fruitWrap: { position: 'absolute', alignItems: 'center', zIndex: 100 },
  fruit: { width: 50, height: 55, borderRadius: 25, borderBottomLeftRadius: 35, borderBottomRightRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 12, shadowColor: '#000', shadowOpacity: 0.3 },
  stem: { position: 'absolute', top: -8, width: 4, height: 10, backgroundColor: '#4B3621', borderRadius: 2 },
  fruitText: { fontSize: 18 },
  fruitLabel: { marginTop: 4, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 6, borderRadius: 8, borderWidth: 1, borderColor: '#27AE60' },
  labelTitle: { fontSize: 8, fontWeight: 'bold', width: 55, textAlign: 'center' },

  // --- MODAL / MENU ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: 'white', borderRadius: 30, padding: 30, alignItems: 'center', elevation: 20 },
  modalEmoji: { fontSize: 50, marginBottom: 10 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
  modalSub: { fontSize: 14, color: '#64748B', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 30 },
  statBox: { alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#94A3B8' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#27AE60' },
  diaryBtn: { backgroundColor: '#27AE60', width: '100%', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 10 },
  diaryBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  closeBtn: { padding: 10 },
  closeBtnText: { color: '#94A3B8', fontWeight: '600' },

  // --- OVERIG ---
  resetBtn: { position: 'absolute', bottom: 40, alignSelf: 'center' },
  resetBtnText: { color: '#EF4444', fontWeight: 'bold' },
  cardContainer: { width: width * 0.85, height: height * 0.35, justifyContent: 'center', marginTop: 40 },
  swipeCard: { backgroundColor: 'white', height: '100%', borderRadius: 25, padding: 20, alignItems: 'center', justifyContent: 'center', elevation: 10 },
  emoji: { fontSize: 60 },
  cardValText: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  counterText: { fontSize: 32, fontWeight: 'bold', marginTop: 40 },
  reviewList: { width: '100%', marginVertical: 20 },
  reviewItem: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10 },
  saveBtn: { backgroundColor: '#1E293B', width: '100%', padding: 20, borderRadius: 15, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: 'bold' },
  stepTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 40 }
});