import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ExerciseDetailsScreen = ({ route }) => {
  const { exercise } = route.params;

  const openVideo = () => {
    if (exercise.video_url) {
      Linking.openURL(exercise.video_url);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>{exercise.name}</Text>
          {exercise.muscle_group_name && (
            <Text style={styles.subtitle}>{exercise.muscle_group_name}</Text>
          )}
        </View>

        <View style={styles.content}>
          {exercise.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.sectionText}>{exercise.description}</Text>
            </View>
          )}

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

          {exercise.difficulty_level && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Difficulty Level</Text>
              <Text style={styles.sectionText}>
                {exercise.difficulty_level.charAt(0).toUpperCase() + 
                 exercise.difficulty_level.slice(1)}
              </Text>
            </View>
          )}

          {exercise.video_url && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Video Tutorial</Text>
              <TouchableOpacity style={styles.videoButton} onPress={openVideo}>
                <Text style={styles.videoButtonText}>Watch Video</Text>
              </TouchableOpacity>
            </View>
          )}
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
  sectionText: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
  videoButton: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  videoButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ExerciseDetailsScreen; 