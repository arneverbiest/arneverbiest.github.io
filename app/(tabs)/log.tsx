import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LogHub() {
  const router = useRouter();

  const logOptions = [
    //{ id: 'act', title: 'Motivatie', desc: 'Welke actie?', icon: 'book', color: '#2ECC71', path: '/log/act' as Href },
    //{ id: 'diary', title: 'Dagboek', desc: 'Schrijf over je waarden', icon: 'book', color: '#2ECC71', path: '/log/diary' as Href },
    { id: 'gschema', title: 'G-Schema', desc: 'Gedachte onderzoeken', icon: 'brain', color: '#3498DB', path: '/log/five-g' as Href },
    { id: 'goals', title: 'doelen', desc: 'welke doelen heb je?', icon: 'happy', color: '#F1C40F', path: '/log/goals' as Href },
    { id: 'plan', title: 'Noodplan', desc: 'pas je eigen noodplan aan', icon: 'happy', color: '#F1C40F', path: '/log/plan' as Href },
    //{ id: 'recovery', title: 'herstel', desc: 'herstelmonitor', icon: 'heart', color: '#E74C3C', path: '/log/recovery_log' as Href },
    { id: 'weekly', title: 'weekdoelen', desc: 'weekdoelen vaststellen', icon: 'calendar', color: '#9B59B6', path: '/log/weekly_goals' as Href },
    //{ id: 'action_plan', title: 'Actieplan', desc: 'Actieplan bekijken', icon: 'checkmark-circle', color: '#9B59B6', path: '/log/action_plan' as Href },
    { id: 'weekly_review', title: 'Weekbeoordeling', desc: 'Weekbeoordeling bekijken', icon: 'checkmark-circle', color: '#9B59B6', path: '/log/recovery_log' as Href },
  ];

  return (
        <ScrollView style={styles.container}>
          <View style={styles.headerSection}>
            <Text style={styles.header}>Jouw Inzichten</Text>
            <Text style={styles.subHeader}>Bekijk je progressie en patronen</Text>
          </View>
    
          <View style={styles.grid}>
            {logOptions.map((opt) => (
              <TouchableOpacity 
                key={opt.id} 
                style={styles.card} 
                onPress={() => router.push(opt.path)}
              >
                <View style={[styles.iconCircle, { backgroundColor: opt.color }]}>
                  <Ionicons name={opt.icon as any} size={28} color="white" />
                </View>
                <View style={styles.info}>
                  <Text style={styles.title}>{opt.title}</Text>
                  <Text style={styles.desc}>{opt.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerSection: { padding: 25, paddingTop: 60, backgroundColor: 'white' },
  header: { fontSize: 28, fontWeight: 'bold', color: '#1E293B' },
  subHeader: { fontSize: 16, color: '#64748B', marginTop: 5 },
  grid: { padding: 20 },
  card: { 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 18, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15, 
    // Schaduw voor iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    // Schaduw voor Android
    elevation: 2 
  },
  iconCircle: { width: 55, height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: 15 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#334155' },
  desc: { fontSize: 13, color: '#64748B', marginTop: 2 }
});