import React from 'react';
import { router } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/colors';

export default function KycPendingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>KYC Verification</Text>

        <View style={styles.illustration} />

        <View style={styles.badge}>
          <Text style={styles.badgeText}>IN PROGRESS</Text>
        </View>

        <Text style={styles.heading}>Verification Pending</Text>
        <Text style={styles.subheading}>
          We’re verifying your account documents. This usually takes less than 24 hours. We’ll notify you once it’s complete.
        </Text>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Document Review</Text>
            <Text style={styles.progressPct}>60%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.stepText}>STEP 2 OF 3</Text>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)/home')}>
          <Text style={styles.primaryBtnText}>Go to Dashboard</Text>
        </TouchableOpacity>

        <Text style={styles.help}>Need Help? Contact Support</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { textAlign: 'center', fontSize: 18, fontWeight: '700', color: Colors.text },
  illustration: {
    marginTop: 24,
    height: 180,
    borderRadius: 22,
    backgroundColor: '#F5EDE3',
  },
  badge: {
    alignSelf: 'center',
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EAF9EC',
  },
  badgeText: { color: Colors.primaryDark, fontWeight: '800', fontSize: 12 },
  heading: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
  },
  subheading: {
    textAlign: 'center',
    marginTop: 10,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  progressCard: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontWeight: '700', color: Colors.text },
  progressPct: { color: Colors.primaryDark, fontWeight: '800' },
  progressBg: {
    height: 8,
    borderRadius: 99,
    backgroundColor: '#EAF2EB',
    overflow: 'hidden',
  },
  progressFill: { width: '60%', height: '100%', backgroundColor: Colors.primary },
  stepText: { marginTop: 8, color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },
  primaryBtn: {
    marginTop: 22,
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  help: { textAlign: 'center', marginTop: 16, color: Colors.textSecondary, fontWeight: '600' },
});