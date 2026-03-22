import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { submitKYC } from '../../services/api';

export default function KycAddressScreen() {
  const { token } = useAuth();
  const params = useLocalSearchParams<{ idType?: string; idNumber?: string; idFront?: string; idBack?: string; selfie?: string }>();
  const [country, setCountry] = useState('Tanzania');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!country.trim()) { Alert.alert('Required', 'Please enter your country.'); return; }
    if (!token || !params.selfie || !params.idFront || !params.idNumber || !params.idType) {
      Alert.alert('Error', 'Missing required information. Please go back and complete all steps.'); return;
    }
    setLoading(true);
    try {
      await submitKYC(token, { country: country.trim(), id_type: params.idType, id_number: params.idNumber }, params.selfie, params.idFront, params.idBack || undefined);
      router.replace('/kyc/pending');
    } catch (e: any) {
      Alert.alert('Submission failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>←</Text></TouchableOpacity>
          <Text style={styles.title}>Final Details</Text>
          <Text style={styles.step}>Step 3 of 3</Text>
        </View>
        <View style={styles.progressBg}><View style={[styles.progressFill, { width: '100%' }]} /></View>

        <Text style={styles.heading}>Almost done!</Text>
        <Text style={styles.subheading}>Confirm your country and submit for verification.</Text>

        <Text style={styles.fieldLabel}>Country of Residence</Text>
        <TextInput style={styles.input} placeholder="e.g. Tanzania" placeholderTextColor="#98A2B3" value={country} onChangeText={setCountry} />

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>SUBMISSION SUMMARY</Text>
          <Text style={styles.summaryItem}>ID Type: {params.idType ?? '—'}</Text>
          <Text style={styles.summaryItem}>ID Number: {params.idNumber ?? '—'}</Text>
          <Text style={styles.summaryItem}>Selfie: {params.selfie ? 'Captured ✓' : 'Missing'}</Text>
          <Text style={styles.summaryItem}>ID Front: {params.idFront ? 'Uploaded ✓' : 'Missing'}</Text>
          {params.idBack ? <Text style={styles.summaryItem}>ID Back: Uploaded ✓</Text> : null}
        </View>

        <View style={styles.noteRow}>
          <Text style={styles.noteText}>Your documents will be reviewed within 24 hours. You will be notified once approved.</Text>
        </View>

        <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Submit for Verification</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 60 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { fontSize: 22, color: Colors.text },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  step: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark },
  progressBg: { marginTop: 10, height: 6, borderRadius: 99, backgroundColor: '#E5F2E7', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary },
  heading: { marginTop: 20, fontSize: 28, fontWeight: '800', color: Colors.text },
  subheading: { marginTop: 8, color: Colors.textSecondary, lineHeight: 21 },
  fieldLabel: { marginTop: 18, marginBottom: 8, fontSize: 15, fontWeight: '700', color: Colors.text },
  input: { height: 52, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: '#fff', paddingHorizontal: 14, color: Colors.text, fontSize: 16 },
  summaryBox: { marginTop: 20, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EEF2F6' },
  summaryTitle: { fontSize: 12, fontWeight: '800', color: '#98A2B3', letterSpacing: 0.8, marginBottom: 10 },
  summaryItem: { color: Colors.text, fontWeight: '600', marginBottom: 6 },
  noteRow: { marginTop: 14, backgroundColor: '#F4FBF4', borderRadius: 12, padding: 12 },
  noteText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  primaryBtn: { marginTop: 24, height: 54, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
