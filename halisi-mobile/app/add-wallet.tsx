import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { addWallet } from '../services/api';

const CURRENCIES = [
  { code: 'TZS', name: 'Tanzanian Shilling', flag: '🇹🇿', region: 'East Africa' },
  { code: 'KRW', name: 'South Korean Won', flag: '🇰🇷', region: 'Asia' },
  { code: 'KES', name: 'Kenyan Shilling', flag: '🇰🇪', region: 'East Africa' },
  { code: 'RWF', name: 'Rwandan Franc', flag: '🇷🇼', region: 'East Africa' },
  { code: 'BIF', name: 'Burundian Franc', flag: '🇧🇮', region: 'East Africa' },
  { code: 'UGX', name: 'Ugandan Shilling', flag: '🇺🇬', region: 'East Africa' },
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', region: 'International' },
];

export default function AddWalletScreen() {
  const { token } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAdd = async (code: string) => {
    if (!token) return;
    setLoading(code);
    try {
      await addWallet(code, token);
      Alert.alert('Wallet Added', `Your ${code} wallet has been created.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(null);
    }
  };

  const grouped: Record<string, typeof CURRENCIES> = {};
  CURRENCIES.forEach(c => {
    if (!grouped[c.region]) grouped[c.region] = [];
    grouped[c.region].push(c);
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.primaryDark} />
          </TouchableOpacity>
          <Text style={styles.title}>Add Currency Wallet</Text>
          <View style={{ width: 22 }} />
        </View>

        <Text style={styles.subtitle}>
          Hold balances in multiple currencies. Each wallet can receive transfers and top-ups independently.
        </Text>

        {Object.entries(grouped).map(([region, items]) => (
          <View key={region}>
            <Text style={styles.region}>{region.toUpperCase()}</Text>
            {items.map(c => (
              <TouchableOpacity
                key={c.code}
                style={styles.card}
                onPress={() => handleAdd(c.code)}
                disabled={loading !== null}
              >
                <Text style={styles.flag}>{c.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.code}>{c.code}</Text>
                  <Text style={styles.name}>{c.name}</Text>
                </View>
                {loading === c.code ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <View style={styles.addBtn}>
                    <Ionicons name="add" size={18} color={Colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 60 },
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24, lineHeight: 22 },
  region: {
    fontSize: 11, fontWeight: '800', color: '#98A2B3',
    letterSpacing: 1, marginBottom: 10, marginTop: 8,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#EEF2F6',
  },
  flag: { fontSize: 28 },
  code: { fontSize: 16, fontWeight: '800', color: Colors.text },
  name: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
});
