/* ============================= SETTINGS VIEW CONTROLLER ============================= */
import db from '../data.js';

let activePane = 'workspace';

export function initSettings(showToast) {
  const panesContainer = document.getElementById('settingsPanes');
  const navContainer = document.getElementById('settingsNav');

  if (navContainer) {
    navContainer.addEventListener('click', (e) => {
      const navItem = e.target.closest('.settings-nav-item');
      if (navItem) {
        document.querySelectorAll('.settings-nav-item').forEach(el => el.classList.remove('active'));
        navItem.classList.add('active');
        activePane = navItem.getAttribute('data-pane');
        renderPane(activePane, showToast);
      }
    });
  }

  // Subscribe to store updates
  db.subscribe(() => {
    if (db.state.activePage === 'settings' || window.location.hash.includes('settings')) {
      renderPane(activePane, showToast);
    }
  });

  // Initial draw
  renderPane(activePane, showToast);
}

function renderPane(pane, showToast) {
  const container = document.getElementById('settingsPanes');
  if (!container) return;

  const state = db.state.settings;

  if (pane === 'workspace') {
    container.innerHTML = `
      <div class="card card-pad">
        <h3 style="font-size: 15px; margin-bottom: 16px;">Workspace Settings</h3>
        <form id="workspaceForm">
          <div class="form-group">
            <label for="wsName">Workspace Name</label>
            <input type="text" class="form-control" id="wsName" value="${state.workspaceName}">
          </div>
          <div class="form-group">
            <label for="wsDomain">Custom Log Domain</label>
            <input type="text" class="form-control" id="wsDomain" value="${state.workspaceDomain}">
          </div>
          <button type="submit" class="btn btn-primary btn-sm">Save Workspace</button>
        </form>
      </div>

      <div class="card card-pad" style="margin-top: 18px;">
        <h3 style="font-size: 15px; margin-bottom: 8px;">Team Directory</h3>
        <p style="font-size: 12.5px; color: var(--text-lo); margin-bottom: 16px;">Manage members authorized to review security and deploy detection models.</p>
        
        <div style="display:flex; flex-direction:column; gap:12px; margin-bottom: 20px;">
          ${state.team.map(member => `
            <div class="source-tile" style="padding: 10px 14px;">
              <div class="avatar" style="width:32px; height:32px; font-size:11px;">${member.initial}</div>
              <div>
                <div class="row-title" style="font-size:13px;">${member.name}</div>
                <div style="font-size:11px; color:var(--text-faint);">${member.role}</div>
              </div>
              <span class="badge badge-neutral" style="margin-left:auto;">Active</span>
            </div>
          `).join('')}
        </div>

        <h4 style="font-size: 13px; font-weight: 600; margin-bottom: 12px; color: var(--text-hi);">Invite Team Member</h4>
        <form id="teamForm" class="form-row">
          <input type="text" class="form-control" id="tmName" placeholder="Full name" required>
          <select class="form-control" id="tmRole">
            <option>Security Analyst</option>
            <option>SecOps Director</option>
            <option>Incident Responder</option>
          </select>
          <button type="submit" class="btn btn-secondary btn-sm" style="grid-column: span 2; margin-top: 4px;">Send Invite Link</button>
        </form>
      </div>
    `;

    // Bind Forms
    document.getElementById('workspaceForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const workspaceName = document.getElementById('wsName').value;
      const workspaceDomain = document.getElementById('wsDomain').value;
      db.updateSettings({ workspaceName, workspaceDomain });
      db.addActivity(`Updated workspace settings.`, 'var(--cyan)');
      showToast('Workspace Saved', 'Workspace settings updated successfully.');
    });

    document.getElementById('teamForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('tmName').value;
      const role = document.getElementById('tmRole').value;
      db.addTeamMember(name, role);
      db.addActivity(`Invited new team member: <b>${name}</b> (${role})`, 'var(--cyan)');
      showToast('Invite Sent', `${name} has been added to team directory.`);
      
      document.getElementById('tmName').value = '';
    });

  } else if (pane === 'alerting') {
    container.innerHTML = `
      <div class="card card-pad">
        <h3 style="font-size: 15px; margin-bottom: 16px;">Notification Alerting Rules</h3>
        <form id="alertingForm">
          <div class="checkbox-group">
            <input type="checkbox" id="checkSlack" ${state.notifySlack ? 'checked' : ''}>
            <div>
              <label for="checkSlack" class="checkbox-label" style="font-weight:600;">Slack Webhook Notifications</label>
              <div class="checkbox-sublabel">Post critical detection logs directly to Incident Channel.</div>
            </div>
          </div>
          
          <div class="form-group" style="padding-left: 24px; margin-bottom: 20px;">
            <label for="slackUrl">Slack Webhook URL</label>
            <input type="text" class="form-control" id="slackUrl" value="${state.webhookUrl}" ${state.notifySlack ? '' : 'disabled'}>
          </div>

          <div class="checkbox-group">
            <input type="checkbox" id="checkWebhook" ${state.notifyWebhook ? 'checked' : ''}>
            <div>
              <label for="checkWebhook" class="checkbox-label" style="font-weight:600;">Generic JSON Webhook Trigger</label>
              <div class="checkbox-sublabel">Send POST payload to log analytics endpoints.</div>
            </div>
          </div>

          <div class="checkbox-group">
            <input type="checkbox" id="checkEmail" ${state.notifyEmail ? 'checked' : ''}>
            <div>
              <label for="checkEmail" class="checkbox-label" style="font-weight:600;">Daily SecOps Report Email Summary</label>
              <div class="checkbox-sublabel">Digest anomaly counts and metrics summaries daily.</div>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-sm" style="margin-top: 8px;">Save Alerting Rules</button>
        </form>
      </div>
    `;

    const checkSlack = document.getElementById('checkSlack');
    const slackUrl = document.getElementById('slackUrl');
    if (checkSlack && slackUrl) {
      checkSlack.addEventListener('change', () => {
        slackUrl.disabled = !checkSlack.checked;
      });
    }

    document.getElementById('alertingForm').addEventListener('submit', (e) => {
      e.preventDefault();
      db.updateSettings({
        notifySlack: checkSlack.checked,
        webhookUrl: slackUrl.value,
        notifyWebhook: document.getElementById('checkWebhook').checked,
        notifyEmail: document.getElementById('checkEmail').checked
      });
      db.addActivity('Updated alert notification options.', 'var(--cyan)');
      showToast('Rules Saved', 'Alerting rules have been successfully applied.');
    });

  } else if (pane === 'apikeys') {
    container.innerHTML = `
      <div class="card card-pad">
        <h3 style="font-size: 15px; margin-bottom: 8px;">API Access Credentials</h3>
        <p style="font-size: 12.5px; color: var(--text-lo); margin-bottom: 16px;">Use active credentials to push logs into the ingestion pipeline or fetch model validation statistics.</p>
        
        <div style="display:flex; flex-direction:column; gap:12px; margin-bottom: 24px;">
          ${state.apiKeys.length === 0 ? `
            <div class="empty-state" style="padding: 20px;">No active API keys found. Create one below.</div>
          ` : state.apiKeys.map(k => `
            <div class="source-tile" style="padding: 10px 14px;">
              <div>
                <div class="row-title" style="font-size:13px;">${k.name}</div>
                <div style="font-family:var(--mono); font-size:11.5px; color:var(--cyan); margin-top:2px;">${k.key}</div>
                <div style="font-size:10.5px; color:var(--text-faint); margin-top:4px;">Created on ${k.created}</div>
              </div>
              <button class="btn btn-ghost btn-sm text-danger" data-key="${k.key}" style="margin-left:auto; font-size:11px;">Revoke</button>
            </div>
          `).join('')}
        </div>

        <h4 style="font-size: 13px; font-weight: 600; margin-bottom: 12px; color: var(--text-hi);">Generate New Credentials</h4>
        <form id="apiKeyForm" style="display:flex; gap:10px;">
          <input type="text" class="form-control" id="keyName" placeholder="Key description (e.g. Dev Ingestion)" required>
          <button type="submit" class="btn btn-secondary btn-sm">Generate</button>
        </form>
      </div>
    `;

    // Revoke Action
    document.querySelectorAll('.source-tile button[data-key]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-key');
        db.deleteApiKey(key);
        db.addActivity('Revoked an ingestion pipeline API key credential.', 'var(--danger)');
        showToast('Key Revoked', 'API token has been permanently invalidated.', true);
      });
    });

    // Generate Action
    document.getElementById('apiKeyForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('keyName').value;
      db.generateApiKey(name);
      db.addActivity(`Generated new API key: <b>${name}</b>`, 'var(--cyan)');
      showToast('Key Generated', `Generated live token for ${name}.`);
      
      document.getElementById('keyName').value = '';
    });

  } else if (pane === 'account') {
    container.innerHTML = `
      <div class="card card-pad">
        <h3 style="font-size: 15px; margin-bottom: 16px;">Security Analyst Profile</h3>
        <form id="accountForm">
          <div class="form-row">
            <div class="form-group">
              <label for="accName">Full Name</label>
              <input type="text" class="form-control" id="accName" value="R. Kannan" disabled>
            </div>
            <div class="form-group">
              <label for="accRole">Assigned Access Role</label>
              <input type="text" class="form-control" id="accRole" value="Security Analyst" disabled>
            </div>
          </div>
          <div class="form-group">
            <label for="accEmail">Auth Email Address</label>
            <input type="email" class="form-control" id="accEmail" value="r.kannan@evolve.io" disabled>
          </div>
          <div class="form-group">
            <label for="accPsw">Authentication Method</label>
            <input type="text" class="form-control" id="accPsw" value="Okta Single Sign-On (MFA Enforced)" disabled>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" id="signOutBtn">Revoke Session &amp; Sign Out</button>
        </form>
      </div>
    `;

    document.getElementById('signOutBtn').addEventListener('click', () => {
      showToast('Session Expired', 'Mock SSO logout requested.');
      db.addActivity('Sign out requested - session invalidated.', 'var(--danger)');
    });
  }
}

export default { initSettings };
