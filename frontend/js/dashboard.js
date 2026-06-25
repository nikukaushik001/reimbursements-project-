/**
 * dashboard.js — Role-Based Dashboard Rendering
 *
 * Builds the dashboard UI dynamically based on the logged-in user's role.
 * Each role sees different sections and data.
 */

// ── Init Dashboard ─────────────────────────────────────────────────────────

function initDashboard() {
  const user = getCurrentUser();
  if (!user) return;

  // Set user info in sidebar
  $('#user-name').textContent = user.name;
  $('#user-email').textContent = user.email;
  $('#user-role-badge').innerHTML = roleBadge(user.role);

  // Set up sidebar nav based on role
  buildSidebar(user.role);

  // Load default section
  loadDefaultSection(user.role);

  // Logout button
  $('#logout-btn').addEventListener('click', handleLogout);
}

// ── Sidebar Navigation ────────────────────────────────────────────────────

function buildSidebar(role) {
  const nav = $('#sidebar-nav');
  nav.innerHTML = '';

  const sections = getSectionsForRole(role);

  sections.forEach((section, i) => {
    const link = document.createElement('a');
    link.href = '#';
    link.className = `nav-link${i === 0 ? ' active' : ''}`;
    link.dataset.section = section.id;
    link.innerHTML = `<span class="nav-icon">${section.icon}</span>${section.label}`;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      // Update active state
      $$('.nav-link').forEach((l) => l.classList.remove('active'));
      link.classList.add('active');
      // Show section
      showSection(section.id);
    });
    nav.appendChild(link);
  });
}

function getSectionsForRole(role) {
  const all = {
    'create-reimbursement': { id: 'create-reimbursement', icon: '➕', label: 'New Request' },
    'my-reimbursements': { id: 'my-reimbursements', icon: '📋', label: 'My Requests' },
    'pending-approvals': { id: 'pending-approvals', icon: '⏳', label: 'Pending Approvals' },
    'employee-list': { id: 'employee-list', icon: '👥', label: 'Employees' },
    'assign-role': { id: 'assign-role', icon: '🔑', label: 'Assign Role' },
    'assign-employee': { id: 'assign-employee', icon: '🔗', label: 'Assign EMP → RM' },
  };

  switch (role) {
    case 'EMP':
      return [all['create-reimbursement'], all['my-reimbursements']];
    case 'RM':
      return [all['pending-approvals'], all['employee-list']];
    case 'APE':
      return [all['pending-approvals'], all['employee-list']];
    case 'CFO':
      return [
        all['pending-approvals'],
        all['employee-list'],
        all['assign-role'],
        all['assign-employee'],
      ];
    default:
      return [];
  }
}

function loadDefaultSection(role) {
  const sections = getSectionsForRole(role);
  if (sections.length > 0) {
    showSection(sections[0].id);
  }
}

// ── Section Router ─────────────────────────────────────────────────────────

function showSection(sectionId) {
  const content = $('#dashboard-content');

  // Fade out
  content.classList.add('fade-out');

  setTimeout(() => {
    switch (sectionId) {
      case 'create-reimbursement':
        renderCreateReimbursement(content);
        break;
      case 'my-reimbursements':
        renderMyReimbursements(content);
        break;
      case 'pending-approvals':
        renderPendingApprovals(content);
        break;
      case 'employee-list':
        renderEmployeeList(content);
        break;
      case 'assign-role':
        renderAssignRole(content);
        break;
      case 'assign-employee':
        renderAssignEmployee(content);
        break;
    }
    // Fade in
    content.classList.remove('fade-out');
    content.classList.add('fade-in');
    setTimeout(() => content.classList.remove('fade-in'), 300);
  }, 200);
}

// ── Section: Create Reimbursement ──────────────────────────────────────────

