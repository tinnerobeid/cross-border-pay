import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

export default function ConfirmTransferScreen() {
  const params = useLocalSearchParams<{
    amount?: string;
    gets?: string;
    fee?: string;
  }>();

  const amount = params.amount ?? '0.00';
  const gets = params.gets ?? '0.00';
  const fee = params.fee ?? '0.00';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Review Transfer</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.amountHero}>
          <Text style={styles.amountHeroValue}>{amount} TZS</Text>
          <Text style={styles.amountHeroLabel}>Amount to send</Text>
        </View>

        <Text style={styles.sectionTitle}>RECIPIENT DETAILS</Text>
        <View style={styles.recipientCard}>
          <View style={styles.personIcon}>
            <Ionicons name="person" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.recipientName}>Elena Rodriguez</Text>
            <Text style={styles.recipientMeta}>Standard Bank • •••• 8829</Text>
            <Text style={styles.recipientCountry}>Madrid, Spain</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>TRANSACTION SUMMARY</Text>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Exchange Rate</Text>
            <Text style={styles.summaryValue}>1 TZS = 0.52 KRW</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Transfer Fee</Text>
            <Text style={styles.summaryValue}>{fee} TZS</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Fee</Text>
            <Text style={styles.summaryValue}>0.00 TZS</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 8 }]}>
            <Text style={styles.totalReceiveLabel}>Total to Receive</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.totalReceiveValue}>{gets} KRW</Text>
              <Text style={styles.arrivalText}>Est. arrival today</Text>
            </View>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressLine} />
          <View style={styles.progressPlane}>
            <Ionicons name="paper-plane" size={18} color={Colors.primary} />
          </View>
          <View style={styles.progressDotLeft} />
          <View style={styles.progressDotRight} />
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() =>
            router.replace({
              pathname: '/transfer/success',
              params: { amount, gets },
            })
          }
        >
          <Text style={styles.primaryBtnText}>Confirm & Send</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel Transaction</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 20 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  amountHero: {
    marginTop: 18,
    backgroundColor: '#F2F8F0',
    borderRadius: 18,
    paddingVertical: 22,
    alignItems: 'center',
  },
  amountHeroValue: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.text,
  },
  amountHeroLabel: {
    marginTop: 4,
    color: Colors.textSecondary,
    fontSize: 16,
  },
  sectionTitle: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 0.8,
  },
  recipientCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  personIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recipientName: { fontSize: 18, fontWeight: '800', color: Colors.text },
  recipientMeta: { color: Colors.textSecondary, marginTop: 2 },
  recipientCountry: { color: Colors.primaryDark, marginTop: 2, fontWeight: '600' },
  summaryBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: { color: Colors.textSecondary, fontSize: 15 },
  summaryValue: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  totalReceiveLabel: { color: Colors.text, fontSize: 18, fontWeight: '800' },
  totalReceiveValue: { color: Colors.primary, fontSize: 28, fontWeight: '800' },
  arrivalText: { color: Colors.textSecondary, fontSize: 12 },
  progressCard: {
    marginTop: 18,
    height: 86,
    borderRadius: 16,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  progressLine: {
    position: 'absolute',
    width: '70%',
    height: 2,
    backgroundColor: '#D0D5DD',
  },
  progressPlane: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  progressDotLeft: {
    position: 'absolute',
    left: 50,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  progressDotRight: {
    position: 'absolute',
    right: 50,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  primaryBtn: {
    marginTop: 20,
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancelText: {
    textAlign: 'center',
    marginTop: 14,
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});