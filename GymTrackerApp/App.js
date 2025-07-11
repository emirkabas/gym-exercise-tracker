import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import WorkoutCalendarScreen from './src/screens/WorkoutCalendarScreen';
import ExercisesScreen from './src/screens/ExercisesScreen';
import MuscleGroupsScreen from './src/screens/MuscleGroupsScreen';
import WorkoutProgramsScreen from './src/screens/WorkoutProgramsScreen';
import ExerciseTrackingScreen from './src/screens/ExerciseTrackingScreen';
import ExerciseDetailsScreen from './src/screens/ExerciseDetailsScreen';
import ExercisesListScreen from './src/screens/ExercisesListScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="WorkoutCalendar"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1a1a1a',
            },
            headerTintColor: '#ffffff',
            headerTitleStyle: {
              fontWeight: '600',
            },
            cardStyle: { backgroundColor: '#0a0a0a' }
          }}
        >
          <Stack.Screen 
            name="WorkoutCalendar" 
            component={WorkoutCalendarScreen}
            options={{ title: 'Workout Calendar' }}
          />
          <Stack.Screen 
            name="Exercises" 
            component={ExercisesScreen}
            options={{ title: 'Exercises' }}
          />
          <Stack.Screen 
            name="MuscleGroups" 
            component={MuscleGroupsScreen}
            options={{ title: 'Muscle Groups' }}
          />
          <Stack.Screen 
            name="WorkoutPrograms" 
            component={WorkoutProgramsScreen}
            options={{ title: 'Workout Programs' }}
          />
          <Stack.Screen 
            name="ExercisesList" 
            component={ExercisesListScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="ExerciseTracking" 
            component={ExerciseTrackingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="ExerciseDetails" 
            component={ExerciseDetailsScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
} 