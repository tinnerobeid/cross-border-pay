import React from 'react';
import { router } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/colors';

export default function KycAddressScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Address Verification</Text>
          <Text style={styles.step}>Step 3 of 4</Text>
        </View>

        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: '75%' }]} />
        </View>

        <Text style={styles.heading}>Residential Address</Text>
        <Text style={styles.subheading}>
          Please provide your current address details as they appear on your supporting documents.
        </Text>

        <TextInput placeholder="e.g. 123 Green Street" placeholderTextColor="#98A2B3" style={styles.input} />
        <View style={styles.row}>
          <TextInput placeholder="City" placeholderTextColor="#98A2B3" style={[styles.input, styles.half]} />
          <TextInput placeholder="10001" placeholderTextColor="#98A2B3" style={[styles.input, styles.half]} />
        </View>
        <TextInput placeholder="United States" placeholderTextColor="#98A2B3" style={styles.input} />

        <View style={styles.uploadBox}>
          <Text style={styles.uploadTitle}>Upload Utility Bill or Bank Statement</Text>
          <Text style={styles.uploadSub}>Max file size 5MB. Formats: PDF, JPG, PNG</Text>
        </View>

        <View style={styles.noteRow}>
          <Text style={styles.noteText}>
            Document must be issued within the last 3 months and clearly show your full name and address.
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/kyc/pending')}>
          <Text style={styles.primaryBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { fontSize: 22, color: Colors.text },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  step: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark },
  progressBg: { marginTop: 10, height: 6, borderRadius: 99, backgroundColor: '#E5F2E7', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary },
  heading: { marginTop: 20, fontSize: 30, fontWeight: '800', color: Colors.text },
  subheading: { marginTop: 8, color: Colors.textSecondary, lineHeight: 21 },
  input: {
    marginTop: 14,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    color: Colors.text,
  },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  uploadBox: {
    marginTop: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CFE8D4',
    borderRadius: 16,
    backgroundColor: '#FBFFFB',
    padding: 18,
    alignItems: 'center',
  },
  uploadTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  uploadSub: { marginTop: 6, color: Colors.textSecondary, textAlign: 'center' },
  noteRow: {
    marginTop: 12,
    backgroundColor: '#F4FBF4',
    borderRadius: 12,
    padding: 12,
  },
  noteText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  primaryBtn: {
    marginTop: 20,
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});