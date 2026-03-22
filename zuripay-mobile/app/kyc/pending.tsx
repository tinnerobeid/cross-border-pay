import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { getKYC, KYCOut } from '../../services/api';

function statusColor(s: string) {
  if (s === 'approved') return Colors.success;
  if (s === 'rejected') return '#F04438';
  return '#F79009';
}

export default function KycPendingScreen() {
  const { token } = useAuth();
  const [kyc, setKyc] = useState<KYCOut | null>(null);

  useEffect(() => {
    if (token) getKYC(token).then(setKyc).catch(() => {});
  }, [token]);

  const status = kyc?.status ?? 'pending';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>KYC Verification</Text>

        <View style={styles.iconWrap}>
          <Ionicons
            name={status === 'approved' ? 'shield-checkmark' : status === 'rejected' ? 'close-circle' : 'time'}
            size={56}
            color={statusColor(status)}
          />
        </View>

        <View style={[styles.badge, { borderColor: statusColor(status) }]}>
          <Text style={[styles.badgeText, { color: statusColor(status) }]}>{status.toUpperCase()}</Text>
        </View>

        <Text style={styles.heading}>
          {status === 'approved' ? 'Verification Complete' : status === 'rejected' ? 'Verification Failed' : 'Verification Pending'}
        </Text>
        <Text style={styles.subheading}>
          {status === 'approved'
            ? 'Your identity has been verified. You can now send money.'
            : status === 'rejected'
            ? (kyc?.review_note ?? 'Documents were not accepted. Please resubmit.')
            : 'We are reviewing your documents. This usually takes less than 24 hours.'}
        </Text>

        {kyc && (
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Country: {kyc.country}</Text>
            <Text style={styles.infoLabel}>ID Type: {kyc.id_type}</Text>
          </View>
        )}

        {status === 'rejected' && (
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#F04438' }]} onPress={() => router.replace('/kyc/id')}>
            <Text style={styles.primaryBtnText}>Resubmit Documents</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.primaryBtn, status === 'rejected' && { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border }]}
          onPress={() => router.replace('/(tabs)/home')}
        >
          <Text style={[styles.primaryBtnText, status === 'rejected' && { color: Colors.text }]}>Go to Dashboard</Text>
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
  iconWrap: { alignSelf: 'center', marginTop: 24, marginBottom: 8 },
  badge: { alignSelf: 'center', marginTop: 10, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1.5 },
  badgeText: { fontWeight: '800', fontSize: 12 },
  heading: { marginTop: 16, textAlign: 'center', fontSize: 28, fontWeight: '800', color: Colors.text },
  subheading: { textAlign: 'center', marginTop: 10, color: Colors.textSecondary, lineHeight: 22 },
  infoBox: { marginTop: 20, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EEF2F6' },
  infoLabel: { color: Colors.text, fontWeight: '600', marginBottom: 6 },
  primaryBtn: { marginTop: 16, height: 54, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  help: { textAlign: 'center', marginTop: 16, color: Colors.textSecondary, fontWeight: '600' },
});
