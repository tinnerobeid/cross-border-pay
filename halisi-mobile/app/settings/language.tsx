import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../constants/colors';

const LANG_KEY = 'halisi_language';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  available: boolean;
}

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', available: true },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇹🇿', available: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', available: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', available: false },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Kinyarwanda', flag: '🇷🇼', available: false },
  { code: 'lg', name: 'Luganda', nativeName: 'Luganda', flag: '🇺🇬', available: false },
];

export default function LanguageScreen() {
  const [selected, setSelected] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then(val => {
      if (val) setSelected(val);
    });
  }, []);

  const handleSelect = async (lang: Language) => {
    if (!lang.available) return;
    setSelected(lang.code);
    await AsyncStorage.setItem(LANG_KEY, lang.code);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Language</Text>
          <View style={{ width: 22 }} />
        </View>

        <Text style={styles.heading}>App Language</Text>
        <Text style={styles.subheading}>
          Choose your preferred language. More languages are coming soon.
        </Text>

        {LANGUAGES.map(lang => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.row,
              selected === lang.code && styles.rowActive,
              !lang.available && styles.rowDisabled,
            ]}
            onPress={() => handleSelect(lang)}
            activeOpacity={lang.available ? 0.7 : 1}
          >
            <Text style={styles.flag}>{lang.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.langName, !lang.available && styles.langNameDisabled]}>
                {lang.name}
              </Text>
              <Text style={styles.nativeName}>{lang.nativeName}</Text>
            </View>
            {!lang.available && (
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Soon</Text>
              </View>
            )}
            {lang.available && selected === lang.code && (
              <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
            )}
            {lang.available && selected !== lang.code && (
              <View style={styles.radioEmpty} />
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.infoText}>
            The app is currently available in English only. We are actively working on adding Swahili, Korean, and more languages. Thank you for your patience.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 60 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  heading: { marginTop: 22, fontSize: 26, fontWeight: '800', color: Colors.text },
  subheading: { marginTop: 8, color: Colors.textSecondary, lineHeight: 21, marginBottom: 20, fontSize: 14 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: '#EEF2F6', marginBottom: 10,
  },
  rowActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  rowDisabled: { opacity: 0.6 },
  flag: { fontSize: 28 },
  langName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  langNameDisabled: { color: Colors.textSecondary },
  nativeName: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  comingSoonBadge: {
    backgroundColor: '#F1F5F9', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  comingSoonText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  radioEmpty: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#D0D5DD',
  },
  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: Colors.primarySoft, borderRadius: 14,
    padding: 14, marginTop: 8,
  },
  infoText: { flex: 1, color: Colors.primaryDark, fontSize: 13, lineHeight: 19 },
});
