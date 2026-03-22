import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { getKYC, KYCOut } from '../../services/api';

function Row({ icon, title, subtitle, onPress, danger }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress?: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={[styles.rowIcon, danger && { backgroundColor: '#FEECEC' }]}>
        <Ionicons name={icon} size={18} color={danger ? '#EF4444' : Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, danger && { color: '#EF4444' }]}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      {!danger && <Ionicons name="chevron-forward" size={18} color="#98A2B3" />}
    </TouchableOpacity>
  );
}

function kycColor(status?: string) {
  if (status === 'approved') return Colors.success;
  if (status === 'rejected') return '#F04438';
  if (status === 'pending') return '#F79009';
  return Colors.textSecondary;
}

export default function ProfileScreen() {
  const { token, user, clearAuth } = useAuth();
  const [kyc, setKyc] = useState<KYCOut | null>(null);

  useEffect(() => {
    if (token) getKYC(token).then(setKyc).catch(() => {});
  }, [token]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await clearAuth(); router.replace('/(auth)/login'); } },
    ]);
  };

  const initials = user?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Account</Text>

        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        <Text style={styles.name}>{user?.full_name ?? '—'}</Text>
        <Text style={styles.email}>{user?.email ?? '—'}</Text>

        {kyc && (
          <View style={[styles.kycBadge, { borderColor: kycColor(kyc.status) }]}>
            <Ionicons name={kyc.status === 'approved' ? 'shield-checkmark' : 'shield-outline'} size={14} color={kycColor(kyc.status)} />
            <Text style={[styles.kycBadgeText, { color: kycColor(kyc.status) }]}>KYC {kyc.status.toUpperCase()}</Text>
          </View>
        )}

        <Text style={styles.section}>ACCOUNT SETTINGS</Text>
        <Row icon="person-outline" title="Personal Information" subtitle={user?.phone ? `Phone: ${user.phone}` : 'Name, Email, Phone'} />
        <Row icon="shield-checkmark-outline" title="Security" subtitle="Password, Biometrics, 2FA" onPress={() => router.push('/settings/security')} />
        <Row icon="business-outline" title="Linked Accounts" subtitle="Manage your bank accounts" onPress={() => router.push('/(tabs)/recipients')} />
        <Row
          icon="checkmark-done-circle-outline"
          title="KYC Verification"
          subtitle={kyc ? `Status: ${kyc.status}` : 'Verify your identity'}
          onPress={() => { if (kyc?.status !== 'approved') router.push('/kyc/id'); }}
        />

        <Text style={styles.section}>SUPPORT</Text>
        <Row icon="help-circle-outline" title="Help & Support" subtitle="FAQs, Live chat, Contact us" />
        <Row icon="log-out-outline" title="Logout" subtitle="Sign out of your account" danger onPress={handleLogout} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 90 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  avatarWrap: { marginTop: 24, alignSelf: 'center' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 34, fontWeight: '800' },
  name: { marginTop: 14, textAlign: 'center', fontSize: 28, fontWeight: '800', color: Colors.text },
  email: { textAlign: 'center', marginTop: 4, color: Colors.primaryDark, fontSize: 15 },
  kycBadge: { alignSelf: 'center', marginTop: 10, flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1.5 },
  kycBadgeText: { fontWeight: '700', fontSize: 12 },
  section: { marginTop: 26, marginBottom: 10, color: '#98A2B3', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  row: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#EEF2F6', padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 10 },
  rowIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  rowSubtitle: { marginTop: 2, fontSize: 13, color: Colors.textSecondary },
});
