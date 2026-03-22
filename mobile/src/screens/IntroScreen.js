import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';

const cards = [
  {
    title: 'Real-time Alerts',
    body: 'View incident alerts with severity and location guidance.',
  },
  {
    title: 'Community Reporting',
    body: 'Submit field reports from citizens and volunteers in seconds.',
  },
  {
    title: 'Resource Coordination',
    body: 'See hospitals, shelters, and rescue units near affected zones.',
  },
];

export function IntroScreen({ onNext }) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.title}>ResQNet Disaster Response Platform</Text>
      <Text style={styles.subtitle}>Stage 2 of 3: Overview</Text>

      {cards.map((card) => (
        <View key={card.title} style={styles.card}>
          <Text style={styles.cardTitle}>{card.title}</Text>
          <Text style={styles.cardBody}>{card.body}</Text>
        </View>
      ))}

      <Text style={styles.stack}>
        Built with Flask API, Docker, Kubernetes, Terraform, and CI/CD pipeline.
      </Text>

      <Pressable style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>Next: Open Main Dashboard</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fef3c7' },
  container: { padding: 20, paddingBottom: 30 },
  title: { fontSize: 28, fontWeight: '800', color: '#7f1d1d' },
  subtitle: { marginTop: 6, marginBottom: 14, color: '#6b7280' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: { fontWeight: '700', color: '#9a3412', marginBottom: 4 },
  cardBody: { color: '#5b3710', lineHeight: 19 },
  stack: {
    marginTop: 6,
    color: '#0c4a6e',
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 10,
    padding: 10,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#b91c1c',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
});
