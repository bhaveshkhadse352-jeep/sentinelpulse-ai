# SentinelPulse AI — Lightweight AI-SOC Dashboard

A lightweight Flask-based security operations dashboard for demonstrating incident records, basic security KPIs, a rule-based SOC Copilot, and simulated attack events.

## Run locally

Python 3.9+ recommended.

```bash
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS / Linux:
# source .venv/bin/activate

pip install -r requirements.txt
python app.py
```

Open **http://127.0.0.1:5000/**.

## Features

- Flask JSON API for KPIs, threat records, simulated events, mitigation status, Copilot summary, and CSV export.
- Responsive SOC dashboard with KPI cards, Chart.js analytics, threat feed, attack simulator, and rule-based Copilot.
- Dark/light theme and mobile navigation.

## Important demo limitations

- Data is stored in memory in `mock_data.py`; restarting the server resets newly simulated or mitigated records.
- The attack simulator creates sample incident records only. It does not execute attacks or generate network traffic.
- The traffic series in the line chart is simulated demo data, not real network telemetry.
- Mitigation changes the incident record status only. It does not block an IP, remediate a host, or change network controls.
- SOC Copilot uses predefined, rule-based responses via `/api/copilot`; it is not an LLM or trained AI model.
- Navigation entries whose workflows are not implemented display an explanatory placeholder.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Dashboard |
| GET | `/api/kpis` | KPI values |
| GET | `/api/threats` | Threat records |
| POST | `/api/simulate` | Add a simulated incident (`{"type":"Brute Force"}`) |
| POST | `/api/mitigate` | Mark a record mitigated (`{"id":1}`) |
| GET | `/api/copilot` | Rule-based incident summary |
| GET | `/api/export` | Download incident CSV |

## Project structure

```text
sentinelpulse-ai-main/
├── app.py
├── mock_data.py
├── requirements.txt
├── templates/
│   └── index.html
└── static/
    ├── main.js
    └── style.css
```

This project is a local educational demonstration, not a production security monitoring or incident-response system.
