const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000';

export async function getAlerts() {
  const response = await fetch(`${API_BASE_URL}/api/alerts`);
  if (!response.ok) throw new Error('Failed to fetch alerts');
  return response.json();
}

export async function getResources() {
  const response = await fetch(`${API_BASE_URL}/api/resources`);
  if (!response.ok) throw new Error('Failed to fetch resources');
  return response.json();
}

export async function getReports() {
  const response = await fetch(`${API_BASE_URL}/api/reports`);
  if (!response.ok) throw new Error('Failed to fetch reports');
  return response.json();
}

export async function createReport(payload) {
  const response = await fetch(`${API_BASE_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to submit report');
  return response.json();
}
