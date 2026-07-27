/* ============================= STATE STORE & DATA MANAGMENT ============================= */
const STORE_KEY = 'evolve_log_analytics_state';

const DEFAULT_STATE = {
  activePage: 'dashboard',
  activity: [
    { c: '#EF4444', text: 'Critical anomaly detected in <b>auth-service</b> — score 0.94', t: '2 min ago' },
    { c: '#3B82F6', text: 'Ingested 42,118 records from <b>cluster-auth.log</b>', t: '8 min ago' },
    { c: '#F59E0B', text: 'Candidate model <b>V3</b> reached epoch 140/200', t: '23 min ago' },
    { c: '#10B981', text: 'Model <b>V2.3</b> passed health check — fitness 0.928', t: '1 hr ago' },
    { c: '#3B82F6', text: 'New source connected: <b>AWS CloudWatch</b>', t: '2 hr ago' },
    { c: '#EF4444', text: 'Anomaly cluster flagged in <b>payment-gateway</b>', t: '3 hr ago' },
    { c: '#10B981', text: 'Model evolution cycle completed — 1,204 samples retrained', t: '4 hr ago' }
  ],
  uploads: [
    { name: 'cluster-auth.log', src: 'Manual Upload', size: '128 MB', rec: '412,004', time: '2026-07-27 09:14', status: 'success' },
    { name: 'cloudwatch-export-0726.json', src: 'AWS CloudWatch', size: '340 MB', rec: '1,204,552', time: '2026-07-26 22:03', status: 'success' },
    { name: 'payment-gateway.log', src: 'Manual Upload', size: '64 MB', rec: '198,441', time: '2026-07-26 14:51', status: 'processing' },
    { name: 'network-flow-0725.csv', src: 'Manual Upload', size: '22 MB', rec: '88,120', time: '2026-07-25 11:20', status: 'success' },
    { name: 'legacy-app.log', src: 'Manual Upload', size: '9 MB', rec: '14,032', time: '2026-07-24 08:02', status: 'failed' },
    { name: 'cloudwatch-export-0723.json', src: 'AWS CloudWatch', size: '288 MB', rec: '1,090,332', time: '2026-07-23 20:11', status: 'success' }
  ],
  events: [
    { t: '09:41:22', ev: 'Unauthorized Access Attempt', comp: 'auth-service', score: 0.94, sev: 'critical', ip: '103.42.88.101', raw: '2026-07-27 09:41:22 auth-service: WARN Login failed - Invalid credentials for user "admin". Source IP: 103.42.88.101. User-Agent: Mozilla/5.0. Attempt count: 14.' },
    { t: '09:38:07', ev: 'Anomalous API Latency Spike', comp: 'payment-gateway', score: 0.88, sev: 'high', ip: '10.0.4.22', raw: '2026-07-27 09:38:07 payment-gateway: INFO /charge endpoint took 4250ms (p99 anomaly threshold is 800ms). Connection pool utilization 98%.' },
    { t: '09:22:51', ev: 'Unusual Login Geography', comp: 'auth-service', score: 0.81, sev: 'high', ip: '198.51.100.7', raw: '2026-07-27 09:22:51 auth-service: SUCCESS Authentication successful for user "rkannan" from new geo location: AS15169 (Mountain View, CA). User normally authenticates from Chennai, India.' },
    { t: '08:57:14', ev: 'Repeated Token Refresh Failures', comp: 'api-gateway', score: 0.77, sev: 'medium', ip: '172.16.5.44', raw: '2026-07-27 08:57:14 api-gateway: ERROR Token refresh request rejected. Invalid refresh token hash. Client IP: 172.16.5.44. HTTP Status 400 Bad Request.' },
    { t: '08:40:03', ev: 'Privilege Escalation Pattern', comp: 'iam-controller', score: 0.91, sev: 'critical', ip: '10.0.1.9', raw: '2026-07-27 08:40:03 iam-controller: AUDIT User "dev-deployer" attached Managed Policy "AdministratorAccess" to own IAM Role role-dev-builder. Principal: ARN:aws:iam::123456789:user/dev-deployer.' },
    { t: '08:12:39', ev: 'Config Drift Detected', comp: 'k8s-scheduler', score: 0.72, sev: 'medium', ip: '10.0.9.13', raw: '2026-07-27 08:12:39 k8s-scheduler: WARN Pod definition "payment-processor-pod" has deviated from git-ops repository configuration. Security context changed to runAsUser: 0 (root).' },
    { t: '07:55:18', ev: 'Data Exfiltration Signature', comp: 'storage-service', score: 0.89, sev: 'high', ip: '203.0.113.61', raw: '2026-07-27 07:55:18 storage-service: INFO Object download request from 203.0.113.61: Bucket "financial-exports", Key "tax-receipts-2025.zip". Size: 4.8 GB. Threat model flags high outbound volume.' },
    { t: '07:30:44', ev: 'Brute Force Login Sequence', comp: 'auth-service', score: 0.95, sev: 'critical', ip: '45.33.12.201', raw: '2026-07-27 07:30:44 auth-service: WARN Attempted access to accounts: "sales", "ceo", "finance", "billing", "support". IP: 45.33.12.201. Rapid succession: 50 requests in 2.1 seconds.' },
    { t: '07:02:09', ev: 'Abnormal Outbound Traffic', comp: 'network-proxy', score: 0.79, sev: 'medium', ip: '10.0.2.61', raw: '2026-07-27 07:02:09 network-proxy: WARN Outbound connection open to unverified peer 185.190.140.23:8080 from internal server IP: 10.0.2.61. Payload length: 144MB.' },
    { t: '06:44:57', ev: 'Certificate Validation Failure', comp: 'api-gateway', score: 0.75, sev: 'medium', ip: '10.0.6.30', raw: '2026-07-27 06:44:57 api-gateway: TLS Alert - Handshake failure. Peer 10.0.6.30 presented certificate signed by untrusted authority. Domain: core-internal.lan.' }
  ],
  deployHistory: [
    { v: 'V2.3', acc: '95.4%', fit: '0.928', date: '2026-07-21', status: 'success' },
    { v: 'V2.2', acc: '94.1%', fit: '0.911', date: '2026-07-14', status: 'success' },
    { v: 'V2.1', acc: '93.6%', fit: '0.902', date: '2026-07-07', status: 'rollback' },
    { v: 'V2.0', acc: '92.8%', fit: '0.895', date: '2026-06-29', status: 'success' },
    { v: 'V1', acc: '91.2%', fit: '0.870', date: '2026-06-15', status: 'success' }
  ],
  timelineData: [
    { c: 'warning', title: 'V3 training started', meta: '2026-07-27 07:00', desc: 'Retraining triggered by drift detection in auth-service traffic.' },
    { c: 'success', title: 'V2.3 deployed to production', meta: '2026-07-21 16:20', desc: 'Gradual rollout completed, fitness stable at 0.928.' },
    { c: 'success', title: 'V2.2 promoted from candidate', meta: '2026-07-14 10:05', desc: 'Accuracy improved 1.3pp on validation set.' },
    { c: 'rollback', title: 'V2.1 rolled back', meta: '2026-07-07 03:44', desc: 'Fitness dropped below 0.90 threshold post-deploy; reverted to V2.0.' },
    { c: 'success', title: 'V1 initial deployment', meta: '2026-06-15 09:00', desc: 'Baseline isolation-forest model shipped.' }
  ],
  candidateModel: {
    version: 'V3',
    progress: 73,
    acc: '96.1%',
    fit: '0.941',
    isTraining: true
  },
  settings: {
    workspaceName: 'Evolve Security Operations',
    workspaceDomain: 'security.evolve.io',
    team: [
      { name: 'R. Kannan', role: 'Security Analyst', initial: 'RK' },
      { name: 'A. Patel', role: 'SecOps Director', initial: 'AP' },
      { name: 'J. Doe', role: 'Incident Responder', initial: 'JD' }
    ],
    notifySlack: true,
    notifyEmail: false,
    notifyWebhook: true,
    webhookUrl: 'https://example.com/dummy-webhook-url',
    apiKeys: [
      { name: 'SOC Ingestion Pipeline', key: 'ev_live_key_9f8d1c...8b7c', created: '2026-06-16' },
      { name: 'SIEM Integration', key: 'ev_live_key_1a2b3c...4d5e', created: '2026-07-02' }
    ]
  }
};

