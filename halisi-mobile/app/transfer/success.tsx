import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

export default function SuccessScreen() {
  const params = useLocalSearchParams<{
    transferId?: string; sendAmount?: string; receiveAmount?: string;
    sendCurrency?: string; receiveCurrency?: string; fxRate?: string;
    recipientName?: string; createdAt?: string; status?: string;
  }>();

  const transferId = params.transferId ?? '—';
  const sendAmount = params.sendAmount ?? '0.00';
  const receiveAmount = params.receiveAmount ?? '0.00';
  const sendCurrency = params.sendCurrency ?? 'TZS';
  const receiveCurrency = params.receiveCurrency ?? 'KRW';
  const fxRate = params.fxRate ?? '0';
  const recipientName = params.recipientName ?? '—';
  const createdAt = params.createdAt ? new Date(params.createdAt).toLocaleString() : '—';
  const status = params.status ?? 'CREATED';

  const handleShare = async () => {
    try {
      await Share.share({
        message: [
          '--- Halisi Transfer Receipt ---',
          `Transaction ID: #HL-${transferId}`,
          `Date: ${createdAt}`,
          `Status: ${status}`,
          `Recipient: ${recipientName}`,
          `Amount Sent: ${Number(sendAmount).toLocaleString()} ${sendCurrency}`,
          `Exchange Rate: 1 ${sendCurrency} = ${Number(fxRate).toFixed(4)} ${receiveCurrency}`,
          `Recipient Receives: ${Number(receiveAmount).toLocaleString()} ${receiveCurrency}`,
          '',
          'Secured by Halisi',
        ].join('\n'),
        title: `Halisi Receipt #HL-${transferId}`,
      });
    } catch (e: any) {
      Alert.alert('Share failed', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={{ width: 22 }} />
          <Text style={styles.title}>Receipt</Text>
          <TouchableOpacity onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.successIconWrap}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={28} color="#fff" />
          </View>
        </View>
        <Text style={styles.successTitle}>Transfer Initiated</Text>
        <Text style={styles.successSubtitle}>Your transfer is being processed</Text>

        <View style={styles.amountCard}>
          <Text style={styles.amountCardLabel}>TOTAL AMOUNT SENT</Text>
          <Text style={styles.amountCardValue}>{Number(sendAmount).toLocaleString()} {sendCurrency}</Text>
          <View style={styles.instantBadge}>
            <Text style={styles.instantBadgeText}>Halisi Transfer</Text>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>#HL-{transferId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>{createdAt}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[styles.detailValue, { color: Colors.primary }]}>● {status}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recipient</Text>
            <Text style={styles.detailValue}>{recipientName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Exchange Rate</Text>
            <Text style={styles.detailValue}>1 {sendCurrency} = {Number(fxRate).toFixed(4)} {receiveCurrency}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recipient Receives</Text>
            <Text style={styles.detailValue}>{Number(receiveAmount).toLocaleString()} {receiveCurrency}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/(tabs)/home')}>
          <Text style={styles.secondaryBtnText}>Done</Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>Secured by Halisi</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 80 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  successIconWrap: { alignItems: 'center', marginTop: 22 },
  successIconCircle: { width: 62, height: 62, borderRadius: 31, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  successTitle: { marginTop: 14, textAlign: 'center', fontSize: 30, fontWeight: '800', color: Colors.text },
  successSubtitle: { textAlign: 'center', color: Colors.textSecondary, marginTop: 4, marginBottom: 16 },
  amountCard: { backgroundColor: '#F1FAF1', borderRadius: 18, paddingVertical: 18, alignItems: 'center' },
  amountCardLabel: { fontSize: 12, fontWeight: '800', color: Colors.textSecondary, letterSpacing: 0.6 },
  amountCardValue: { marginTop: 6, fontSize: 34, fontWeight: '800', color: Colors.primary },
  instantBadge: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: '#DFF4E0' },
  instantBadgeText: { color: Colors.primaryDark, fontSize: 12, fontWeight: '700' },
  detailsSection: { marginTop: 18, backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#EEF2F6' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, gap: 16 },
  detailLabel: { color: Colors.textSecondary, fontSize: 14 },
  detailValue: { color: Colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right', flex: 1 },
  secondaryBtn: { height: 52, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, marginTop: 18, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  footerText: { textAlign: 'center', marginTop: 16, color: '#98A2B3', fontSize: 12 },
});
