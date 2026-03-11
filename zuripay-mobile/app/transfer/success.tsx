import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

export default function SuccessScreen() {
  const params = useLocalSearchParams<{
    amount?: string;
    gets?: string;
  }>();

  const amount = params.amount ?? '0.00';
  const gets = params.gets ?? '0.00';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Receipt</Text>
          <TouchableOpacity>
            <Ionicons name="share-social-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.successIconWrap}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={28} color="#fff" />
          </View>
        </View>

        <Text style={styles.successTitle}>Success</Text>
        <Text style={styles.successSubtitle}>Transaction completed successfully</Text>

        <View style={styles.amountCard}>
          <Text style={styles.amountCardLabel}>TOTAL AMOUNT SENT</Text>
          <Text style={styles.amountCardValue}>{amount} TZS</Text>
          <View style={styles.instantBadge}>
            <Text style={styles.instantBadgeText}>ZuriPay Instant</Text>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>#ZP-8829104</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>Oct 24, 2023, 14:30</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[styles.detailValue, { color: Colors.success }]}>● Success</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sender</Text>
            <Text style={styles.detailValue}>John Doe</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recipient</Text>
            <Text style={styles.detailValue}>Kim Soo-min</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Exchange Rate</Text>
            <Text style={styles.detailValue}>1 TZS = 0.51 KRW</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recipient Receives</Text>
            <Text style={styles.detailValue}>{gets} KRW</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryBtn}>
          <Ionicons name="download-outline" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Download PDF Receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/(tabs)/home')}>
          <Text style={styles.secondaryBtnText}>Done</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>Secured by Zuri Pay</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 80 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  successIconWrap: {
    alignItems: 'center',
    marginTop: 22,
  },
  successIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  successTitle: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text,
  },
  successSubtitle: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  amountCard: {
    backgroundColor: '#F1FAF1',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  amountCardLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.6,
  },
  amountCardValue: {
    marginTop: 6,
    fontSize: 34,
    fontWeight: '800',
    color: Colors.primary,
  },
  instantBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#DFF4E0',
  },
  instantBadgeText: {
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  detailsSection: {
    marginTop: 18,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 16,
  },
  detailLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  detailValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  footerText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#98A2B3',
    fontSize: 12,
  },
});