import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { createReport, getAlerts, getReports, getResources } from '../api';

export function DashboardScreen({ userName }) {
  const [alerts, setAlerts] = useState([]);
  const [resources, setResources] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const loadData = async () => {
    try {
      setError('');
      const [a, r, rp] = await Promise.all([getAlerts(), getResources(), getReports()]);
      setAlerts(a);
      setResources(r);
      setReports(rp);
    } catch (e) {
      setError('Unable to connect to backend API. Check EXPO_PUBLIC_API_BASE_URL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const submitReport = async () => {
    if (!location.trim() || !description.trim()) return;
    await createReport({
      type: 'Mobile Report',
      location,
      description,
      severity: 'Medium',
    });
    setLocation('');
    setDescription('');
    await loadData();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#b91c1c" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Main Dashboard</Text>
      <Text style={styles.subtitle}>Stage 3 of 3 • Welcome, {userName || 'Responder'}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.section}>Active Alerts</Text>
      {alerts.map((a) => (
        <View key={a.id} style={styles.cardWarn}>
          <Text style={styles.cardTitle}>{a.type} - {a.location}</Text>
          <Text style={styles.cardBody}>{a.message}</Text>
        </View>
      ))}

      <Text style={styles.section}>Nearby Resources</Text>
      {resources.map((r) => (
        <View key={r.id} style={styles.card}>
          <Text style={styles.cardTitle}>{r.name}</Text>
          <Text style={styles.cardBody}>{r.location}</Text>
        </View>
      ))}

      <Text style={styles.section}>Submit Report</Text>
      <TextInput
        style={styles.input}
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe the situation"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Pressable style={styles.button} onPress={submitReport}>
        <Text style={styles.buttonText}>Submit</Text>
      </Pressable>

      <Text style={styles.section}>Community Reports</Text>
      {reports.length === 0 ? (
        <Text style={styles.empty}>No reports yet.</Text>
      ) : (
        reports.map((r) => (
          <View key={r.id} style={styles.card}>
            <Text style={styles.cardTitle}>{r.type} - {r.location}</Text>
            <Text style={styles.cardBody}>{r.description}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f3f4f6' },
  container: { padding: 16, paddingBottom: 28 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, color: '#6b7280' },
  title: { fontSize: 26, fontWeight: '800', color: '#111827' },
  subtitle: { marginTop: 6, marginBottom: 12, color: '#6b7280' },
  section: { marginTop: 14, marginBottom: 8, fontWeight: '700', color: '#374151' },
  cardWarn: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  cardTitle: { fontWeight: '700', color: '#1f2937' },
  cardBody: { marginTop: 4, color: '#4b5563' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#b91c1c',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  empty: { color: '#6b7280' },
  error: {
    marginBottom: 8,
    color: '#b91c1c',
    fontSize: 13,
  },
});
