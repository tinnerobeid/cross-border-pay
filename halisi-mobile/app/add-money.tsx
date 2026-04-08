import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import Colors from '../constants/colors';
import {
  getLinkedAccounts, getWallets, depositFromLinkedAccount,
  LinkedAccountOut, WalletOut,
} from '../services/api';

const BANK_DETAILS = {
  bankName: 'CRDB Bank Tanzania',
  accountName: 'Halisi Ltd',
  accountNumber: '0152-199-888-800',
  branch: 'Dar es Salaam Main',
  swiftCode: 'CORUTZTZ',
};

const MOBILE_OPTIONS = [
  { name: 'M-Pesa', number: '*150*00#', color: '#E01F26' },
  { name: 'Tigo Pesa', number: '*150*01#', color: '#0072C6' },
  { name: 'Airtel Money', number: '*150*60#', color: '#E40000' },
  { name: 'HaloPesa', number: '*150*88#', color: '#00853F' },
];

type Tab = 'linked' | 'bank' | 'mobile';

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.copyRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.copyLabel}>{label}</Text>
        <Text style={styles.copyValue}>{value}</Text>
      </View>
      <TouchableOpacity
        style={styles.copyBtn}
        onPress={() => { Clipboard.setStringAsync(value); Alert.alert('Copied', `${label} copied`); }}
      >
        <Ionicons name="copy-outline" size={16} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const ACCOUNT_ICON: Record<string, string> = {
  bank: 'business-outline',
  mobile_money: 'phone-portrait-outline',
};

