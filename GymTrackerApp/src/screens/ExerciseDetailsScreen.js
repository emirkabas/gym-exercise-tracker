import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ExerciseDetailsScreen = ({ route, navigation }) => {
  const { exercise, programId, dateString, programName } = route.params;
  const [trackingData, setTrackingData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTrackingData();
  }, []);

  const loadTrackingData = async () => {
    try {
      const key = `tracking_${programId}_${dateString}_${exercise.exercise_id}`;
      const data = await AsyncStorage.getItem(key);
      if (data) {
        setTrackingData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading tracking data:', error);
    }
  };

  const updateTrackingData = (setNumber, field, value) => {
    setTrackingData(prev => ({
      ...prev,
      [setNumber]: {
        ...prev[setNumber],
        [field]: value,
      },
    }));
  };

  const saveProgress = async () => {
    try {
      setSaving(true);
      const key = `tracking_${programId}_${dateString}_${exercise.exercise_id}`;
      await AsyncStorage.setItem(key, JSON.stringify(trackingData));
      Alert.alert('Success', 'Progress saved successfully!');
    } catch (error) {
      console.error('Error saving progress:', error);
      Alert.alert('Error', 'Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const renderSetInputs = (sets) => {
    return Array.from({ length: sets }, (_, index) => {
      const setNumber = index + 1;
      const setData = trackingData[setNumber] || {};
      
      return (
        <View key={setNumber} style={styles.setContainer}>
          <Text style={styles.setTitle}>Set {setNumber}</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight (lbs)</Text>
              <TextInput
                style={styles.input}
                value={setData.weight || ''}
                onChangeText={(value) => updateTrackingData(setNumber, 'weight', value)}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#666666"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reps</Text>
              <TextInput
                style={styles.input}
                value={setData.reps || ''}
                onChangeText={(value) => updateTrackingData(setNumber, 'reps', value)}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#666666"
              />
            </View>
          </View>
          <View style={styles.notesContainer}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              value={setData.notes || ''}
              onChangeText={(value) => updateTrackingData(setNumber, 'notes', value)}
              placeholder="Optional notes..."
              placeholderTextColor="#666666"
              multiline
            />
          </View>
        </View>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back to Exercises</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{exercise.exercise_name}</Text>
          <Text style={styles.subtitle}>{programName} • {new Date(dateString).toLocaleDateString()}</Text>
        </View>

        <View style={styles.content}>
          {exercise.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.sectionText}>{exercise.description}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Track Your Sets</Text>
            <Text style={styles.sectionSubtitle}>
              Target: {exercise.sets} sets × {exercise.reps} reps
            </Text>
            <View style={styles.setsContainer}>
              {renderSetInputs(exercise.sets)}
            </View>
          </View>

          {exercise.instructions && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instructions</Text>
              <Text style={styles.sectionText}>{exercise.instructions}</Text>
            </View>
          )}

          {exercise.equipment && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Equipment</Text>
              <Text style={styles.sectionText}>{exercise.equipment}</Text>
            </View>
          )}
        </View>

        <View style={styles.saveContainer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={saveProgress}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Progress</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
  setsContainer: {
    marginTop: 12,
  },
  setContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
  },
  setTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputGroup: {
    flex: 1,
    marginRight: 8,
  },
  inputLabel: {
    fontSize: 12,
    color: '#cccccc',
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    padding: 8,
    color: '#ffffff',
    fontSize: 16,
  },
  notesContainer: {
    marginTop: 8,
  },
  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    padding: 8,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  saveContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  saveButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExerciseDetailsScreen; 