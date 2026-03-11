import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import Colors from '../constants/colors';

type Props = {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  style?: ViewStyle;
};

export default function PrimaryButton({ title, onPress, loading, style }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.button, style]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});