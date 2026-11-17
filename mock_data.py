# ==============================
# mock_data.py
# ==============================
"""
Mock data for SentinelPulse AI - In‑memory storage.
All data lives in Python structures so the app works without any database.
"""

from datetime import datetime
import random

# -------------------------------------------------------------------
# === SECTION 1: INITIAL THREAT LOGS
# -------------------------------------------------------------------
# Each log entry is a dictionary with the following keys:
#   id, timestamp, source_ip, attack_type, mitre_id, severity, status
# -------------------------------------------------------------------
THREAT_LOGS = [
    {
        "id": 1,
        "timestamp": "2026-11-14 10:15:23",
        "source_ip": "192.168.1.45",
        "attack_type": "Brute Force",
        "mitre_id": "T1110",
        "severity": "Critical",
        "status": "Active",
    },
    {
        "id": 2,
        "timestamp": "2026-11-14 11:02:10",
        "source_ip": "10.0.0.33",
        "attack_type": "SQL Injection",
        "mitre_id": "T1190",
        "severity": "High",
        "status": "Active",
    },
    {
        "id": 3,
        "timestamp": "2026-11-14 12:47:05",
        "source_ip": "172.16.5.8",
        "attack_type": "DDoS",
        "mitre_id": "T1499",
        "severity": "Medium",
        "status": "Active",
    },
]

# -------------------------------------------------------------------
# === SECTION 2: MITRE ATT&CK MAPPINGS
# -------------------------------------------------------------------
MITRE_MAPPING = {
    "Brute Force": "T1110",
    "SQL Injection": "T1190",
    "DDoS": "T1499",
    "Malware": "T1059",
}

# -------------------------------------------------------------------
# === SECTION 3: SIMPLE AI COPILOT RULE‑BASED RESPONSES
# -------------------------------------------------------------------
def generate_summary():
    """Return a quick security summary used by the AI copilot UI."""
    active = [log for log in THREAT_LOGS if log["status"] == "Active"]
    critical = [log for log in active if log["severity"] == "Critical"]
    # Find the IP that appears most frequently among active threats
    most_common_ip = None
    if active:
        ip_counts = {}
        for log in active:
            ip = log["source_ip"]
            ip_counts[ip] = ip_counts.get(ip, 0) + 1
        most_common_ip = max(ip_counts, key=ip_counts.get)
    return {
        "total_logs": len(THREAT_LOGS),
        "active_critical": len(critical),
        "most_dangerous_ip": most_common_ip or "N/A",
        "suggestion": "Block IPs with Critical severity immediately.",
    }

# -------------------------------------------------------------------
# === SECTION 4: HELPERS FOR THE FLASK SERVER
# -------------------------------------------------------------------
def add_threat(attack_type: str):
    """Create a new threat entry and append it to THREAT_LOGS.
    The function returns the newly created dictionary.
    """
    new_id = max([log["id"] for log in THREAT_LOGS] or [0]) + 1
    # Generate a random IPv4 address
    ip = ".".join(str(random.randint(0, 255)) for _ in range(4))
    severity_lookup = {
        "Brute Force": "Critical",
        "SQL Injection": "High",
        "DDoS": "Medium",
        "Malware": "Low",
    }
    severity = severity_lookup.get(attack_type, "Low")
    mitre = MITRE_MAPPING.get(attack_type, "T0000")
    new_entry = {
        "id": new_id,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "source_ip": ip,
        "attack_type": attack_type,
        "mitre_id": mitre,
        "severity": severity,
        "status": "Active",
    }
    THREAT_LOGS.append(new_entry)
    return new_entry

def mitigate_threat(log_id: int):
    """Mark a threat as mitigated. Returns True if successful."""
    for log in THREAT_LOGS:
        if log["id"] == log_id:
            log["status"] = "Mitigated"
            return True
    return False

def calculate_health_score() -> int:
    """Very simple health score: start at 100 and subtract weighted active threats.
    Critical = 5 pts, High = 3 pts, Medium = 1 pt, Low = 0 pt.
    """
    score = 100
    weight = {"Critical": 5, "High": 3, "Medium": 1, "Low": 0}
    for log in THREAT_LOGS:
        if log["status"] == "Active":
            score -= weight.get(log["severity"], 0)
    return max(score, 0)
