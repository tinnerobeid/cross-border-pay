import React, { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

function Row({
  icon,
  title,
  subtitle,
  trailing,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.icon, danger && { backgroundColor: '#FEECEC' }]}>
        <Ionicons name={icon} size={18} color={danger ? '#EF4444' : Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, danger && { color: '#EF4444' }]}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      {trailing}
    </TouchableOpacity>
  );
}

export default function SecurityScreen() {
  const [bio, setBio] = useState(true);
  const [twoFa, setTwoFa] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Security Settings</Text>
          <View style={{ width: 22 }} />
        </View>

        <Text style={styles.section}>LOGIN & ACCESS</Text>
        <Row
          icon="lock-closed-outline"
          title="Change PIN"
          subtitle="Update your 6-digit transaction PIN"
          trailing={<Ionicons name="chevron-forward" size={18} color="#98A2B3" />}
          onPress={() => router.push('/settings/pin')}
        />
        <Row
          icon="finger-print-outline"
          title="Biometric Login"
          subtitle="Use Face ID or Fingerprint"
          trailing={<Switch value={bio} onValueChange={setBio} trackColor={{ false: '#D0D5DD', true: Colors.primary }} />}
        />
        <Row
          icon="shield-checkmark-outline"
          title="Two-Factor Authentication"
          subtitle="Secure login with SMS or Email"
          trailing={<Switch value={twoFa} onValueChange={setTwoFa} trackColor={{ false: '#D0D5DD', true: Colors.primary }} />}
        />

        <Text style={styles.section}>DEVICE MANAGEMENT</Text>
        <Row
          icon="phone-portrait-outline"
          title="Active Sessions"
          subtitle="2 devices currently logged in"
          trailing={<Ionicons name="chevron-forward" size={18} color="#98A2B3" />}
        />

        <Text style={styles.section}>PRIVACY & DATA</Text>
        <Row
          icon="document-text-outline"
          title="Data Permissions"
          subtitle="Manage third-party access"
          trailing={<Ionicons name="chevron-forward" size={18} color="#98A2B3" />}
        />
        <Row
          icon="trash-outline"
          title="Delete Account"
          subtitle="Permanently remove your data"
          danger
        />

        <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/settings/notifications')}>
          <Text style={styles.linkBtnText}>Open Notifications Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  section: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 0.8,
  },
  row: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  rowSub: { marginTop: 2, color: Colors.textSecondary, fontSize: 13 },
  linkBtn: {
    marginTop: 16,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkBtnText: { color: Colors.text, fontWeight: '700' },
});