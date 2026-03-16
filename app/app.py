from flask import Flask, jsonify, request, render_template_string
from datetime import datetime

app = Flask(__name__)

# In-memory data store (replace with PostgreSQL in production)
alerts = [
    {"id": 1, "type": "Flood", "location": "Agra South Zone", "message": "Move to higher ground. Avoid Yamuna riverbanks.", "severity": "High", "timestamp": "2024-01-15T10:00:00"},
    {"id": 2, "type": "Fire",  "location": "Sikandra Industrial Area", "message": "Evacuate 1.5 km radius immediately.", "severity": "Medium", "timestamp": "2024-01-15T11:30:00"},
]
reports = []
resources = [
    {"id": 1, "name": "District Hospital", "type": "Hospital", "location": "MG Road, Agra", "distance_km": 1.2},
    {"id": 2, "name": "Civil Lines Shelter", "type": "Shelter", "location": "Civil Lines, Agra", "capacity": 340, "distance_km": 2.1},
    {"id": 3, "name": "NDRF Rescue Team", "type": "Rescue", "location": "Active Deployment", "distance_km": 3.4},
]

HTML = """
<!DOCTYPE html>
<html>
<head>
  <title>ResQNet - Disaster Response Platform</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
    body { background: #f5f5f5; color: #222; }
    header { background: #E24B4A; color: white; padding: 16px 24px; }
    header h1 { font-size: 22px; } header p { font-size: 13px; opacity: 0.85; }
    .container { max-width: 900px; margin: 24px auto; padding: 0 16px; }
    .alert-box { background: #FCEBEB; border: 1px solid #F09595; border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; }
    .alert-box h3 { color: #791F1F; font-size: 15px; } .alert-box p { color: #A32D2D; font-size: 13px; margin-top: 4px; }
    .badge { display:inline-block; font-size:11px; padding:2px 10px; border-radius:20px; margin-top:6px; background:#FCEBEB; color:#791F1F; border:1px solid #F09595; }
    .card { background: white; border-radius: 10px; border: 1px solid #ddd; padding: 14px 16px; margin-bottom: 12px; display:flex; align-items:center; gap:12px; }
    .section-title { font-size: 12px; font-weight: bold; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin: 20px 0 8px; }
    .icon { width:38px; height:38px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:18px; }
    .green { background:#EAF3DE; } .blue { background:#E6F1FB; } .red { background:#FCEBEB; }
    input, textarea, select { width:100%; padding:8px 10px; border:1px solid #ccc; border-radius:6px; font-size:13px; margin-bottom:10px; }
    button { padding:10px 20px; background:#E24B4A; color:white; border:none; border-radius:6px; font-size:14px; cursor:pointer; }
    button:hover { opacity:0.9; }
    .status { padding: 12px 16px; background:#EAF3DE; border:1px solid #97C459; border-radius:8px; color:#27500A; font-size:13px; margin-top:10px; display:none; }
    footer { text-align:center; padding:24px; color:#888; font-size:12px; }
  </style>
</head>
<body>
<header>
  <h1>ResQNet - Disaster Response Platform</h1>
  <p>Real-time alerts, community reporting, and resource coordination</p>
</header>
<div class="container">
  <div class="section-title">Active Alerts</div>
  <div id="alerts-container"></div>

  <div class="section-title">Nearby Resources</div>
  <div id="resources-container"></div>

  <div class="section-title">Submit a Situation Report</div>
  <div style="background:white;border-radius:10px;border:1px solid #ddd;padding:16px;">
    <select id="dtype"><option>Flood / Waterlogging</option><option>Fire</option><option>Building Damage</option><option>Road Blockage</option><option>Medical Emergency</option></select>
    <input type="text" id="loc" placeholder="Location / Landmark (e.g. Near Taj Mahal gate)">
    <textarea id="desc" rows="3" placeholder="Describe what you see..."></textarea>
    <select id="sev"><option>Low</option><option>Medium</option><option selected>High</option><option>Critical</option></select>
    <button onclick="submitReport()">Submit Report</button>
    <div class="status" id="status-msg">Report submitted successfully! Authorities have been notified.</div>
  </div>

  <div class="section-title">Community Reports</div>
  <div id="reports-container"></div>
</div>
<footer>ResQNet v1.0 | DevOps Project | Running in Docker + Kubernetes</footer>

<script>
async function loadAlerts() {
  const res = await fetch('/api/alerts');
  const data = await res.json();
  document.getElementById('alerts-container').innerHTML = data.map(a => `
    <div class="alert-box">
      <h3>${a.type} Warning — ${a.location}</h3>
      <p>${a.message}</p>
      <span class="badge">${a.severity} Severity</span>
    </div>`).join('');
}
async function loadResources() {
  const res = await fetch('/api/resources');
  const data = await res.json();
  const icons = {Hospital:'🏥', Shelter:'🏠', Rescue:'🚨'};
  const colors = {Hospital:'red', Shelter:'blue', Rescue:'green'};
  document.getElementById('resources-container').innerHTML = data.map(r => `
    <div class="card">
      <div class="icon ${colors[r.type]}">${icons[r.type]}</div>
      <div style="flex:1"><strong style="font-size:14px">${r.name}</strong><br><span style="font-size:12px;color:#666">${r.location}</span></div>
      <strong style="color:#185FA5">${r.distance_km} km</strong>
    </div>`).join('');
}
async function loadReports() {
  const res = await fetch('/api/reports');
  const data = await res.json();
  if (!data.length) { document.getElementById('reports-container').innerHTML = '<p style="color:#888;font-size:13px;padding:8px 0">No reports yet. Be the first to report!</p>'; return; }
  document.getElementById('reports-container').innerHTML = data.map(r => `
    <div class="card" style="flex-direction:column;align-items:flex-start;">
      <strong>${r.type} — ${r.location}</strong>
      <p style="font-size:13px;color:#555;margin-top:4px">${r.description}</p>
      <span class="badge">${r.severity}</span>
    </div>`).join('');
}
async function submitReport() {
  const body = { type: document.getElementById('dtype').value, location: document.getElementById('loc').value, description: document.getElementById('desc').value, severity: document.getElementById('sev').value };
  if (!body.location || !body.description) { alert('Please fill in location and description.'); return; }
  await fetch('/api/reports', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  document.getElementById('status-msg').style.display = 'block';
  document.getElementById('loc').value = '';
  document.getElementById('desc').value = '';
  setTimeout(() => { document.getElementById('status-msg').style.display='none'; loadReports(); }, 2500);
}
loadAlerts(); loadResources(); loadReports();
</script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(HTML)

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    return jsonify(alerts)

@app.route('/api/alerts', methods=['POST'])
def create_alert():
    data = request.get_json()
    data['id'] = len(alerts) + 1
    data['timestamp'] = datetime.now().isoformat()
    alerts.append(data)
    return jsonify(data), 201

@app.route('/api/reports', methods=['GET'])
def get_reports():
    return jsonify(reports)

@app.route('/api/reports', methods=['POST'])
def create_report():
    data = request.get_json()
    data['id'] = len(reports) + 1
    data['timestamp'] = datetime.now().isoformat()
    reports.append(data)
    return jsonify(data), 201

@app.route('/api/resources', methods=['GET'])
def get_resources():
    return jsonify(resources)

@app.route('/health')
def health():
    return jsonify({"status": "healthy", "app": "ResQNet", "version": "1.0.0"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
