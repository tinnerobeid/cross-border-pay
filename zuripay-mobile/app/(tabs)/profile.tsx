import React from 'react';
import { router } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

function Row({
  icon,
  title,
  subtitle,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={[styles.rowIcon, danger && { backgroundColor: '#FEECEC' }]}>
        <Ionicons name={icon} size={18} color={danger ? '#EF4444' : Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, danger && { color: '#EF4444' }]}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      {!danger && <Ionicons name="chevron-forward" size={18} color="#98A2B3" />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Account</Text>

        <View style={styles.avatarWrap}>
          <View style={styles.avatar} />
          <TouchableOpacity style={styles.editBadge}>
            <Ionicons name="create-outline" size={14} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>Alex Johnson</Text>
        <Text style={styles.email}>alex.johnson@zuripay.com</Text>

        <Text style={styles.section}>ACCOUNT SETTINGS</Text>
        <Row icon="person-outline" title="Personal Information" subtitle="Name, Email, Phone number" />
        <Row icon="shield-checkmark-outline" title="Security" subtitle="Password, Biometrics, 2FA" onPress={() => router.push('/settings/security')} />
        <Row icon="business-outline" title="Linked Bank Accounts" subtitle="Manage your funding sources" onPress={() => router.push('/(tabs)/recipients')} />
        <Row icon="checkmark-done-circle-outline" title="KYC Verification" subtitle="Verify your identity" onPress={() => router.push('/kyc/id')} />

        <Text style={styles.section}>SUPPORT</Text>
        <Row icon="help-circle-outline" title="Help & Support" subtitle="FAQs, Live chat, Contact us" />
        <Row icon="log-out-outline" title="Logout" subtitle="Sign out of your account" danger />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 90 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  avatarWrap: {
    marginTop: 24,
    alignSelf: 'center',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#DDE8DC',
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text,
  },
  email: {
    textAlign: 'center',
    marginTop: 4,
    color: Colors.primaryDark,
    fontSize: 15,
  },
  section: {
    marginTop: 26,
    marginBottom: 10,
    color: '#98A2B3',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  row: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 10,
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
    fontSize: 13,
    color: Colors.textSecondary,
  },
});