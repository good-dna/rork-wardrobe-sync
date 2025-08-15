import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { colors, tokens } from '@/constants/colors';

interface DropdownOption {
  label: string;
  value: string;
  color?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export default function Dropdown({
  options,
  value,
  onSelect,
  placeholder = 'Select an option',
  label,
  disabled = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const selectedOption = options.find(option => option.value === value);

  const openDropdown = () => {
    if (disabled) return;
    setIsOpen(true);
    Animated.timing(animation, {
      toValue: 1,
      duration: tokens.animation.fast,
      useNativeDriver: true,
    }).start();
  };

  const closeDropdown = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: tokens.animation.fast,
      useNativeDriver: true,
    }).start(() => {
      setIsOpen(false);
    });
  };

  const handleSelect = (optionValue: string) => {
    onSelect(optionValue);
    closeDropdown();
  };

  const modalScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const modalOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <Pressable
        style={[
          styles.trigger,
          disabled && styles.triggerDisabled,
          selectedOption?.color && { borderLeftColor: selectedOption.color, borderLeftWidth: 4 }
        ]}
        onPress={openDropdown}
        disabled={disabled}
      >
        <Text style={[
          styles.triggerText,
          !selectedOption && styles.placeholderText,
          disabled && styles.disabledText
        ]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        
        <Animated.View
          style={[
            styles.chevron,
            {
              transform: [{
                rotate: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '180deg'],
                })
              }]
            }
          ]}
        >
          <ChevronDown size={20} color={disabled ? colors.textTertiary : colors.textSecondary} />
        </Animated.View>
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={closeDropdown}
      >
        <Pressable style={styles.overlay} onPress={closeDropdown}>
          <Animated.View
            style={[
              styles.dropdown,
              {
                transform: [{ scale: modalScale }],
                opacity: modalOpacity,
              }
            ]}
          >
            <ScrollView
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.option,
                    value === option.value && styles.selectedOption,
                    option.color && { borderLeftColor: option.color, borderLeftWidth: 4 }
                  ]}
                  onPress={() => handleSelect(option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    value === option.value && styles.selectedOptionText
                  ]}>
                    {option.label}
                  </Text>
                  
                  {value === option.value && (
                    <Check size={16} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: tokens.spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
  },
  triggerDisabled: {
    opacity: 0.5,
    backgroundColor: colors.cardPressed,
  },
  triggerText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  disabledText: {
    color: colors.textTertiary,
  },
  chevron: {
    marginLeft: tokens.spacing.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.lg,
  },
  dropdown: {
    backgroundColor: colors.card,
    borderRadius: tokens.radius.lg,
    maxHeight: 300,
    width: '100%',
    maxWidth: 320,
    ...tokens.shadow.lg,
  },
  optionsList: {
    maxHeight: 280,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedOption: {
    backgroundColor: colors.cardPressed,
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  selectedOptionText: {
    color: colors.primary,
    fontWeight: '600',
  },
});