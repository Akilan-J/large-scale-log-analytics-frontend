/* ============================= CHART.JS INTEGRATION WRAPPER ============================= */
let instances = {};

// Palette definitions matching variables.css
const PALETTE = {
  primary: '#3B82F6',
  primaryDim: 'rgba(59, 130, 246, 0.55)',
  cyan: '#22D3EE',
  success: '#10B981',
  successDim: 'rgba(16, 185, 129, 0.1)',
  warning: '#F59E0B',
  warningDim: 'rgba(245, 158, 11, 0.3)',
  danger: '#EF4444',
  dangerDim: 'rgba(239, 68, 68, 0.1)',
  faint: '#5A6672',
  border: '#1D2733',
  gridline: '#161E29',
  text: '#8A97A6'
};

export function initCharts() {
  Chart.defaults.font.family = "'IBM Plex Mono', monospace";
  Chart.defaults.color = PALETTE.text;
  Chart.defaults.borderColor = PALETTE.border;

  const gridConfig = { color: PALETTE.gridline };

  // --- 1. Dashboard: Log Volume & Anomalies (14D) ---
  const elVolume = document.getElementById('chartVolume');
  if (elVolume) {
    if (instances['chartVolume']) instances['chartVolume'].destroy();
    const days14 = Array.from({ length: 14 }, (_, i) => `Jul ${14 + i}`);
    instances['chartVolume'] = new Chart(elVolume, {
      data: {
        labels: days14,
        datasets: [
          {
            type: 'bar',
            label: 'Logs (K)',
            data: [820, 910, 875, 960, 1040, 990, 1120, 1080, 1150, 1200, 1180, 1260, 1310, 1284].map(v => v * 1.1),
            backgroundColor: PALETTE.primaryDim,
            borderRadius: 4,
            order: 2,
            yAxisID: 'y'
          },
          {
            type: 'line',
            label: 'Anomalies',
            data: [62, 58, 71, 65, 80, 74, 88, 95, 90, 102, 98, 110, 118, 128],
            borderColor: PALETTE.danger,
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            tension: 0.35,
            fill: true,
            pointRadius: 0,
            order: 1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: true, labels: { boxWidth: 10, font: { size: 11 } } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { position: 'left', grid: gridConfig, ticks: { font: { size: 10 } } },
          y1: { position: 'right', grid: { display: false }, ticks: { font: { size: 10 } } }
        }
      }
    });
  }

  // --- 2. Dashboard: Anomaly Severity Mix ---
  const elSeverity = document.getElementById('chartSeverityMini');
  if (elSeverity) {
    if (instances['chartSeverityMini']) instances['chartSeverityMini'].destroy();
    instances['chartSeverityMini'] = new Chart(elSeverity, {
      type: 'doughnut',
      data: {
        labels: ['Critical', 'High', 'Medium'],
        datasets: [{
          data: [18, 34, 48],
          backgroundColor: [PALETTE.danger, PALETTE.warning, PALETTE.cyan],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 8, font: { size: 10.5 }, padding: 10 }
          }
        }
      }
    });
  }

  // --- 3. Analytics: Anomalies Over Time ---
  const elAnomalyTrend = document.getElementById('chartAnomalyTrend');
  if (elAnomalyTrend) {
    if (instances['chartAnomalyTrend']) instances['chartAnomalyTrend'].destroy();
    instances['chartAnomalyTrend'] = new Chart(elAnomalyTrend, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Anomalies Detected',
            data: [142, 168, 155, 190, 210, 175, 128],
            borderColor: PALETTE.danger,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.35,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: PALETTE.danger
          },
          {
            label: 'Alert Threshold',
            data: [150, 150, 150, 150, 150, 150, 150],
            borderColor: PALETTE.faint,
            borderDash: [6, 4],
            pointRadius: 0,
            tension: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { boxWidth: 10, font: { size: 11 } } }
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: gridConfig }
        }
      }
    });
  }

  // --- 4. Analytics: Log Level Distribution ---
  const elLogLevel = document.getElementById('chartLogLevel');
  if (elLogLevel) {
    if (instances['chartLogLevel']) instances['chartLogLevel'].destroy();
    instances['chartLogLevel'] = new Chart(elLogLevel, {
      type: 'doughnut',
      data: {
        labels: ['INFO', 'WARN', 'ERROR', 'DEBUG'],
        datasets: [{
          data: [62, 21, 12, 5],
          backgroundColor: [PALETTE.primary, PALETTE.warning, PALETTE.danger, PALETTE.faint],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 8, font: { size: 10.5 }, padding: 10 }
          }
        }
      }
    });
  }

  // --- 5. Analytics: Event Type Distribution ---
  const elEventDist = document.getElementById('chartEventDist');
  if (elEventDist) {
    if (instances['chartEventDist']) instances['chartEventDist'].destroy();
    instances['chartEventDist'] = new Chart(elEventDist, {
      type: 'bar',
      data: {
        labels: ['Auth Fail', 'API Latency', 'Priv. Esc.', 'Data Exfil', 'Config Drift'],
        datasets: [{
          data: [38, 27, 19, 12, 9],
          backgroundColor: PALETTE.primary,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: gridConfig },
          y: { grid: { display: false }, ticks: { font: { size: 10.5 } } }
        }
      }
    });
  }

  // --- 6. Analytics: Component Distribution ---
  const elComponentDist = document.getElementById('chartComponentDist');
  if (elComponentDist) {
    if (instances['chartComponentDist']) instances['chartComponentDist'].destroy();
    instances['chartComponentDist'] = new Chart(elComponentDist, {
      type: 'bar',
      data: {
        labels: ['auth-svc', 'api-gw', 'iam-ctrl', 'k8s-sched', 'storage'],
        datasets: [{
          data: [34, 26, 18, 14, 8],
          backgroundColor: PALETTE.cyan,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: gridConfig },
          y: { grid: { display: false }, ticks: { font: { size: 10.5 } } }
        }
      }
    });
  }

  // --- 7. Analytics: Processing Throughput ---
  const elThroughput = document.getElementById('chartThroughput');
  if (elThroughput) {
    if (instances['chartThroughput']) instances['chartThroughput'].destroy();
    instances['chartThroughput'] = new Chart(elThroughput, {
      type: 'line',
      data: {
        labels: ['00h', '04h', '08h', '12h', '16h', '20h', '24h'],
        datasets: [{
          data: [812, 760, 940, 1210, 1180, 1050, 880],
          borderColor: PALETTE.success,
          backgroundColor: PALETTE.successDim,
          fill: true,
          tension: 0.4,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 9.5 } } },
          y: { grid: gridConfig }
        }
      }
    });
  }

  // --- 8. Analytics: Detection Trends by Component ---
  const elDetectionTrend = document.getElementById('chartDetectionTrend');
  if (elDetectionTrend) {
    if (instances['chartDetectionTrend']) instances['chartDetectionTrend'].destroy();
    instances['chartDetectionTrend'] = new Chart(elDetectionTrend, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'auth-service',
            data: [40, 52, 38, 60, 55, 44, 30],
            backgroundColor: PALETTE.danger,
            stack: 's'
          },
          {
            label: 'payment-gateway',
            data: [20, 18, 25, 22, 30, 19, 14],
            backgroundColor: PALETTE.warning,
            stack: 's'
          },
          {
            label: 'api-gateway',
            data: [15, 20, 17, 24, 19, 16, 12],
            backgroundColor: PALETTE.cyan,
            stack: 's'
          },
          {
            label: 'iam-controller',
            data: [10, 12, 8, 14, 11, 9, 7],
            backgroundColor: PALETTE.primary,
            stack: 's'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { boxWidth: 10, font: { size: 11 } } }
        },
        scales: {
          x: { grid: { display: false }, stacked: true },
          y: { grid: gridConfig, stacked: true }
        }
      }
    });
  }
}

export function getChartInstance(id) {
  return instances[id];
}
export default { initCharts, getChartInstance };
