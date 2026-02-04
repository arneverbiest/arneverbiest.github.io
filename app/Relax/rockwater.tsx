import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RockWaterScreen() {
  const [mode, setMode] = useState<'ROCK' | 'WATER'>('ROCK');
  const router = useRouter();

  const content = {
    ROCK: {
      title: "De Rots",
      subtitle: "Focus & Grenzen",
      desc: "Gebruik de rots-modus als je standvastig moet zijn. Voel je voeten stevig op de grond. Span je buikspieren licht aan. Je bent onverstoorbaar.",
      tasks: ["Zet je voeten op schouderbreedte", "Focus je blik op één punt", "Zeg krachtig 'Nee' in gedachten"],
      color: "#7F8C8D",
      icon: "diamond-stone"
    },
    WATER: {
      title: "Het Water",
      subtitle: "Ontspanning & Flow",
      desc: "Gebruik de water-modus als je moet meebewegen of verbinden. Laat je schouders zakken. Adem diep. Wees flexibel in je communicatie.",
      tasks: ["Schud je handen even los", "Adem langzaam uit door je mond", "Stel je voor dat spanning van je af glijdt"],
      color: "#3498DB",
      icon: "waves"
    }
  };

  const current = content[mode];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: current.color + '22' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={28} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rots & Water</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.contentCard}>
        <MaterialCommunityIcons name={current.icon as any} size={80} color={current.color} />
        <Text style={[styles.title, { color: current.color }]}>{current.title}</Text>
        <Text style={styles.subtitle}>{current.subtitle}</Text>
        <Text style={styles.desc}>{current.desc}</Text>

        <View style={styles.taskList}>
          {current.tasks.map((task, i) => (
            <View key={i} style={styles.taskItem}>
              <MaterialCommunityIcons name="check-circle" size={20} color={current.color} />
              <Text style={styles.taskText}>{task}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleBtn, mode === 'ROCK' && { backgroundColor: content.ROCK.color }]} 
          onPress={() => setMode('ROCK')}
        >
          <Text style={[styles.toggleText, mode === 'ROCK' && styles.textWhite]}>ROTS</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleBtn, mode === 'WATER' && { backgroundColor: content.WATER.color }]} 
          onPress={() => setMode('WATER')}
        >
          <Text style={[styles.toggleText, mode === 'WATER' && styles.textWhite]}>WATER</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  contentCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 30, marginTop: 30, padding: 30, alignItems: 'center', elevation: 5 },
  title: { fontSize: 32, fontWeight: 'bold', marginTop: 10 },
  subtitle: { fontSize: 18, fontWeight: '600', color: '#BDC3C7', marginBottom: 20 },
  desc: { textAlign: 'center', fontSize: 16, color: '#7F8C8D', lineHeight: 24, marginBottom: 30 },
  taskList: { alignSelf: 'flex-start', width: '100%' },
  taskItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  taskText: { marginLeft: 15, fontSize: 16, color: '#2C3E50' },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#DDD', borderRadius: 20, padding: 5, marginBottom: 40 },
  toggleBtn: { flex: 1, paddingVertical: 15, alignItems: 'center', borderRadius: 15 },
  toggleText: { fontWeight: 'bold', color: '#7F8C8D' },
  textWhite: { color: '#FFF' }
});