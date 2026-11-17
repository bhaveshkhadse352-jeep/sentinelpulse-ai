# ==============================
# app.py
# ==============================
"""
Flask backend for SentinelPulse AI – a lightweight AI‑SOC dashboard.
All data lives in‑memory (mock_data.py) and is served via simple JSON APIs.
"""

from flask import Flask, jsonify, request, send_file, abort
import csv
import io

# Import the in‑memory data and helper functions
from mock_data import (
    THREAT_LOGS,
    add_threat,
    mitigate_threat,
    calculate_health_score,
    generate_summary,
)

app = Flask(__name__)

# -------------------------------------------------------------------
# === SECTION 1: KPI ENDPOINT
# -------------------------------------------------------------------
from flask import Flask, jsonify, request, send_file, abort, render_template

# -------------------------------------------------------------------
# === SECTION 0: HOME ROUTE
# -------------------------------------------------------------------
@app.route('/')
def home():
    return render_template('index.html')

# -------------------------------------------------------------------
# === SECTION 1: KPI ENDPOINT
# -------------------------------------------------------------------
@app.route('/api/kpis')
def get_kpis():
    total_logs = len(THREAT_LOGS)
    active_critical = sum(1 for log in THREAT_LOGS if log["status"] == "Active" and log["severity"] == "Critical")
    mitigated = sum(1 for log in THREAT_LOGS if log["status"] == "Mitigated")
    health_score = calculate_health_score()
    return jsonify({
        "total_logs": total_logs,
        "active_critical": active_critical,
        "mitigated": mitigated,
        "health_score": health_score,
    })

# -------------------------------------------------------------------
# === SECTION 2: THREAT LOG ENDPOINTS
# -------------------------------------------------------------------
@app.route('/api/threats')
def get_threats():
    # Return the full list – the frontend can filter locally.
    return jsonify(THREAT_LOGS)

@app.route('/api/simulate', methods=['POST'])
def simulate_attack():
    data = request.get_json(silent=True) or {}
    attack_type = data.get('type')
    if not attack_type:
        return jsonify({"error": "Missing attack type"}), 400
    new_entry = add_threat(attack_type)
    return jsonify(new_entry), 201

@app.route('/api/mitigate', methods=['POST'])
def mitigate():
    data = request.get_json(silent=True) or {}
    log_id = data.get('id')
    if not isinstance(log_id, int):
        return jsonify({"error": "Invalid or missing log id"}), 400
    success = mitigate_threat(log_id)
    if not success:
        return jsonify({"error": "Log id not found"}), 404
    return jsonify({"status": "Mitigated"})

# -------------------------------------------------------------------
# === SECTION 3: COPILOT SUMMARY ENDPOINT
# -------------------------------------------------------------------
@app.route('/api/copilot')
def copilot_summary():
    return jsonify(generate_summary())

# -------------------------------------------------------------------
# === SECTION 4: EXPORT INCIDENT REPORT (CSV)
# -------------------------------------------------------------------
@app.route('/api/export')
def export_report():
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    header = ["ID", "Timestamp", "Source IP", "Attack Type", "MITRE ID", "Severity", "Status"]
    writer.writerow(header)
    for log in THREAT_LOGS:
        writer.writerow([
            log["id"],
            log["timestamp"],
            log["source_ip"],
            log["attack_type"],
            log["mitre_id"],
            log["severity"],
            log["status"],
        ])
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode()),
        mimetype='text/csv',
        as_attachment=True,
        download_name='incident_report.csv'
    )

# -------------------------------------------------------------------
# === SECTION 5: MAIN ENTRYPOINT
# -------------------------------------------------------------------
if __name__ == '__main__':
    # Debug mode is optional – keep it simple.
    app.run(host='127.0.0.1', port=5000, debug=True)
