import React, { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

function ToggleRow({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: '#D0D5DD', true: Colors.primary }} />
    </View>
  );
}

export default function NotificationsScreen() {
  const [incoming, setIncoming] = useState(true);
  const [outgoing, setOutgoing] = useState(true);
  const [newLogins, setNewLogins] = useState(true);
  const [securityChanges, setSecurityChanges] = useState(true);
  const [accountUpdates, setAccountUpdates] = useState(true);
  const [offers, setOffers] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Notifications</Text>
          <Ionicons name="help-circle-outline" size={20} color={Colors.primary} />
        </View>

        <Text style={styles.section}>TRANSACTION ALERTS</Text>
        <ToggleRow title="Incoming Transactions" subtitle="Instant alerts when you receive money" value={incoming} onChange={setIncoming} />
        <ToggleRow title="Outgoing Transactions" subtitle="Confirmation for all payments, transfers, and withdrawals" value={outgoing} onChange={setOutgoing} />

        <Text style={styles.section}>SECURITY & ACCOUNT</Text>
        <ToggleRow title="New Logins" subtitle="Get notified whenever your account is accessed from a new device" value={newLogins} onChange={setNewLogins} />
        <ToggleRow title="Security Changes" subtitle="Alerts for PIN changes, biometric updates, or password resets" value={securityChanges} onChange={setSecurityChanges} />
        <ToggleRow title="Account Updates" subtitle="Important news about your Zuri Pay account and policy changes" value={accountUpdates} onChange={setAccountUpdates} />

        <Text style={styles.section}>MARKETING & NEWS</Text>
        <ToggleRow title="Promotions & Offers" subtitle="Exclusive deals, cashback rewards, and partner discounts" value={offers} onChange={setOffers} />
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
    color: '#98A2B3',
    fontSize: 12,
    fontWeight: '800',
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
    gap: 10,
    alignItems: 'center',
  },
  rowTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  rowSub: { marginTop: 2, color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
});