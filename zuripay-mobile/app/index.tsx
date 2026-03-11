import React from 'react';
import { router } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View, Image } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import Colors from '../constants/colors';

export default function OnboardingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.brand}>Zuri Pay</Text>

        <View style={styles.heroCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop' }}
            style={styles.heroImage}
          />
        </View>

        <Text style={styles.title}>Global money transfers made simple</Text>
        <Text style={styles.subtitle}>
          Send and receive money across borders instantly with ZuriPay’s secure and lightning-fast platform.
        </Text>

        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <PrimaryButton title="Create Account" onPress={() => router.push('/(auth)/register')} />
        <SecondaryButton
          title="Log In"
          style={{ marginTop: 12 }}
          onPress={() => router.push('/(auth)/login')}
        />

        <Text style={styles.footer}>Trusted by 2M+ users worldwide</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 24 },
  brand: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 14,
  },
  heroCard: {
    backgroundColor: '#EEF8EF',
    borderRadius: 22,
    padding: 10,
    marginTop: 8,
  },
  heroImage: {
    width: '100%',
    height: 240,
    borderRadius: 18,
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginTop: 28,
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 22,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#D0D5DD',
  },
  dotActive: {
    width: 22,
    backgroundColor: Colors.primary,
  },
  footer: {
    textAlign: 'center',
    color: '#98A2B3',
    fontSize: 12,
    marginTop: 18,
  },
});