import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import Colors from '../constants/colors';

type Props = {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
};

export default function SecondaryButton({ title, onPress, style }: Props) {
  return (
    <TouchableOpacity activeOpacity={0.9} style={[styles.button, style]} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});