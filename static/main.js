// ==============================
// static/main.js
// ==============================
/*
   Front‑end logic for SentinelPulse AI.
   Uses fetch to talk to Flask JSON APIs, updates DOM, and renders Chart.js charts.
*/

// ----- GLOBAL STATE ---------------------------------------------------
let threatData = [];
let lineChart, doughnutChart;

// ----- UTILITIES ------------------------------------------------------
function $(id) { return document.getElementById(id); }

function fetchJson(url, options = {}) {
    return fetch(url, options).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
    });
}

function updateKPIs() {
    fetchJson('/api/kpis')
        .then(data => {
            $('kpi-total-logs').textContent = data.total_logs;
            $('kpi-active-critical').textContent = data.active_critical;
            $('kpi-mitigated').textContent = data.mitigated;
            $('kpi-health-score').textContent = data.health_score + '%';
        })
        .catch(console.error);
}

function renderThreatTable() {
    const tbody = $('threatTableBody');
    tbody.innerHTML = '';
    const filter = $('severityFilter').value;
    const search = $('searchBox').value.toLowerCase();
    threatData.forEach(log => {
        if (filter !== 'All' && log.severity !== filter) return;
        if (search && !log.source_ip.includes(search) && !log.attack_type.toLowerCase().includes(search)) return;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="p-2">${log.timestamp}</td>
            <td class="p-2">${log.source_ip}</td>
            <td class="p-2">${log.attack_type}</td>
            <td class="p-2">${log.mitre_id}</td>
            <td class="p-2"><span class="px-2 py-1 rounded ${severityClass(log.severity)}">${log.severity}</span></td>
            <td class="p-2"><span class="px-2 py-1 rounded ${statusClass(log.status)}">${log.status}</span></td>
            <td class="p-2">
                ${log.status === 'Active' ? `<button class="mitigate-btn bg-emerald-600 hover:bg-emerald-500 text-white py-1 px-2 rounded" data-id="${log.id}">Mitigate</button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
    // Attach mitigation handlers
    document.querySelectorAll('.mitigate-btn').forEach(btn => {
        btn.addEventListener('click', () => mitigateThreat(parseInt(btn.dataset.id)));
    });
}

function severityClass(sev) {
    switch (sev) {
        case 'Critical': return 'bg-red-600 text-white';
        case 'High': return 'bg-orange-600 text-white';
        case 'Medium': return 'bg-yellow-600 text-white';
        case 'Low': return 'bg-green-600 text-white';
        default: return 'bg-gray-600 text-white';
    }
}
function statusClass(st) {
    return st === 'Active' ? 'bg-red-600 text-white' : 'bg-green-600 text-white';
}

function loadThreats() {
    fetchJson('/api/threats')
        .then(data => {
            threatData = data;
            renderThreatTable();
            updateCharts();
        })
        .catch(console.error);
}

function mitigateThreat(id) {
    fetchJson('/api/mitigate', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id})})
        .then(() => {
            // Update local copy
            const log = threatData.find(l => l.id === id);
            if (log) log.status = 'Mitigated';
            renderThreatTable();
            updateKPIs();
            updateCharts();
        })
        .catch(console.error);
}

// ----- CHARTS ----------------------------------------------------------
function initCharts() {
    const lineCtx = $('lineChart').getContext('2d');
    const doughnutCtx = $('doughnutChart').getContext('2d');
    lineChart = new Chart(lineCtx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: { responsive: true, plugins: { legend: { display: true } } }
    });
    doughnutChart = new Chart(doughnutCtx, {
        type: 'doughnut',
        data: { labels: [], datasets: [] },
        options: { responsive: true, plugins: { legend: { position: 'right' } } }
    });
}

function updateCharts() {
    // ----- Line chart: Traffic (simulated) vs Threat spikes -----
    const now = Date.now();
    const points = 12; // last 12 intervals (e.g., minutes)
    const labels = [];
    const traffic = [];
    const threats = [];
    for (let i = points - 1; i >= 0; i--) {
        const ts = new Date(now - i * 60000); // 1‑min steps
        labels.push(ts.getHours() + ':' + ts.getMinutes().toString().padStart(2, '0'));
        traffic.push(Math.floor(Math.random() * 200) + 100); // dummy traffic
        const count = threatData.filter(l => {
            const logTime = new Date(l.timestamp);
            return Math.abs(logTime - ts) < 60000 && l.status === 'Active';
        }).length;
        threats.push(count);
    }
    lineChart.data = {
        labels,
        datasets: [
            { label: 'Traffic', data: traffic, borderColor: '#60a5fa', tension: 0.4, fill: false },
            { label: 'Threat Spikes', data: threats, borderColor: '#f43f5e', tension: 0.4, fill: false },
        ]
    };
    lineChart.update();

    // ----- Doughnut chart: Attack type distribution -----
    const typeCounts = {};
    threatData.forEach(l => {
        if (l.status !== 'Active') return; // show only active
        typeCounts[l.attack_type] = (typeCounts[l.attack_type] || 0) + 1;
    });
    const dLabels = Object.keys(typeCounts);
    const dData = Object.values(typeCounts);
    doughnutChart.data = {
        labels: dLabels,
        datasets: [{ data: dData, backgroundColor: ['#ef4444', '#f97316', '#8b5cf6', '#10b981'] }]
    };
    doughnutChart.update();
}

// ----- ATTACK SIMULATOR -----------------------------------------------
function attachSimButtons() {
    document.querySelectorAll('.sim-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            fetchJson('/api/simulate', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({type})})
                .then(newLog => {
                    threatData.push(newLog);
                    renderThreatTable();
                    updateKPIs();
                    updateCharts();
                })
                .catch(console.error);
        });
    });
}

// ----- COPILOT --------------------------------------------------------
function askCopilot(prompt) {
    // Very simple local rule‑based response – the backend already provides summary.
    // Here we just call the summary endpoint and format a reply.
    fetchJson('/api/copilot')
        .then(summary => {
            let reply = '';
            if (prompt.includes('critical')) {
                reply = `There are ${summary.active_critical} active critical alerts.`;
            } else if (prompt.includes('dangerous')) {
                reply = `The most dangerous IP is ${summary.most_dangerous_ip}.`;
            } else if (prompt.includes('suggest')) {
                reply = summary.suggestion;
            } else {
                reply = `Total logs: ${summary.total_logs}. Health score: ${summary.health_score || 'N/A'}.`;
            }
            addChatMessage('Copilot', reply);
        })
        .catch(console.error);
}

function addChatMessage(sender, text) {
    const log = $('chatLog');
    const div = document.createElement('div');
    div.className = 'mb-2';
    div.innerHTML = `<strong>${sender}:</strong> ${text}`;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
}

function initCopilot() {
    // Quick‑question buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const q = btn.dataset.q;
            let prompt = '';
            if (q === 'critical') prompt = 'show critical threats';
            else if (q === 'dangerous_ip') prompt = 'which IP is most dangerous?';
            else if (q === 'suggestion') prompt = 'suggest mitigation steps';
            addChatMessage('You', prompt);
            askCopilot(prompt);
        });
    });
    // Custom input
    $('sendChat').addEventListener('click', () => {
        const input = $('chatInput');
        const txt = input.value.trim();
        if (!txt) return;
        addChatMessage('You', txt);
        askCopilot(txt.toLowerCase());
        input.value = '';
    });
}

// ----- EXPORT ----------------------------------------------------------
$('exportBtn').addEventListener('click', () => {
    // Trigger download of CSV via the Flask endpoint
    window.location.href = '/api/export';
});

// ----- THEME TOGGLE ---------------------------------------------------
$('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    // Tailwind's dark mode works via the ‘dark’ class on html/body.
});

// ----- INITIALISATION -------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
    initCharts();
    loadThreats();
    updateKPIs();
    attachSimButtons();
    initCopilot();
    // Filters & search
    $('severityFilter').addEventListener('change', renderThreatTable);
    $('searchBox').addEventListener('input', renderThreatTable);
});
