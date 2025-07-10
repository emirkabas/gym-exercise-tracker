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
import { fetchProgramExercises, fetchExercises } from '../services/supabase';

const ExerciseTrackingScreen = ({ route, navigation }) => {
  const { programId, dateString, programName } = route.params;
  const [exercises, setExercises] = useState([]);
  const [trackingData, setTrackingData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const programExercises = await fetchProgramExercises(programId, dateString);
      const allExercises = await fetchExercises();
      
      // Merge exercise details
      const exercisesWithDetails = programExercises.map(programExercise => {
        const exerciseDetails = allExercises.find(e => e.id === programExercise.exercise_id);
        return {
          ...programExercise,
          ...exerciseDetails,
        };
      });
      
      setExercises(exercisesWithDetails);
      
      // Load existing tracking data
      await loadTrackingData();
    } catch (error) {
      console.error('Error loading exercises:', error);
      Alert.alert('Error', 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  const loadTrackingData = async () => {
    try {
      const key = `tracking_${programId}_${dateString}`;
      const data = await AsyncStorage.getItem(key);
      if (data) {
        setTrackingData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading tracking data:', error);
    }
  };

  const updateTrackingData = (exerciseId, setNumber, field, value) => {
    setTrackingData(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [setNumber]: {
          ...prev[exerciseId]?.[setNumber],
          [field]: value,
        },
      },
    }));
  };

  const saveProgress = async () => {
    try {
      setSaving(true);
      const key = `tracking_${programId}_${dateString}`;
      await AsyncStorage.setItem(key, JSON.stringify(trackingData));
      Alert.alert('Success', 'Progress saved successfully!');
    } catch (error) {
      console.error('Error saving progress:', error);
      Alert.alert('Error', 'Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const renderSetInputs = (exercise, sets) => {
    const exerciseData = trackingData[exercise.exercise_id] || {};
    
    return Array.from({ length: sets }, (_, index) => {
      const setNumber = index + 1;
      const setData = exerciseData[setNumber] || {};
      
      return (
        <View key={setNumber} style={styles.setContainer}>
          <Text style={styles.setTitle}>Set {setNumber}</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight</Text>
              <TextInput
                style={styles.input}
                value={setData.weight || ''}
                onChangeText={(value) => updateTrackingData(exercise.exercise_id, setNumber, 'weight', value)}
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
                onChangeText={(value) => updateTrackingData(exercise.exercise_id, setNumber, 'reps', value)}
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
              onChangeText={(value) => updateTrackingData(exercise.exercise_id, setNumber, 'notes', value)}
              placeholder="Optional notes..."
              placeholderTextColor="#666666"
              multiline
            />
          </View>
        </View>
      );
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading exercises...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>{programName}</Text>
          <Text style={styles.date}>{new Date(dateString).toLocaleDateString()}</Text>
        </View>

        {exercises.map((exercise, index) => (
          <View key={exercise.exercise_id} style={styles.exerciseContainer}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
              <Text style={styles.exerciseTarget}>
                Target: {exercise.sets} sets × {exercise.reps} reps
              </Text>
            </View>
            
            {exercise.description && (
              <Text style={styles.exerciseDescription}>{exercise.description}</Text>
            )}

            <View style={styles.setsContainer}>
              {renderSetInputs(exercise, exercise.sets)}
            </View>

            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => navigation.navigate('ExerciseDetails', { exercise })}
            >
              <Text style={styles.detailsButtonText}>View Exercise Details</Text>
            </TouchableOpacity>
          </View>
        ))}

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
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: '#cccccc',
  },
  exerciseContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  exerciseHeader: {
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  exerciseTarget: {
    fontSize: 14,
    color: '#cccccc',
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  setsContainer: {
    marginBottom: 16,
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
    minHeight: 40,
  },
  detailsButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  saveContainer: {
    padding: 20,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 16,
    fontSize: 16,
  },
});

export default ExerciseTrackingScreen; 