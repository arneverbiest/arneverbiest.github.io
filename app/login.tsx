import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState(''); // Voor login: volledige e-mail
  const [prefix, setPrefix] = useState(''); // Voor registratie: alleen de naam
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); 
  const router = useRouter();

  const DOMAIN = "@karus.be";

  const handleAuth = async () => {
    // Bepaal de definitieve e-mail op basis van modus
    const finalEmail = isRegistering 
      ? `${prefix.trim().toLowerCase()}${DOMAIN}` 
      : email.trim().toLowerCase();

    if ((isRegistering ? !prefix : !email) || !password) {
      Alert.alert("Fout", "Vul alle velden in.");
      return;
    }

    // Alleen bij registratie de check doen (inloggen mag met elk e-mailadres)
    if (isRegistering && !finalEmail.endsWith(DOMAIN)) {
      Alert.alert("Toegang Geweigerd", "Registreren kan enkel met een @karus.be adres.");
      return;
    }

    setLoading(true);
    try {
      if (isRegistering) {
        // REGISTRATIE
        const userCredential = await createUserWithEmailAndPassword(auth, finalEmail, password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: finalEmail,
          createdAt: serverTimestamp(),
          setupComplete: false
        });
        Alert.alert("Succes", "Account aangemaakt!");
      } else {
        // LOGIN (geen restrictie op domein)
        await signInWithEmailAndPassword(auth, finalEmail, password);
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error(error);
      let message = "Er is iets misgegaan.";
      if (error.code === 'auth/email-already-in-use') message = "Deze gebruikersnaam is al bezet bij Karus.";
      if (error.code === 'auth/invalid-credential') message = "Onjuiste gegevens.";
      if (error.code === 'auth/weak-password') message = "Wachtwoord moet minstens 6 tekens zijn.";
      Alert.alert("Fout", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Resilience</Text>
      <Text style={styles.subtitle}>
        {isRegistering ? 'Maak je Karus-account aan' : 'Welkom terug'}
      </Text>

      {isRegistering ? (
        // Registratie: Naam + vast @karus.be label
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Gebruikersnaam"
            value={prefix}
            onChangeText={setPrefix}
            autoCapitalize="none"
          />
          <View style={styles.domainBadge}>
            <Text style={styles.domainText}>{DOMAIN}</Text>
          </View>
        </View>
      ) : (
        // Login: Gewoon e-mailveld (voor alle accounts)
        <TextInput
          style={styles.input}
          placeholder="E-mailadres"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Wachtwoord"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : (
          <Text style={styles.buttonText}>{isRegistering ? 'REGISTREREN' : 'INLOGGEN'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.switchBtn} 
        onPress={() => setIsRegistering(!isRegistering)}
      >
        <Text style={styles.switchText}>
          {isRegistering ? 'Heb je al een account? Log in' : 'Nog geen account? Registreer hier'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#F8FAFC' },
  logo: { fontSize: 40, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  // Nieuwe styles voor het registratieveld:
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    overflow: 'hidden'
  },
  domainBadge: { 
    backgroundColor: '#F1F5F9', 
    paddingHorizontal: 15, 
    height: '100%', 
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0'
  },
  domainText: { color: '#64748B', fontWeight: 'bold' },
  
  button: { backgroundColor: '#3498DB', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  switchBtn: { marginTop: 25, alignItems: 'center' },
  switchText: { color: '#64748B', fontSize: 14, textDecorationLine: 'underline' }
});
