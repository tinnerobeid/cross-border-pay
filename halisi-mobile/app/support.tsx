import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../constants/colors';

const FAQS = [
  {
    q: 'How do I send money?',
    a: 'Tap "Send" on the home screen, choose the currency, enter an amount, review the quote, then fill in recipient details and confirm.',
  },
  {
    q: 'What currencies are supported?',
    a: 'Halisi currently supports TZS, KRW, KES, RWF, BIF, UGX, and USD. More corridors are being added regularly.',
  },
  {
    q: 'How long does a transfer take?',
    a: 'Most transfers arrive within minutes. In some cases it can take up to 24 hours depending on the receiving bank.',
  },
  {
    q: 'What are the transfer fees?',
    a: 'Fees are 1.8% of the send amount plus a flat fee of TZS 1,500. You will always see the full breakdown before confirming.',
  },
  {
    q: 'How do I verify my identity (KYC)?',
    a: 'Go to Account → KYC Verification. You will need a valid national ID or passport and a selfie. Approval usually takes under 24 hours.',
  },
  {
    q: 'Why was my transfer failed or declined?',
    a: 'Transfers can fail due to incomplete KYC, invalid recipient details, or a temporary network issue. Check the transfer status in History for details.',
  },
  {
    q: 'How do I reset my PIN?',
    a: 'Go to Account → Change PIN. You will need to enter your current PIN then set a new one.',
  },
  {
    q: 'Is my money safe?',
    a: 'Yes. Halisi uses bank-grade encryption for all transactions. Your funds are held in a regulated account.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity style={styles.faqItem} onPress={() => setOpen(!open)} activeOpacity={0.7}>
      <View style={styles.faqRow}>
        <Text style={styles.faqQuestion}>{q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
      </View>
      {open && <Text style={styles.faqAnswer}>{a}</Text>}
    </TouchableOpacity>
  );
}

export default function SupportScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.primaryDark} />
          </TouchableOpacity>
          <Text style={styles.title}>Help & Support</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Contact cards */}
        <View style={styles.contactRow}>
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => Linking.openURL('mailto:support@halisi.com')}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#EAF4FF' }]}>
              <Ionicons name="mail-outline" size={22} color="#1D6FAC" />
            </View>
            <Text style={styles.contactLabel}>Email Us</Text>
            <Text style={styles.contactSub}>support@halisi.com</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard}>
            <View style={[styles.contactIcon, { backgroundColor: Colors.primarySoft }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.contactLabel}>Live Chat</Text>
            <Text style={styles.contactSub}>Coming soon</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => Linking.openURL('tel:+255800000000')}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#FFF4E5' }]}>
              <Ionicons name="call-outline" size={22} color="#E07B00" />
            </View>
            <Text style={styles.contactLabel}>Call Us</Text>
            <Text style={styles.contactSub}>+255 800 000 000</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {FAQS.map((faq, i) => (
          <FAQItem key={i} q={faq.q} a={faq.a} />
        ))}

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.footerText}>Your data is protected by Halisi's privacy policy</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 60 },
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24,
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  contactRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  contactCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#EEF2F6',
  },
  contactIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  contactLabel: { fontSize: 13, fontWeight: '700', color: Colors.text },
  contactSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 3, textAlign: 'center' },
  sectionTitle: {
    fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 14,
  },
  faqItem: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: '#EEF2F6',
  },
  faqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1, marginRight: 8 },
  faqAnswer: { fontSize: 14, color: Colors.textSecondary, marginTop: 12, lineHeight: 22 },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    justifyContent: 'center', marginTop: 24,
  },
  footerText: { fontSize: 12, color: Colors.textSecondary },
});
