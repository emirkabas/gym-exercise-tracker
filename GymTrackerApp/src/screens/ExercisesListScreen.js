import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchProgramExercises } from '../services/supabase';

const ExercisesListScreen = ({ route, navigation }) => {
  const { programId, dateString, programName } = route.params;
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      setLoading(true);
      console.log('Loading exercises for program:', programId);
      
      const programExercises = await fetchProgramExercises(programId, dateString);
      console.log('Program exercises loaded:', programExercises.length);
      
      if (programExercises.length === 0) {
        Alert.alert(
          'No Exercises Found', 
          'This workout program doesn\'t have any exercises assigned yet.',
          [
            { text: 'Go Back', onPress: () => navigation.goBack() }
          ]
        );
        return;
      }
      
      setExercises(programExercises);
    } catch (error) {
      console.error('Error loading exercises:', error);
      Alert.alert('Error', 'Failed to load exercises. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExercisePress = (exercise) => {
    navigation.navigate('ExerciseDetails', {
      exercise,
      programId,
      dateString,
      programName
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back to Programs</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Exercises</Text>
          <Text style={styles.subtitle}>{programName}</Text>
          <Text style={styles.date}>{new Date(dateString).toLocaleDateString()}</Text>
        </View>

        {exercises.length === 0 ? (
          <View style={styles.noExercisesContainer}>
            <Text style={styles.noExercisesText}>No exercises found for this program.</Text>
            <Text style={styles.noExercisesSubtext}>Please add exercises to this workout program.</Text>
          </View>
        ) : (
          <View style={styles.exercisesContainer}>
            {exercises.map((exercise, index) => (
              <TouchableOpacity
                key={exercise.exercise_id}
                style={styles.exerciseCard}
                onPress={() => handleExercisePress(exercise)}
              >
                <View style={styles.exerciseCardContent}>
                  <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
                  <Text style={styles.exerciseTarget}>
                    {exercise.sets} sets × {exercise.reps} reps
                  </Text>
                  {exercise.description && (
                    <Text style={styles.exerciseDescription} numberOfLines={2}>
                      {exercise.description}
                    </Text>
                  )}
                </View>
                <Text style={styles.exerciseArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#cccccc',
  },
  exercisesContainer: {
    padding: 20,
  },
  exerciseCard: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseCardContent: {
    flex: 1,
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
    marginBottom: 4,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#cccccc',
    fontStyle: 'italic',
  },
  exerciseArrow: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  noExercisesContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noExercisesText: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  noExercisesSubtext: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
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

export default ExercisesListScreen; 