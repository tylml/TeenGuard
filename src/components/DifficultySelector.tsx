// ============================================================
// TeenGuard - Difficulty Selector Component
// ============================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Difficulty } from '../store/types';
import { DIFFICULTY_LABELS, DIFFICULTY_DESCRIPTIONS } from '../constants/difficulty';

interface Props {
  label: string;
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const COLORS: Record<Difficulty, string> = {
  easy: '#4CAF50',
  medium: '#FF9800',
  hard: '#F44336',
};

export default function DifficultySelector({ label, value, onChange }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionsRow}>
        {DIFFICULTIES.map(d => {
          const isSelected = d === value;
          return (
            <TouchableOpacity
              key={d}
              style={[
                styles.option,
                isSelected && { backgroundColor: COLORS[d], borderColor: COLORS[d] },
              ]}
              onPress={() => onChange(d)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}>
                {DIFFICULTY_LABELS[d]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.description}>{DIFFICULTY_DESCRIPTIONS[value]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  option: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  optionTextSelected: {
    color: '#FFF',
  },
  description: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    lineHeight: 16,
  },
});
