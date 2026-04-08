import React, { useCallback, useEffect, useState } from 'react';
import { router, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import {
  getRecipients, deleteRecipient, RecipientOut,
  getLinkedAccounts, unlinkAccount, setDefaultLinkedAccount, LinkedAccountOut,
} from '../../services/api';

// ── Linked account card ────────────────────────────────────────────────────────

function LinkedAccountCard({
  account, onSetDefault, onRemove,
}: {
  account: LinkedAccountOut;
  onSetDefault: () => void;
  onRemove: () => void;
}) {
  const isBank = account.account_type === 'bank';
  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.cardIcon, isBank ? {} : { backgroundColor: '#FFF4E5' }]}>
          <Ionicons
            name={isBank ? 'business-outline' : 'phone-portrait-outline'}
            size={18}
            color={isBank ? Colors.primary : '#E07B00'}
          />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{account.provider}</Text>
            {account.is_default && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardSub}>{account.account_holder}</Text>
          <Text style={styles.cardNumber}>{account.account_number}</Text>
          <Text style={styles.cardCountry}>{account.country} · {account.currency}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        {!account.is_default && (
          <TouchableOpacity style={styles.actionBtn} onPress={onSetDefault}>
            <Ionicons name="star-outline" size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FEF2F2' }]} onPress={onRemove}>
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Recipient row ──────────────────────────────────────────────────────────────

function RecipientRow({ r, onDelete }: { r: RecipientOut; onDelete: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.cardIcon}>
          <Ionicons name={r.bank_name ? 'business-outline' : 'wallet-outline'} size={18} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{r.name}</Text>
          <Text style={styles.cardSub}>{r.bank_name ?? 'Mobile Money'} · {r.phone}</Text>
          <Text style={styles.cardCountry}>{r.country} · {r.currency}</Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FEF2F2' }]} onPress={onDelete}>
        <Ionicons name="trash-outline" size={16} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function AccountsScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const [linked, setLinked] = useState<LinkedAccountOut[]>([]);
  const [recipients, setRecipients] = useState<RecipientOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [la, rec] = await Promise.all([
        getLinkedAccounts(token),
        getRecipients(token),
      ]);
      setLinked(la);
      setRecipients(rec);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => {
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const handleRemoveLinked = (id: number) => {
    Alert.alert('Remove Account', 'Disconnect this account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try { await unlinkAccount(id, token!); setLinked(prev => prev.filter(a => a.id !== id)); }
          catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  const handleSetDefault = async (id: number) => {
    try {
      const updated = await setDefaultLinkedAccount(id, token!);
      setLinked(prev => prev.map(a => ({ ...a, is_default: a.id === updated.id })));
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleDeleteRecipient = (id: number) => {
    Alert.alert('Remove Recipient', 'Remove this recipient?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try { await deleteRecipient(id, token!); setRecipients(prev => prev.filter(r => r.id !== id)); }
          catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            colors={[Colors.primary]}
          />
        }
      >
        <Text style={styles.pageTitle}>Accounts</Text>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* ── My Linked Accounts ── */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>My Accounts</Text>
                <Text style={styles.sectionSub}>Your connected bank & mobile money accounts</Text>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/link-account')}>
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {linked.length === 0 ? (
              <TouchableOpacity style={styles.emptyCard} onPress={() => router.push('/link-account')}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="link-outline" size={24} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emptyTitle}>No accounts linked yet</Text>
                  <Text style={styles.emptyText}>Connect your bank or mobile money account</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
              </TouchableOpacity>
            ) : (
              linked.map(a => (
                <LinkedAccountCard
                  key={a.id}
                  account={a}
                  onSetDefault={() => handleSetDefault(a.id)}
                  onRemove={() => handleRemoveLinked(a.id)}
                />
              ))
            )}

            <TouchableOpacity style={styles.linkMoreBtn} onPress={() => router.push('/link-account')}>
              <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.linkMoreText}>Link Another Account</Text>
            </TouchableOpacity>

            {/* ── Recipients ── */}
            <View style={[styles.sectionHeader, { marginTop: 30 }]}>
              <View>
                <Text style={styles.sectionTitle}>Recipients</Text>
                <Text style={styles.sectionSub}>People you send money to</Text>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/recipient/add')}>
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {recipients.length === 0 ? (
              <TouchableOpacity style={styles.emptyCard} onPress={() => router.push('/recipient/add')}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="people-outline" size={24} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emptyTitle}>No recipients yet</Text>
                  <Text style={styles.emptyText}>Save people you send money to frequently</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
              </TouchableOpacity>
            ) : (
              recipients.map(r => (
                <RecipientRow key={r.id} r={r} onDelete={() => handleDeleteRecipient(r.id)} />
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 100 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  sectionSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#EEF2F6',
    padding: 14, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  cardLeft: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', flex: 1 },
  cardIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  defaultBadge: {
    backgroundColor: Colors.primarySoft, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  defaultBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.primary },
  cardSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  cardNumber: { fontSize: 13, fontWeight: '700', color: Colors.text, marginTop: 2 },
  cardCountry: { fontSize: 12, color: Colors.primaryDark, fontWeight: '600', marginTop: 2 },
  cardActions: { flexDirection: 'column', gap: 8, marginLeft: 8 },
  actionBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1,
    borderColor: Colors.primary, borderStyle: 'dashed', padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10,
  },
  emptyIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  linkMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12,
  },
  linkMoreText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
});
