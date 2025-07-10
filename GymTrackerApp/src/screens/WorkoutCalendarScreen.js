import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchUserWorkouts, fetchWorkoutPrograms } from '../services/supabase';

const WorkoutCalendarScreen = ({ navigation }) => {
  const [userWorkouts, setUserWorkouts] = useState([]);
  const [workoutPrograms, setWorkoutPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workouts, programs] = await Promise.all([
        fetchUserWorkouts(),
        fetchWorkoutPrograms(),
      ]);
      
      setUserWorkouts(workouts);
      setWorkoutPrograms(programs);
      
      // Create marked dates for calendar
      const marked = {};
      workouts.forEach(workout => {
        if (workout.workout_days) {
          workout.workout_days.forEach(date => {
            marked[date] = {
              marked: true,
              dotColor: '#ffffff',
            };
          });
        }
      });
      setMarkedDates(marked);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load workout data');
    } finally {
      setLoading(false);
    }
  };

  const onDayPress = (day) => {
    const dateString = day.dateString;
    const workoutsForDate = userWorkouts.filter(workout => 
      workout.workout_days && workout.workout_days.includes(dateString)
    );

    if (workoutsForDate.length > 0) {
      // Show existing workout
      const workout = workoutsForDate[0];
      navigation.navigate('ExerciseTracking', {
        programId: workout.program.id,
        dateString: dateString,
        programName: workout.program.name,
      });
    } else {
      // Show program selection
      showProgramSelection(dateString);
    }
  };

  const showProgramSelection = (dateString) => {
    if (workoutPrograms.length === 0) {
      Alert.alert('No Programs', 'No workout programs available. Please add programs first.');
      return;
    }

    const programOptions = workoutPrograms.map(program => ({
      text: `${program.name} (${program.difficulty_level || 'Not specified'})`,
      onPress: () => selectWorkoutProgram(program.id, dateString),
    }));

    Alert.alert(
      'Select Workout Program',
      'Choose a workout program for this date:',
      [
        ...programOptions,
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const selectWorkoutProgram = async (programId, dateString) => {
    try {
      // Add workout to calendar (you'll need to implement this)
      // await addWorkoutToCalendar(programId, dateString);
      
      // Navigate to exercise tracking
      const program = workoutPrograms.find(p => p.id === programId);
      navigation.navigate('ExerciseTracking', {
        programId: programId,
        dateString: dateString,
        programName: program.name,
      });
    } catch (error) {
      console.error('Error selecting program:', error);
      Alert.alert('Error', 'Failed to add workout to calendar');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading calendar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Workout Calendar</Text>
          <Text style={styles.subtitle}>Tap a date to start your workout</Text>
        </View>

        <Calendar
          style={styles.calendar}
          theme={{
            backgroundColor: '#0a0a0a',
            calendarBackground: '#1a1a1a',
            textSectionTitleColor: '#ffffff',
            selectedDayBackgroundColor: '#ffffff',
            selectedDayTextColor: '#000000',
            todayTextColor: '#ffffff',
            dayTextColor: '#ffffff',
            textDisabledColor: '#666666',
            dotColor: '#ffffff',
            selectedDotColor: '#000000',
            arrowColor: '#ffffff',
            monthTextColor: '#ffffff',
            indicatorColor: '#ffffff',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 13,
          }}
          markedDates={markedDates}
          onDayPress={onDayPress}
        />

        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>This Month</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {Object.keys(markedDates).length}
              </Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {workoutPrograms.length}
              </Text>
              <Text style={styles.statLabel}>Programs</Text>
            </View>
          </View>
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
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
  },
  calendar: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statsContainer: {
    padding: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 12,
    minWidth: 100,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#cccccc',
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

export default WorkoutCalendarScreen; 