import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, Href } from 'expo-router'; // Importeer Href voor betere typering
import { Ionicons } from '@expo/vector-icons';

export default function InsightsHub() {
  const router = useRouter();

  const insightOptions = [
    // We gebruiken 'as Href' om de TS-fout 2345 te voorkomen
    { id: 'emotion', title: 'Emotielog', desc: 'Log je emoties', icon: 'time', color: '#9B59B6', path: '/insight/emotionlog' as Href },
    { id: 'logbook', title: 'logboek', desc: 'G-Schema\'s en logboeken', icon: 'time', color: '#9B59B6', path: '/insight/Logbook' as Href },
    { id: 'milestones', title: 'milestones', desc: 'G-Schema\'s en logboeken', icon: 'time', color: '#9B59B6', path: '/insight/milestones' as Href },
    { id: 'stats', title: 'stats', desc: 'Grafieken en patronen', icon: 'bar-chart', color: '#E67E22', path: '/insight/stats' as Href },
    { id: 'monitor', title: 'weekoverzicht', desc: 'weekevaluaties bekijken', icon: 'checkmark-circle', color: '#9B59B6', path: '/insight/recovery_overview' as Href },
    { id: 'insights', title: 'inzichten', desc: 'globale inzichten', icon: 'checkmark-circle', color: '#9B59B6', path: '/insight/insights' as Href },

  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.header}>Jouw Inzichten</Text>
        <Text style={styles.subHeader}>Bekijk je progressie en patronen</Text>
      </View>

      <View style={styles.grid}>
        {insightOptions.map((opt) => (
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