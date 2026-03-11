import React from 'react';
import { router } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

export default function KycLivenessScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Liveness Check</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.cameraBox}>
          <Text style={styles.heading}>Liveness Check</Text>
          <Text style={styles.subheading}>Position your face within the frame and follow the on-screen instructions.</Text>

          <View style={styles.faceCircle}>
            <View style={styles.innerCircle} />
          </View>

          <View style={styles.instructionChip}>
            <Ionicons name="eye-outline" size={14} color={Colors.primaryDark} />
            <Text style={styles.instructionText}>LOOK STRAIGHT AND BLINK</Text>
          </View>
        </View>

        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.smallBtn}>
            <Ionicons name="images-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.smallBtnText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureBtn}>
            <Ionicons name="camera" size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.smallBtn}>
            <Ionicons name="refresh-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.smallBtnText}>Flip</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/kyc/address')}>
          <Text style={styles.primaryBtnText}>Take Photo</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>END-TO-END ENCRYPTED VERIFICATION</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  cameraBox: {
    marginTop: 18,
    backgroundColor: '#F5F7F5',
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
  },
  heading: { fontSize: 28, fontWeight: '800', color: Colors.text },
  subheading: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  faceCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: Colors.primary,
    marginTop: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 196,
    height: 196,
    borderRadius: 98,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#B7E3BE',
  },
  instructionChip: {
    marginTop: 16,
    backgroundColor: '#ECF8ED',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  instructionText: { color: Colors.primaryDark, fontWeight: '800', fontSize: 12 },
  cameraControls: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  smallBtn: {
    alignItems: 'center',
    width: 80,
  },
  smallBtnText: { marginTop: 6, color: Colors.textSecondary, fontSize: 12 },
  captureBtn: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#DFF4E2',
  },
  primaryBtn: {
    marginTop: 22,
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  footerText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#98A2B3',
    fontSize: 12,
    fontWeight: '700',
  },
});