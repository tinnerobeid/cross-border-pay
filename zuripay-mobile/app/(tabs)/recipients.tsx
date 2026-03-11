import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

const bankAccounts = [
  { name: 'Stanbic Bank', subtitle: 'Checking • •••• 1234' },
  { name: 'GTBank', subtitle: 'Savings • •••• 5678' },
];

const walletAccounts = [
  { name: 'MTN Mobile Money', subtitle: '+233 • • • • 890' },
  { name: 'AirtelTigo Money', subtitle: '+233 • • • • 432' },
];

function AccountRow({
  icon,
  name,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  name: string;
  subtitle: string;
}) {
  return (
    <View style={styles.rowCard}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>
          <Ionicons name={icon} size={18} color={Colors.primary} />
        </View>
        <View>
          <Text style={styles.rowTitle}>{name}</Text>
          <Text style={styles.rowSubtitle}>{subtitle}</Text>
        </View>
      </View>

      <TouchableOpacity>
        <Ionicons name="trash-outline" size={18} color="#98A2B3" />
      </TouchableOpacity>
    </View>
  );
}

export default function AccountsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Manage Accounts</Text>
          <TouchableOpacity style={styles.plusBtn}>
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Bank Accounts</Text>
        <Text style={styles.sectionSub}>Manage your linked traditional bank accounts</Text>

        {bankAccounts.map((item) => (
          <AccountRow
            key={item.name}
            icon="business-outline"
            name={item.name}
            subtitle={item.subtitle}
          />
        ))}

        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>Mobile Money Wallets</Text>
        <Text style={styles.sectionSub}>Quick transfers to your mobile wallets</Text>

        {walletAccounts.map((item) => (
          <AccountRow
            key={item.name}
            icon="wallet-outline"
            name={item.name}
            subtitle={item.subtitle}
          />
        ))}

        <TouchableOpacity style={styles.linkBtn}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.linkBtnText}>Link New Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 90 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  plusBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  sectionSub: {
    marginTop: 2,
    marginBottom: 10,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  rowCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  rowSubtitle: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  linkBtn: {
    marginTop: 20,
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  linkBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});