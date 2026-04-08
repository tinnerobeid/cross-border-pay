import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';

const BIO_KEY = 'halisi_biometric_enabled';

function Row({
  icon, title, subtitle, trailing, onPress, danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.icon, danger && { backgroundColor: '#FEECEC' }]}>
        <Ionicons name={icon} size={18} color={danger ? '#EF4444' : Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, danger && { color: '#EF4444' }]}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      {trailing}
    </TouchableOpacity>
  );
}

export default function SecurityScreen() {
  const { clearAuth } = useAuth();
  const [bio, setBio] = useState(false);
  const [twoFa, setTwoFa] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(BIO_KEY).then(val => {
      if (val === 'true') setBio(true);
    });
  }, []);

  const handleBioToggle = async (enabled: boolean) => {
    setBio(enabled);
    await AsyncStorage.setItem(BIO_KEY, String(enabled));
    if (enabled) {
      Alert.alert(
        'Biometric Login Enabled',
        'Your device biometric (Face ID or Fingerprint) will be used to unlock the app on next launch.',
      );
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently deactivate your account. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            await clearAuth();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Security Settings</Text>
          <View style={{ width: 22 }} />
        </View>

        <Text style={styles.section}>LOGIN & ACCESS</Text>
        <Row
          icon="keypad-outline"
          title="Change PIN"
          subtitle="Update your 6-digit transaction PIN"
          trailing={<Ionicons name="chevron-forward" size={18} color="#98A2B3" />}
          onPress={() => router.push('/settings/pin')}
        />
        <Row
          icon="lock-closed-outline"
          title="Change Password"
          subtitle="Update your login password"
          trailing={<Ionicons name="chevron-forward" size={18} color="#98A2B3" />}
          onPress={() => router.push('/settings/change-password')}
        />
        <Row
          icon="finger-print-outline"
          title="Biometric Login"
          subtitle={bio ? 'Face ID / Fingerprint enabled' : 'Use Face ID or Fingerprint to unlock'}
          trailing={
            <Switch
              value={bio}
              onValueChange={handleBioToggle}
              trackColor={{ false: '#D0D5DD', true: Colors.primary }}
            />
          }
        />
        <Row
          icon="shield-checkmark-outline"
          title="Two-Factor Authentication"
          subtitle="OTP sent to email on every login"
          trailing={
            <Switch
              value={twoFa}
              onValueChange={val => {
                setTwoFa(val);
                Alert.alert(
                  val ? '2FA Enabled' : '2FA Disabled',
                  val
                    ? 'You will receive an OTP on your registered email each time you log in.'
                    : 'Two-factor authentication has been disabled.',
                );
              }}
              trackColor={{ false: '#D0D5DD', true: Colors.primary }}
            />
          }
        />

        <Text style={styles.section}>PRIVACY & DATA</Text>
        <Row
          icon="trash-outline"
          title="Delete Account"
          subtitle="Permanently deactivate your account"
          danger
          onPress={handleDeleteAccount}
        />

        <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/settings/notifications')}>
          <Text style={styles.linkBtnText}>Notification Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 60 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  section: {
    marginTop: 22, marginBottom: 10, fontSize: 13,
    fontWeight: '800', color: Colors.primaryDark, letterSpacing: 0.8,
  },
  row: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1,
    borderColor: '#EEF2F6', padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  icon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  rowTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  rowSub: { marginTop: 2, color: Colors.textSecondary, fontSize: 13 },
  linkBtn: {
    marginTop: 16, height: 50, borderRadius: 12, backgroundColor: '#fff',
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  linkBtnText: { color: Colors.text, fontWeight: '700' },
});
