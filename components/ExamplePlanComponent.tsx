import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import { usePlans } from '@/hooks/usePlans';
import { saveOutfitPlan } from '@/services/planService';

interface ExamplePlanComponentProps {
  selectedDate: Date;
  outfitId: string;
  onPlanSaved?: () => void;
}

/**
 * Example component demonstrating the implemented JS script
 * This shows how to use the exact script pattern you requested
 */
export const ExamplePlanComponent: React.FC<ExamplePlanComponentProps> = ({
  selectedDate,
  outfitId,
  onPlanSaved,
}) => {
  const [notes, setNotes] = useState<string>('');
  const [name, setName] = useState<string>('My Outfit');
  const [category, setCategory] = useState<'casual' | 'formal' | 'work' | 'athletic' | 'evening' | 'special'>('casual');
  const [items] = useState<string[]>(['item1', 'item2', 'item3']); // Mock items
  const [isLoading, setIsLoading] = useState(false);
  
  const { savePlan } = usePlans();
  
  // Mock user object
  const user = { id: 'mock_user_id' };
  
  /**
   * This function implements the exact JS script you requested:
   * 
   * // selected is a JS Date for the day the user tapped
   * const ymd = selected.toLocaleDateString('en-CA'); // "2025-08-31" (safe ISO-like)
   * await supabase.from('plans').insert({
   *   user_id: user.id,
   *   date_ymd: ymd,
   *   outfit_id: outfitId,
   *   notes
   * });
   */
  const handleSavePlan = async () => {
    try {
      setIsLoading(true);
      
      // Method 1: Using the service function (implements exact script)
      await saveOutfitPlan(
        selectedDate, // selected is a JS Date for the day the user tapped
        outfitId,
        notes,
        user,
        {
          name,
          category,
          items,
          reminderEnabled: false,
        }
      );
      
      Alert.alert('Success', 'Outfit plan saved successfully!');
      onPlanSaved?.();
      
    } catch (error) {
      console.error('Failed to save plan:', error);
      Alert.alert('Error', 'Failed to save outfit plan');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Alternative method using the hook directly
   */
  const handleSavePlanWithHook = async () => {
    try {
      setIsLoading(true);
      
      // Method 2: Using the hook (also implements exact script internally)
      await savePlan(
        selectedDate, // selected is a JS Date for the day the user tapped
        outfitId,
        notes,
        user,
        {
          name,
          category,
          items,
          reminderEnabled: false,
        }
      );
      
      Alert.alert('Success', 'Outfit plan saved successfully!');
      onPlanSaved?.();
      
    } catch (error) {
      console.error('Failed to save plan:', error);
      Alert.alert('Error', 'Failed to save outfit plan');
    } finally {
      setIsLoading(false);
    }
  };
  
  const ymd = selectedDate.toLocaleDateString('en-CA');
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schedule Outfit for {ymd}</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Outfit Name:</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter outfit name"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Notes:</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add notes (optional)"
          multiline
          numberOfLines={3}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSavePlan}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Saving...' : 'Save Plan (Service)'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, isLoading && styles.buttonDisabled]}
          onPress={handleSavePlanWithHook}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
            {isLoading ? 'Saving...' : 'Save Plan (Hook)'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Selected Date: {ymd}</Text>
        <Text style={styles.infoText}>Outfit ID: {outfitId}</Text>
        <Text style={styles.infoText}>User ID: {user.id}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  },
  button: {
    backgroundColor: '#C8A45D',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#C8A45D',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#C8A45D',
  },
  infoContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});