export default function AddMoneyScreen() {
  const { user, token } = useAuth();
  const [tab, setTab] = useState<Tab>('linked');

  // linked tab state
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccountOut[]>([]);
  const [wallets, setWallets] = useState<WalletOut[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<LinkedAccountOut | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<WalletOut | null>(null);
  const [amount, setAmount] = useState('');
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [depositing, setDepositing] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [la, ws] = await Promise.all([getLinkedAccounts(token), getWallets(token)]);
      setLinkedAccounts(la);
      setWallets(ws);
      if (la.length > 0) setSelectedAccount(la[0]);
    } catch { /* silent */ }
    finally { setLoadingAccounts(false); }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-select wallet that matches the selected account's currency
  useEffect(() => {
    if (!selectedAccount) return;
    const match = wallets.find(w => w.currency === selectedAccount.currency);
    setSelectedWallet(match ?? null);
  }, [selectedAccount, wallets]);

  const handleDeposit = async () => {
    if (!selectedAccount || !selectedWallet || !token) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { Alert.alert('Invalid amount', 'Please enter a valid amount.'); return; }

    setDepositing(true);
    try {
      const result = await depositFromLinkedAccount(selectedWallet.id, selectedAccount.id, amt, token);
      Alert.alert(
        'Deposit Successful',
        `${result.currency} ${result.amount.toLocaleString()} added from ${result.source}.\nNew balance: ${result.currency} ${result.new_balance.toLocaleString()}`,
        [{ text: 'Done', onPress: () => router.back() }],
      );
    } catch (e: any) {
      Alert.alert('Deposit Failed', e.message);
    } finally {
      setDepositing(false);
    }
  };

  const TABS: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'linked', label: 'My Accounts', icon: 'link-outline' },
    { key: 'bank', label: 'Bank Transfer', icon: 'business-outline' },
    { key: 'mobile', label: 'Mobile Money', icon: 'phone-portrait-outline' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.primaryDark} />
          </TouchableOpacity>
          <Text style={styles.title}>Add Money</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Ionicons name={t.icon} size={14} color={tab === t.key ? Colors.primary : Colors.textSecondary} />
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Linked accounts tab ── */}
        {tab === 'linked' && (
          loadingAccounts ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
          ) : linkedAccounts.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="link-outline" size={36} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No accounts linked</Text>
              <Text style={styles.emptyText}>Link a bank or mobile money account first</Text>
              <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/link-account')}>
                <Text style={styles.linkBtnText}>Link Account</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.sectionLabel}>SELECT SOURCE ACCOUNT</Text>
              {linkedAccounts.map(acc => (
                <TouchableOpacity
                  key={acc.id}
                  style={[styles.accountCard, selectedAccount?.id === acc.id && styles.accountCardActive]}
                  onPress={() => setSelectedAccount(acc)}
                >
                  <View style={[styles.accountIcon, selectedAccount?.id === acc.id && { backgroundColor: Colors.primarySoft }]}>
                    <Ionicons
                      name={ACCOUNT_ICON[acc.account_type] as keyof typeof Ionicons.glyphMap ?? 'card-outline'}
                      size={20}
                      color={selectedAccount?.id === acc.id ? Colors.primary : Colors.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accountProvider}>{acc.provider}</Text>
                    <Text style={styles.accountNumber}>{acc.account_number} · {acc.currency}</Text>
                  </View>
                  {selectedAccount?.id === acc.id && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}

              {selectedWallet ? (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: 24 }]}>AMOUNT TO DEPOSIT</Text>
                  <View style={styles.amountBox}>
                    <TextInput
                      style={styles.amountInput}
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="0.00"
                      placeholderTextColor="#B7C0CC"
                      keyboardType="numeric"
                    />
                    <Text style={styles.amountCurrency}>{selectedWallet.currency}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="wallet-outline" size={14} color={Colors.primaryDark} />
                    <Text style={styles.infoText}>
                      Current balance: {selectedWallet.currency} {Number(selectedWallet.balance).toLocaleString()}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.depositBtn, depositing && { opacity: 0.7 }]}
                    onPress={handleDeposit}
                    disabled={depositing}
                  >
                    {depositing
                      ? <ActivityIndicator color="#fff" />
                      : <>
                          <Ionicons name="arrow-down-circle-outline" size={18} color="#fff" />
                          <Text style={styles.depositBtnText}>Deposit to Wallet</Text>
                        </>
                    }
                  </TouchableOpacity>
                </>
              ) : selectedAccount ? (
                <View style={styles.notice}>
                  <Ionicons name="warning-outline" size={16} color="#B45309" />
                  <Text style={[styles.noticeText, { color: '#B45309' }]}>
                    You don't have a {selectedAccount.currency} wallet yet.{' '}
                    <Text style={{ fontWeight: '800' }} onPress={() => router.push('/add-wallet')}>
                      Add one →
                    </Text>
                  </Text>
                </View>
              ) : null}
            </>
          )
        )}

        {/* ── Bank transfer tab ── */}
        {tab === 'bank' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.bankIcon}>
                <Ionicons name="business" size={22} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.cardTitle}>{BANK_DETAILS.bankName}</Text>
                <Text style={styles.cardSub}>Bank Transfer</Text>
              </View>
            </View>
            <CopyRow label="Account Name" value={BANK_DETAILS.accountName} />
            <CopyRow label="Account Number" value={BANK_DETAILS.accountNumber} />
            <CopyRow label="Branch" value={BANK_DETAILS.branch} />
            <CopyRow label="SWIFT / BIC" value={BANK_DETAILS.swiftCode} />
            <CopyRow label="Reference (required)" value={user?.phone ?? user?.email ?? 'Your phone number'} />
            <View style={styles.notice}>
              <Ionicons name="information-circle-outline" size={16} color="#1D6FAC" />
              <Text style={styles.noticeText}>
                Always include your phone number as reference. Funds appear within 1–3 business hours.
              </Text>
            </View>
          </View>
        )}

        {/* ── Mobile money tab ── */}
        {tab === 'mobile' && (
          <View>
            {MOBILE_OPTIONS.map(opt => (
              <View key={opt.name} style={styles.mobileCard}>
                <View style={[styles.mobileLogo, { backgroundColor: opt.color + '20' }]}>
                  <Ionicons name="phone-portrait-outline" size={22} color={opt.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mobileName}>{opt.name}</Text>
                  <Text style={styles.mobileInstructions}>
                    Dial <Text style={styles.mobileCode}>{opt.number}</Text> → Send Money → Business → Halisi
                  </Text>
                </View>
              </View>
            ))}
            <View style={styles.notice}>
              <Ionicons name="information-circle-outline" size={16} color="#1D6FAC" />
              <Text style={styles.noticeText}>
                Use your registered phone number when sending. Deposits are reflected instantly.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 60 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 4, marginBottom: 22, borderWidth: 1, borderColor: '#EEF2F6' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 12 },
  tabActive: { backgroundColor: Colors.primarySoft },
  tabText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: Colors.textSecondary, letterSpacing: 0.6, marginBottom: 10 },
  accountCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, borderWidth: 1.5, borderColor: '#EEF2F6' },
  accountCardActive: { borderColor: Colors.primary, backgroundColor: '#F6FFF6' },
  accountIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F1F4F2', alignItems: 'center', justifyContent: 'center' },
  accountProvider: { fontSize: 15, fontWeight: '700', color: Colors.text },
  accountNumber: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  amountBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, height: 58, marginBottom: 10 },
  amountInput: { flex: 1, fontSize: 26, fontWeight: '800', color: Colors.text },
  amountCurrency: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  infoText: { fontSize: 13, color: Colors.primaryDark, fontWeight: '600' },
  depositBtn: { height: 52, borderRadius: 14, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  depositBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 12 },
  emptyText: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  linkBtn: { marginTop: 20, backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  linkBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  notice: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: '#EAF4FF', borderRadius: 12, padding: 14, marginTop: 16 },
  noticeText: { flex: 1, fontSize: 13, color: '#1D6FAC', lineHeight: 20 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#EEF2F6' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  bankIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  cardSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  copyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderColor: '#F1F4F2' },
  copyLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  copyValue: { fontSize: 15, fontWeight: '700', color: Colors.text, marginTop: 2 },
  copyBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  mobileCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10, borderWidth: 1, borderColor: '#EEF2F6' },
  mobileLogo: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  mobileName: { fontSize: 16, fontWeight: '800', color: Colors.text },
  mobileInstructions: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, lineHeight: 20 },
  mobileCode: { fontWeight: '800', color: Colors.text },
});
