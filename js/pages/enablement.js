/** PAGE: Team Tracker */
'use strict';

const PAGE_ENABLEMENT = (() => {

  const MEMBERS = [
    { username: 'alex', displayName: 'Alex' },
    { username: 'damon', displayName: 'Damon' },
    { username: 'julia_t', displayName: 'Julia' },
    { username: 'max', displayName: 'Max' },
    { username: 'maxime', displayName: 'Maxim' },
    { username: 'melina_t', displayName: 'Melina' },
    { username: 'paul_z', displayName: 'Paul' }
  ];

  const PREP_STAGES = [
    'Lead Research & CRM Prep',
    'Pre-Call Agenda Setting'
  ];

  const FRAMEWORK_STAGES = [
    'Greeting', 'Introduction', 'Small Talk', 'Recap + Framing',
    'Pre-objection Prevention', 'Building the Gap',
    'Solution Presentation / Pitch', 'Additional Objection Handling',
    'Final Closing / Next Steps'
  ];

  const FOLLOW_UP_ITEMS = [
    { id: 'linkedin', label: 'Uses LinkedIn' },
    { id: 'whatsapp', label: 'Uses WhatsApp' },
    { id: 'telegram', label: 'Uses Telegram' },
    { id: 'email', label: 'Uses Email (Templates)' }
  ];

  function getTrackerData() {
    let data = {
      prep: {},
      framework: {},
      followup: {},
      tasks: {}
    };

    try {
      const raw = localStorage.getItem('np_team_enablement');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.prep) data.prep = parsed.prep;
        if (parsed.framework) data.framework = parsed.framework;
        if (parsed.followup) data.followup = parsed.followup;
        if (parsed.tasks) data.tasks = parsed.tasks;
      }
    } catch (e) {}

    MEMBERS.forEach(m => {
      if (!data.prep[m.username]) {
        data.prep[m.username] = {};
        PREP_STAGES.forEach(s => {
          data.prep[m.username][s] = true;
        });
      }

      if (!data.framework[m.username]) {
        data.framework[m.username] = {};
        FRAMEWORK_STAGES.forEach((s, idx) => {
          data.framework[m.username][s] = idx < 6;
        });
      }

      if (!data.followup[m.username]) {
        data.followup[m.username] = {
          linkedin: m.username !== 'damon',
          whatsapp: true,
          telegram: m.username === 'max' || m.username === 'maxime',
          email: true
        };
      }

      if (!data.tasks[m.username]) {
        data.tasks[m.username] = {};
      }
      
      const docs = STORE.getByTypes(['training', 'process-doc', 'template']);
      docs.forEach(doc => {
        if (!data.tasks[m.username][doc.id]) {
          data.tasks[m.username][doc.id] = {
            reviewed: m.username !== 'damon',
            implemented: m.username === 'max' || m.username === 'julia_t',
            verified: m.username === 'max'
          };
        }
      });
    });

    localStorage.setItem('np_team_enablement', JSON.stringify(data));
    return data;
  }

  function saveTrackerData(data) {
    localStorage.setItem('np_team_enablement', JSON.stringify(data));
  }

  function addNewMaterialTask(doc) {
    const data = getTrackerData();
    MEMBERS.forEach(m => {
      if (!data.tasks[m.username]) data.tasks[m.username] = {};
      data.tasks[m.username][doc.id] = {
        reviewed: false,
        implemented: false,
        verified: false
      };
    });
    saveTrackerData(data);
  }

  let _selectedUser = 'alex';

  function render(container) {
    const data = getTrackerData();
    const isSuperAdmin = AUTH.canManageContent();
    const currentUser = AUTH.getSession()?.username || 'max';

    // Calculate score metrics for each person (Racing tracker)
    const trainingDocs = STORE.getByTypes(['training', 'process-doc', 'template']);
    const metrics = MEMBERS.map(m => {
      const pr = data.prep[m.username] || {};
      const fw = data.framework[m.username] || {};
      const fl = data.followup[m.username] || {};
      const tks = data.tasks[m.username] || {};

      const prDone = Object.values(pr).filter(Boolean).length;
      const fwDone = Object.values(fw).filter(Boolean).length;
      const flDone = Object.values(fl).filter(Boolean).length;
      
      // Only "verified" tasks count toward the progress score
      let verifiedDocsCount = 0;
      trainingDocs.forEach(doc => {
        const task = tks[doc.id];
        if (task && task.verified) {
          verifiedDocsCount++;
        }
      });

      const totalPossible = PREP_STAGES.length + FRAMEWORK_STAGES.length + FOLLOW_UP_ITEMS.length + trainingDocs.length;
      const totalDone = prDone + fwDone + flDone + verifiedDocsCount;
      const percentage = Math.round((totalDone / (totalPossible || 1)) * 100);

      return { ...m, percentage };
    });

    // Check if there are incomplete training tasks (e.g. newly added documents)
    const incompleteCount = Object.values(data.tasks[_selectedUser] || {}).filter(t => !t.reviewed || !t.implemented || !t.verified).length;
    let taskAlertBanner = '';
    if (incompleteCount > 0) {
      taskAlertBanner = `
        <div class="animate-fade" style="background: var(--warning-dim); border: 1px solid var(--warning); padding: 12px 16px; border-radius: var(--r-md); display:flex; align-items:center; gap:10px; margin-bottom:16px;">
          <span style="font-size:16px;">💡</span>
          <div style="font-size:13px; color:var(--text-primary); font-weight:500;">
            New training task added! Complete the adoption homework below to restore your score.
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-row">
          <div>
            <div class="page-subtitle" style="font-size:22px; font-weight:700; color:var(--text-primary); max-width:none; line-height:1.3; margin-top:0;">Track adoption of call frameworks, training guides, and client engagement tools across the sales team.</div>
          </div>
        </div>
      </div>

      <!-- Leaderboard / Racing Tracker -->
      <div class="enablement-green-glowing" style="padding:16px; margin-bottom:24px;">
        <div style="font-family:var(--font-ui); font-size:12.5px; font-weight:500; color:var(--accent); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:16px;">🏁 Team Racing Leaderboard — click a row to view details</div>
        <div style="display:flex; flex-direction:column; gap:4px;">
          ${metrics.map(m => {
            const isSel = m.username === _selectedUser;
            return `
              <div onclick="PAGE_ENABLEMENT.selectUser('${m.username}')" style="display:flex; align-items:center; gap:16px; padding: 10px 14px; border-radius: var(--r-md); cursor:pointer; background: ${isSel ? 'var(--accent-dim)' : 'transparent'}; border: 1px solid ${isSel ? 'var(--accent)' : 'transparent'}; transition: all 0.2s;">
                <div style="width:120px; font-size:14px; font-weight:700; color:${isSel ? 'var(--accent)' : 'var(--text-primary)'};">
                  ${m.displayName}
                </div>
                <div style="flex:1; background:var(--bg-3); height:10px; border-radius:var(--r-full); overflow:hidden; border: 1px solid var(--border-subtle);">
                  <div style="background:var(--accent); width:${m.percentage}%; height:100%; border-radius:var(--r-full); transition: width 0.3s ease;"></div>
                </div>
                <div style="width:50px; font-family:var(--font-mono); font-size:12px; text-align:right; color:${isSel ? 'var(--accent)' : 'var(--text-secondary)'}; font-weight:bold;">
                  ${m.percentage}%
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Detail View / Checklist Panel -->
      <div style="display:grid; grid-template-columns: 1fr; gap:20px;">
        <!-- Checklist Grid -->
        <div class="enablement-green-glowing" style="padding:24px; display:flex; flex-direction:column; gap:24px;">
          ${taskAlertBanner}

          <div style="display:flex; align-items:center; gap:12px; border-bottom:1px solid var(--border-subtle); padding-bottom:12px;">
            <div style="font-size:18px; font-weight:700; color:var(--text-primary);">Checklist &amp; Training (${MEMBERS.find(x => x.username === _selectedUser).displayName})</div>
          </div>

          <div class="checklist-grid">
            <!-- Column 1: Call Preparation -->
            <div>
              <h3 style="font-size:15px; font-weight:500; color:var(--accent); font-family:var(--font-ui); margin-bottom:14px; display:flex; align-items:center; gap:6px;">
                <span style="display:inline-block; width:15px; height:15px;">${ICONS.search}</span> CALL PREPARATION
              </h3>
              <div style="display:flex; flex-direction:column; gap:12px;">
                ${PREP_STAGES.map(s => {
                  const checked = data.prep[_selectedUser]?.[s] || false;
                  const disabled = (!isSuperAdmin && currentUser !== _selectedUser) ? 'disabled' : '';
                  return `
                    <label style="display:flex; align-items:center; gap:12px; font-size:16px; color:var(--text-secondary); cursor:pointer;">
                      <input type="checkbox" style="width:22px; height:22px; cursor:pointer;" ${checked ? 'checked' : ''} ${disabled} onchange="PAGE_ENABLEMENT.togglePrep('${_selectedUser}', '${s}', this.checked)">
                      <span>${s}</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Column 2: Call Framework Stages -->
            <div>
              <h3 style="font-size:15px; font-weight:500; color:var(--accent); font-family:var(--font-ui); margin-bottom:14px; display:flex; align-items:center; gap:6px;">
                <span style="display:inline-block; width:15px; height:15px;">${ICONS.cases}</span> CALL FRAMEWORK STAGES
              </h3>
              <div style="display:flex; flex-direction:column; gap:12px;">
                ${FRAMEWORK_STAGES.map(s => {
                  const checked = data.framework[_selectedUser]?.[s] || false;
                  const disabled = (!isSuperAdmin && currentUser !== _selectedUser) ? 'disabled' : '';
                  return `
                    <label style="display:flex; align-items:center; gap:12px; font-size:16px; color:var(--text-secondary); cursor:pointer;">
                      <input type="checkbox" style="width:22px; height:22px; cursor:pointer;" ${checked ? 'checked' : ''} ${disabled} onchange="PAGE_ENABLEMENT.toggleFramework('${_selectedUser}', '${s}', this.checked)">
                      <span>${s}</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Column 3: Follow-up -->
            <div>
              <h3 style="font-size:15px; font-weight:500; color:var(--accent); font-family:var(--font-ui); margin-bottom:14px; display:flex; align-items:center; gap:6px;">
                <span style="display:inline-block; width:15px; height:15px;">${ICONS.refs}</span> FOLLOW-UP / MESSAGING CHANNELS
              </h3>
              <div style="display:flex; flex-direction:column; gap:12px;">
                ${FOLLOW_UP_ITEMS.map(item => {
                  const checked = data.followup[_selectedUser]?.[item.id] || false;
                  const disabled = (!isSuperAdmin && currentUser !== _selectedUser) ? 'disabled' : '';
                  return `
                    <label style="display:flex; align-items:center; gap:12px; font-size:16px; color:var(--text-secondary); cursor:pointer;">
                      <input type="checkbox" style="width:22px; height:22px; cursor:pointer;" ${checked ? 'checked' : ''} ${disabled} onchange="PAGE_ENABLEMENT.toggleFollowup('${_selectedUser}', '${item.id}', this.checked)">
                      <span>${item.label}</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- Row 2: Training Material Adoption -->
          <div style="margin-top:16px;">
            <h3 style="font-size:15px; font-weight:500; color:var(--accent); font-family:var(--font-ui); margin-bottom:14px; display:flex; align-items:center; gap:6px;">
              <span style="display:inline-block; width:15px; height:15px;">${ICONS.docs}</span> TRAINING MATERIAL ADOPTION
            </h3>
            <div style="width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;">
              <table class="table" style="width:100%; min-width: 500px; border-collapse:collapse; font-size:15px; text-align:left;">
                <thead>
                  <tr style="border-bottom:1px solid var(--border-default); color:var(--text-secondary);">
                    <th style="padding:12px 10px; width:40%;">Material</th>
                    <th style="padding:12px 10px; text-align:center; width:20%;">Reviewed</th>
                    <th style="padding:12px 10px; text-align:center; width:20%;">Implemented</th>
                    <th style="padding:12px 10px; text-align:center; width:20%;">Verified</th>
                  </tr>
                </thead>
                <tbody>
                  ${STORE.getByTypes(['training', 'process-doc', 'template']).map(doc => {
                    const task = data.tasks[_selectedUser]?.[doc.id] || { reviewed: false, implemented: false, verified: false };
                    const disabledSelf = (!isSuperAdmin && currentUser !== _selectedUser) ? 'disabled' : '';
                    const disabledManager = !isSuperAdmin ? 'disabled' : '';

                    return `
                      <tr style="border-bottom:1px solid var(--border-subtle); color:var(--text-primary);">
                        <td style="padding:14px 10px;">
                          <span style="font-weight:600; font-size:16px;">${doc.title}</span>
                          <div style="font-size:12px; color:var(--text-tertiary); font-family:var(--font-mono);">${doc.asset_type.toUpperCase()}</div>
                        </td>
                        <td style="padding:14px 10px; text-align:center;">
                          <input type="checkbox" style="width:22px; height:22px; cursor:pointer;" ${task.reviewed ? 'checked' : ''} ${disabledSelf} onchange="PAGE_ENABLEMENT.updateTask('${_selectedUser}', '${doc.id}', 'reviewed', this.checked)">
                        </td>
                        <td style="padding:14px 10px; text-align:center;">
                          <input type="checkbox" style="width:22px; height:22px; cursor:pointer;" ${task.implemented ? 'checked' : ''} ${disabledSelf} onchange="PAGE_ENABLEMENT.updateTask('${_selectedUser}', '${doc.id}', 'implemented', this.checked)">
                        </td>
                        <td style="padding:14px 10px; text-align:center;">
                          <input type="checkbox" style="width:22px; height:22px; cursor:pointer;" ${task.verified ? 'checked' : ''} ${disabledManager} onchange="PAGE_ENABLEMENT.updateTask('${_selectedUser}', '${doc.id}', 'verified', this.checked)">
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function selectUser(user) {
    _selectedUser = user;
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function togglePrep(user, stage, value) {
    const data = getTrackerData();
    if (!data.prep[user]) data.prep[user] = {};
    data.prep[user][stage] = value;
    saveTrackerData(data);
    selectUser(user);
  }

  function toggleFramework(user, stage, value) {
    const data = getTrackerData();
    if (!data.framework[user]) data.framework[user] = {};
    data.framework[user][stage] = value;
    saveTrackerData(data);
    selectUser(user);
  }

  function toggleFollowup(user, itemId, value) {
    const data = getTrackerData();
    if (!data.followup[user]) data.followup[user] = {};
    data.followup[user][itemId] = value;
    saveTrackerData(data);
    selectUser(user);
  }

  function updateTask(user, docId, stateKey, value) {
    const data = getTrackerData();
    if (!data.tasks[user]) data.tasks[user] = {};
    if (!data.tasks[user][docId]) {
      data.tasks[user][docId] = { reviewed: false, implemented: false, verified: false };
    }
    data.tasks[user][docId][stateKey] = value;
    saveTrackerData(data);
    selectUser(user);
  }

  return {
    render,
    selectUser,
    togglePrep,
    toggleFramework,
    toggleFollowup,
    updateTask,
    addNewMaterialTask
  };
})();

window.PAGE_ENABLEMENT = PAGE_ENABLEMENT;
