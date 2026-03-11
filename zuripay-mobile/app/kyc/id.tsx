import React from 'react';
import { router } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

export default function KycIdScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Verify Identity</Text>
          <Text style={styles.step}>Step 1 of 3</Text>
        </View>

        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: '33%' }]} />
        </View>

        <View style={styles.iconWrap}>
          <Ionicons name="card-outline" size={28} color={Colors.primary} />
        </View>

        <Text style={styles.heading}>Upload Your ID</Text>
        <Text style={styles.subheading}>
          Please provide a clear photo of your National ID or Passport to verify your Zuri Pay account.
        </Text>

        <View style={styles.uploadCard}>
          <View style={styles.uploadIcon}>
            <Ionicons name="camera-outline" size={26} color={Colors.primary} />
          </View>
          <Text style={styles.uploadTitle}>Capture Document</Text>
          <Text style={styles.uploadSub}>Tap to take a photo or upload from gallery</Text>
          <TouchableOpacity style={styles.uploadBtn}>
            <Text style={styles.uploadBtnText}>Select File</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.reqTitle}>REQUIREMENTS</Text>
        {[
          'Clear photo with legible text',
          'All four corners of the document visible',
          'No glare or reflection from lighting',
        ].map((item) => (
          <View key={item} style={styles.reqRow}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
            <Text style={styles.reqText}>{item}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/kyc/liveness')}>
          <Text style={styles.primaryBtnText}>Continue</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>Your data is encrypted and handled securely.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  step: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark },
  progressBg: {
    marginTop: 10,
    height: 6,
    borderRadius: 99,
    backgroundColor: '#E5F2E7',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary },
  iconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 24,
  },
  heading: { marginTop: 18, textAlign: 'center', fontSize: 30, fontWeight: '800', color: Colors.text },
  subheading: {
    marginTop: 8,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  uploadCard: {
    marginTop: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CFE8D4',
    borderRadius: 18,
    backgroundColor: '#FBFFFB',
    padding: 22,
    alignItems: 'center',
  },
  uploadIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#EFF8EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: { marginTop: 12, fontSize: 20, fontWeight: '800', color: Colors.text },
  uploadSub: { marginTop: 6, textAlign: 'center', color: Colors.textSecondary },
  uploadBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    height: 42,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtnText: { color: '#fff', fontWeight: '800' },
  reqTitle: { marginTop: 22, fontSize: 14, fontWeight: '800', letterSpacing: 1, color: Colors.text },
  reqRow: { flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'center' },
  reqText: { color: Colors.textSecondary, fontSize: 14 },
  primaryBtn: {
    marginTop: 24,
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  footerText: { textAlign: 'center', marginTop: 14, color: '#98A2B3', fontSize: 12 },
});