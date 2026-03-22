import React, { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { getRecipients, deleteRecipient, RecipientOut } from '../../services/api';

function RecipientRow({ r, onDelete }: { r: RecipientOut; onDelete: () => void }) {
  return (
    <View style={styles.rowCard}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>
          <Ionicons name={r.bank_name ? 'business-outline' : 'wallet-outline'} size={18} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{r.name}</Text>
          <Text style={styles.rowSubtitle}>{r.bank_name ?? 'Mobile Money'} • {r.phone}</Text>
          <Text style={styles.rowCountry}>{r.country} • {r.currency}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={onDelete}>
        <Ionicons name="trash-outline" size={18} color="#98A2B3" />
      </TouchableOpacity>
    </View>
  );
}

export default function AccountsScreen() {
  const { token } = useAuth();
  const [recipients, setRecipients] = useState<RecipientOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try { const data = await getRecipients(token); setRecipients(data); }
    catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (id: number) => {
    Alert.alert('Remove Recipient', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await deleteRecipient(id, token!); setRecipients(prev => prev.filter(r => r.id !== id)); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[Colors.primary]} />}
      >
        <View style={styles.topRow}>
          <Text style={styles.title}>Manage Accounts</Text>
          <TouchableOpacity style={styles.plusBtn} onPress={() => router.push('/recipient/add')}>
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Saved Recipients</Text>
        <Text style={styles.sectionSub}>People you send money to frequently</Text>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 30 }} />
        ) : recipients.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={40} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No recipients yet</Text>
            <Text style={styles.emptySubtext}>Add someone you regularly send money to</Text>
          </View>
        ) : (
          recipients.map(r => <RecipientRow key={r.id} r={r} onDelete={() => handleDelete(r.id)} />)
        )}

        <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/recipient/add')}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.linkBtnText}>Add New Recipient</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 90 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  plusBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { marginTop: 18, fontSize: 18, fontWeight: '800', color: Colors.text },
  sectionSub: { marginTop: 2, marginBottom: 14, color: Colors.textSecondary, fontSize: 13 },
  rowCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#EEF2F6', padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  rowLeft: { flexDirection: 'row', gap: 12, alignItems: 'center', flex: 1 },
  rowIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  rowSubtitle: { marginTop: 2, color: Colors.textSecondary, fontSize: 13 },
  rowCountry: { marginTop: 2, color: Colors.primaryDark, fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 12 },
  emptySubtext: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  linkBtn: { marginTop: 20, height: 54, borderRadius: 14, backgroundColor: Colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  linkBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
