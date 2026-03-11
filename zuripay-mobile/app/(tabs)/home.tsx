import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

function Action({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <TouchableOpacity style={styles.actionItem}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.avatar} />
          <Text style={styles.brand}>Zuri Pay</Text>
          <View style={styles.bell}>
            <Ionicons name="notifications-outline" size={18} color={Colors.primary} />
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.greeting}>Good morning, Christina 👋</Text>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balance}>TZS 450,000</Text>

          <TouchableOpacity style={styles.addMoneyBtn}>
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.addMoneyText}>Add Money</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Wallets</Text>
          <Text style={styles.link}>+ Add</Text>
        </View>

        <View style={styles.walletRow}>
          <View style={[styles.walletCard, { flex: 1.2 }]}>
            <Text style={styles.walletType}>TANZANIAN SHILLING</Text>
            <Text style={styles.walletAmount}>TZS 320,500</Text>
          </View>
          <View style={[styles.walletCardDark, { flex: 0.8 }]}>
            <Text style={styles.walletTypeDark}>SOUTH KOREAN WON</Text>
            <Text style={styles.walletAmountDark}>₩ 65,000</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Action icon="paper-plane-outline" label="Send" />
          <Action icon="add-outline" label="Add Money" />
          <Action icon="swap-horizontal-outline" label="Swap" />
          <Action icon="ellipsis-horizontal" label="More" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Text style={styles.link}>See all</Text>
        </View>

        {[
          ['Afrimarket Store', '- TZS 45,000'],
          ['Incoming Transfer', '+ TZS 120,000'],
          ['K-Food Deli', '- ₩ 12,000'],
        ].map(([title, amount], i) => (
          <View key={i} style={styles.txItem}>
            <View style={styles.txIcon}>
              <Ionicons name="wallet-outline" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.txTitle}>{title}</Text>
              <Text style={styles.txMeta}>Success</Text>
            </View>
            <Text style={styles.txAmount}>{amount}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 18, paddingBottom: 100 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E7C7B7',
  },
  brand: { fontSize: 18, fontWeight: '700', color: Colors.text },
  bell: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySoft,
  },
  balanceCard: {
    backgroundColor: '#F2FAF2',
    borderRadius: 22,
    padding: 18,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: Colors.text },
  balanceLabel: { color: Colors.textSecondary, marginTop: 8 },
  balance: { fontSize: 36, fontWeight: '800', color: Colors.text, marginTop: 4 },
  addMoneyBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addMoneyText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionHeader: {
    marginTop: 22,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  link: { color: Colors.primaryDark, fontWeight: '700' },
  walletRow: { flexDirection: 'row', gap: 12 },
  walletCard: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    padding: 16,
  },
  walletCardDark: {
    backgroundColor: '#101828',
    borderRadius: 18,
    padding: 16,
  },
  walletType: { color: '#D5F8DA', fontSize: 11, fontWeight: '700' },
  walletAmount: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 10 },
  walletTypeDark: { color: '#98A2B3', fontSize: 11, fontWeight: '700' },
  walletAmountDark: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 10 },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionItem: { alignItems: 'center', width: '24%' },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: { fontSize: 12, color: Colors.text, fontWeight: '600', textAlign: 'center' },
  txItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  txMeta: { fontSize: 12, color: Colors.success, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700', color: Colors.text },
});