class DataStore {
  constructor() {
    this.state = this.loadState();
    this.listeners = [];
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) {
        // Merge saved data with defaults in case structural changes happened
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_STATE, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE)); // Deep clone defaults
  }

  saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
    this.notify();
  }

  reset() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveState();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // --- ACTIONS ---
  
  addActivity(text, color = '#3B82F6') {
    const timeText = 'Just now';
    this.state.activity.unshift({ c: color, text, t: timeText });
    if (this.state.activity.length > 20) this.state.activity.pop();
    this.saveState();
  }

  addUpload(name, size, records, status = 'success') {
    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 16);
    this.state.uploads.unshift({
      name,
      src: 'Manual Upload',
      size,
      rec: records,
      time: dateStr,
      status
    });
    this.saveState();
  }

  updateUploadStatus(fileName, status) {
    const upload = this.state.uploads.find(u => u.name === fileName);
    if (upload) {
      upload.status = status;
      this.saveState();
    }
  }

  deployModel() {
    const version = this.state.candidateModel.version;
    const accuracy = this.state.candidateModel.acc;
    const fitness = this.state.candidateModel.fit;
    const today = new Date().toISOString().split('T')[0];

    // Deactivate training
    this.state.candidateModel.isTraining = false;
    this.state.candidateModel.progress = 100;

    // Add to deploy history
    this.state.deployHistory.unshift({
      v: version,
      acc: accuracy,
      fit: fitness,
      date: today,
      status: 'success'
    });

    // Update current active V2.3 to retired if needed, etc.
    // In this mock, V3 becomes the active one, let's update timeline
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    this.state.timelineData.unshift({
      c: 'success',
      title: `${version} deployed to production`,
      meta: nowStr,
      desc: `Rollout initiated. Fitness stable at ${fitness}. Replaces V2.3 as active.`
    });

    // Prepare next candidate V4
    this.state.candidateModel = {
      version: 'V4',
      progress: 0,
      acc: '96.8%*',
      fit: '0.952',
      isTraining: true
    };

    this.saveState();
  }

  incrementTraining(pct) {
    if (this.state.candidateModel.isTraining) {
      let p = this.state.candidateModel.progress + pct;
      if (p >= 100) {
        p = 100;
        this.addActivity(`Candidate model <b>${this.state.candidateModel.version}</b> training completed. Ready for deployment.`, '#F59E0B');
      }
      this.state.candidateModel.progress = p;
      this.saveState();
    }
  }

  updateSettings(data) {
    this.state.settings = { ...this.state.settings, ...data };
    this.saveState();
  }

  addTeamMember(name, role) {
    const initial = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    this.state.settings.team.push({ name, role, initial });
    this.saveState();
  }

  generateApiKey(name) {
    const chars = '0123456789abcdef';
    let randPart = '';
    for (let i = 0; i < 8; i++) randPart += chars[Math.floor(Math.random() * chars.length)];
    const key = `ev_live_key_${randPart}...${randPart.split('').reverse().join('')}`;
    const today = new Date().toISOString().split('T')[0];
    this.state.settings.apiKeys.push({ name, key, created: today });
    this.saveState();
  }

  deleteApiKey(keyString) {
    this.state.settings.apiKeys = this.state.settings.apiKeys.filter(k => k.key !== keyString);
    this.saveState();
  }
}

export const db = new DataStore();
export default db;