function renderCreateReimbursement(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2>Create Reimbursement Request</h2>
      <p class="section-desc">Submit a new expense claim for approval</p>
    </div>
    <div class="glass-card form-card">
      <form id="create-reimbursement-form">
        <div class="form-group">
          <label for="reimb-title">Title</label>
          <input type="text" id="reimb-title" placeholder="e.g. Client dinner — Mumbai trip" required>
        </div>
        <div class="form-group">
          <label for="reimb-description">Description</label>
          <textarea id="reimb-description" rows="3" placeholder="Detailed justification..." required></textarea>
        </div>
        <div class="form-group">
          <label for="reimb-amount">Amount (₹)</label>
          <input type="number" id="reimb-amount" placeholder="12500.00" step="0.01" min="1" required>
        </div>
        <button type="submit" class="btn btn-primary btn-full">Submit Request</button>
      </form>
    </div>
  `;

  $('#create-reimbursement-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const title = $('#reimb-title').value.trim();
    const description = $('#reimb-description').value.trim();
    const amount = $('#reimb-amount').value;

    setLoading(btn, true);
    try {
      await apiCreateReimbursement(title, description, Number(amount));
      showToast('Reimbursement request submitted!', 'success');
      e.target.reset();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(btn, false);
    }
  });
}

// ── Section: My Reimbursements ─────────────────────────────────────────────

async function renderMyReimbursements(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2>My Reimbursement Requests</h2>
      <p class="section-desc">Track the status of your expense claims</p>
    </div>
    <div class="glass-card table-card">
      <div class="table-loading"><span class="spinner"></span> Loading...</div>
    </div>
  `;

  try {
    const res = await apiGetReimbursements();
    const items = res.data.reimbursements || [];

    const card = container.querySelector('.table-card');

    if (items.length === 0) {
      card.innerHTML = '<div class="empty-state">📭 No reimbursement requests yet.</div>';
      return;
    }

    card.innerHTML = `
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Amount</th>
              <th>Status</th>
              <th>RM</th>
              <th>APE</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((r) => `
              <tr>
                <td>
                  <div class="cell-title">${r.title}</div>
                  <div class="cell-desc">${r.description || ''}</div>
                </td>
                <td class="cell-amount">${formatCurrency(r.amount)}</td>
                <td>${statusBadge(r.status)}</td>
                <td>${r.rmApproved ? '✅' : '⏳'}</td>
                <td>${r.apeApproved ? '✅' : '⏳'}</td>
                <td class="cell-date">${formatDate(r.createdAt)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.querySelector('.table-card').innerHTML =
      `<div class="empty-state error-state">❌ ${err.message}</div>`;
  }
}

// ── Section: Pending Approvals ─────────────────────────────────────────────

async function renderPendingApprovals(container) {
  const user = getCurrentUser();
  container.innerHTML = `
    <div class="section-header">
      <h2>Pending Approvals</h2>
      <p class="section-desc">Review and approve/reject reimbursement requests</p>
    </div>
    <div class="glass-card table-card">
      <div class="table-loading"><span class="spinner"></span> Loading...</div>
    </div>
  `;

  try {
    const res = await apiGetReimbursements();
    const items = res.data.reimbursements || [];

    const card = container.querySelector('.table-card');

    if (items.length === 0) {
      card.innerHTML = '<div class="empty-state">✅ No pending approvals. All clear!</div>';
      return;
    }

    card.innerHTML = `
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Title</th>
              <th>Amount</th>
              <th>Status</th>
              <th>RM</th>
              <th>APE</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((r) => `
              <tr>
                <td class="cell-user-id" title="${r.userId}">${r.userId.substring(0, 8)}...</td>
                <td>
                  <div class="cell-title">${r.title}</div>
                  <div class="cell-desc">${r.description || ''}</div>
                </td>
                <td class="cell-amount">${formatCurrency(r.amount)}</td>
                <td>${statusBadge(r.status)}</td>
                <td>${r.rmApproved ? '✅' : '⏳'}</td>
                <td>${r.apeApproved ? '✅' : '⏳'}</td>
                <td class="cell-date">${formatDate(r.createdAt)}</td>
                <td class="cell-actions">
                  <button class="btn btn-approve btn-sm" data-user-id="${r.userId}" data-action="APPROVED">
                    Approve
                  </button>
                  <button class="btn btn-reject btn-sm" data-user-id="${r.userId}" data-action="REJECTED">
                    Reject
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Attach action handlers
    card.querySelectorAll('.btn-approve, .btn-reject').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const userId = btn.dataset.userId;
        const action = btn.dataset.action;
        setLoading(btn, true);
        try {
          await apiUpdateReimbursement(userId, action);
          showToast(
            action === 'APPROVED' ? 'Reimbursement approved!' : 'Reimbursement rejected.',
            action === 'APPROVED' ? 'success' : 'info'
          );
          // Refresh
          renderPendingApprovals(container);
        } catch (err) {
          showToast(err.message, 'error');
          setLoading(btn, false);
        }
      });
    });
  } catch (err) {
    container.querySelector('.table-card').innerHTML =
      `<div class="empty-state error-state">❌ ${err.message}</div>`;
  }
}

// ── Section: Employee List ─────────────────────────────────────────────────

async function renderEmployeeList(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2>Employee Directory</h2>
      <p class="section-desc">View employees based on your role access</p>
    </div>
    <div class="glass-card table-card">
      <div class="table-loading"><span class="spinner"></span> Loading...</div>
    </div>
  `;

  try {
    const res = await apiGetEmployees();
    const users = res.data.users || [];

    const card = container.querySelector('.table-card');

    if (users.length === 0) {
      card.innerHTML = '<div class="empty-state">👤 No employees found.</div>';
      return;
    }

    card.innerHTML = `
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>User ID</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            ${users.map((u) => `
              <tr>
                <td class="cell-name">${u.name}</td>
                <td>${u.email}</td>
                <td>${roleBadge(u.role)}</td>
                <td class="cell-user-id" title="${u.userId}">
                  <span class="copy-id" onclick="navigator.clipboard.writeText('${u.userId}');showToast('User ID copied!','info')">
                    ${u.userId.substring(0, 8)}... 📋
                  </span>
                </td>
                <td class="cell-date">${formatDate(u.createdAt)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.querySelector('.table-card').innerHTML =
      `<div class="empty-state error-state">❌ ${err.message}</div>`;
  }
}

// ── Section: Assign Role (CFO only) ────────────────────────────────────────

function renderAssignRole(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2>Assign Role</h2>
      <p class="section-desc">Change a user's role (CFO only)</p>
    </div>
    <div class="glass-card form-card">
      <form id="assign-role-form">
        <div class="form-group">
          <label for="role-user-id">User ID (UUID)</label>
          <input type="text" id="role-user-id" placeholder="Paste user UUID here" required>
        </div>
        <div class="form-group">
          <label for="role-select">New Role</label>
          <select id="role-select" required>
            <option value="">Select a role...</option>
            <option value="EMP">EMP — Employee</option>
            <option value="RM">RM — Reporting Manager</option>
            <option value="APE">APE — Accounts Payable</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary btn-full">Assign Role</button>
      </form>
    </div>
  `;

  $('#assign-role-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const userId = $('#role-user-id').value.trim();
    const role = $('#role-select').value;

    setLoading(btn, true);
    try {
      const res = await apiAssignRole(userId, role);
      showToast(`Role updated to ${role} for ${res.data.user.name}!`, 'success');
      e.target.reset();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(btn, false);
    }
  });
}

// ── Section: Assign Employee to RM (CFO only) ─────────────────────────────

function renderAssignEmployee(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2>Assign Employee to RM</h2>
      <p class="section-desc">Link an employee to their reporting manager</p>
    </div>
    <div class="glass-card form-card">
      <form id="assign-emp-form">
        <div class="form-group">
          <label for="emp-user-id">Employee User ID (UUID)</label>
          <input type="text" id="emp-user-id" placeholder="Paste EMP's UUID" required>
        </div>
        <div class="form-group">
          <label for="rm-user-id">RM User ID (UUID)</label>
          <input type="text" id="rm-user-id" placeholder="Paste RM's UUID" required>
        </div>
        <button type="submit" class="btn btn-primary btn-full">Assign</button>
      </form>
    </div>

    <div class="glass-card form-card" style="margin-top: 1.5rem;">
      <h3 class="card-subtitle">Remove Assignment</h3>
      <form id="remove-emp-form">
        <div class="form-group">
          <label for="remove-emp-user-id">Employee User ID (UUID)</label>
          <input type="text" id="remove-emp-user-id" placeholder="Paste EMP's UUID" required>
        </div>
        <div class="form-group">
          <label for="remove-rm-user-id">RM User ID (UUID)</label>
          <input type="text" id="remove-rm-user-id" placeholder="Paste RM's UUID" required>
        </div>
        <button type="submit" class="btn btn-danger btn-full">Remove Assignment</button>
      </form>
    </div>
  `;

  $('#assign-emp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const empId = $('#emp-user-id').value.trim();
    const rmId = $('#rm-user-id').value.trim();

    setLoading(btn, true);
    try {
      await apiAssignEmployee(empId, rmId);
      showToast('Employee assigned to RM!', 'success');
      e.target.reset();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(btn, false);
    }
  });

  $('#remove-emp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const empId = $('#remove-emp-user-id').value.trim();
    const rmId = $('#remove-rm-user-id').value.trim();

    setLoading(btn, true);
    try {
      await apiRemoveAssignment(empId, rmId);
      showToast('Assignment removed.', 'info');
      e.target.reset();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(btn, false);
    }
  });
}
