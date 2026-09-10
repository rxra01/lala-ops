/**
 * Lala Ops — Application Controller & View Orchestrator
 * Implements PRD Section 5, 10, 11, 12, 13, 14, 15, 18
 */

class LalaOpsApp {
  constructor() {
    this.currentView = 'dashboard';
    this.currentTaskId = 'TASK-1042'; // Default hero task
    this.selectedRequestId = 'REQ-201';
    this.dashboardFilter = 'all';
    this.requestsFilter = 'all';
    this.pendingAiSuggestion = null;
    this.pendingRawRequestData = null;

    this.init();
  }

  init() {
    // 1. Subscribe to Database Changes
    window.lalaDb.subscribe(() => {
      this.render();
    });

    // 2. Hash Routing
    window.addEventListener('hashchange', () => this.handleRoute());
    
    // 3. Command Palette Keyboard Shortcut
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.openCommandPalette();
      }
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });

    // Initial route handling and render
    this.handleRoute();
    this.render();
  }

  // ================= ROUTING & NAVIGATION =================
  handleRoute() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    const [route, queryString] = hash.split('?');
    
    if (queryString) {
      const params = new URLSearchParams(queryString);
      if (params.get('id')) {
        this.currentTaskId = params.get('id');
      }
    }

    this.currentView = route || 'dashboard';
    this.updateActiveNav();
    this.showView(this.currentView);
  }

  navigateTo(route, params = {}) {
    let hash = `#${route}`;
    const keys = Object.keys(params);
    if (keys.length > 0) {
      const qs = new URLSearchParams(params).toString();
      hash += `?${qs}`;
    }
    window.location.hash = hash;
  }

  updateActiveNav() {
    const navItems = ['dashboard', 'requests', 'my-work', 'task-details'];
    navItems.forEach(item => {
      const el = document.getElementById(`nav-${item}`);
      if (!el) return;
      if (this.currentView === item || (item === 'requests' && this.currentView === 'requests-inbox')) {
        el.className = 'h-full flex items-center gap-1.5 px-1 font-bold text-[14px] text-primary border-b-2 border-primary transition-colors';
      } else {
        el.className = 'h-full flex items-center gap-1.5 px-1 font-medium text-[14px] text-secondary hover:text-on-surface border-b-2 border-transparent transition-colors';
      }
    });
  }

  showView(viewName) {
    document.querySelectorAll('.app-view').forEach(v => v.classList.add('hidden'));
    
    const targetId = `view-${viewName === 'requests-inbox' ? 'requests' : viewName}`;
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.classList.remove('hidden');
    } else {
      document.getElementById('view-dashboard').classList.remove('hidden');
    }

    window.scrollTo(0, 0);
  }

  // ================= USER & ROLE SWITCHING =================
  switchUser(userId) {
    window.lalaDb.setCurrentUser(userId);
    this.closeAllDropdowns();
    
    const user = window.lalaDb.getCurrentUser();
    
    // If switching to employee, navigate to My Work by default
    if (user.role === 'employee' && this.currentView === 'dashboard') {
      this.navigateTo('my-work');
    } else if (user.role === 'manager' && this.currentView === 'my-work') {
      this.navigateTo('dashboard');
    }

    this.render();
  }

  loginAs(userId) {
    this.switchUser(userId);
    const user = window.lalaDb.getCurrentUser();
    if (user.role === 'employee') {
      this.navigateTo('my-work');
    } else {
      this.navigateTo('dashboard');
    }
  }

  // ================= MAIN RENDER PIPELINE =================
  render() {
    this.renderHeader();
    this.renderDashboard();
    this.renderRequests();
    this.renderMyWork();
    this.renderTaskDetails();
    this.renderNotifications();
  }

  renderHeader() {
    const user = window.lalaDb.getCurrentUser();
    const avatarEl = document.getElementById('userAvatarImg');
    const nameEl = document.getElementById('userNameText');
    const roleEl = document.getElementById('userRoleText');

    if (avatarEl) avatarEl.src = user.avatar;
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.title;

    // Badges
    const pendingReqCount = window.lalaDb.getRequests('pending').length;
    const navReqBadge = document.getElementById('navRequestsBadge');
    if (navReqBadge) {
      navReqBadge.textContent = `${pendingReqCount} New`;
    }

    const myWorkCount = window.lalaDb.getTasks({ assigneeId: user.id }).filter(t => t.status !== 'done').length;
    const navMyWorkBadge = document.getElementById('navMyWorkBadge');
    if (navMyWorkBadge) {
      navMyWorkBadge.textContent = myWorkCount;
    }

    const unreadNotifs = window.lalaDb.getUnreadNotificationsCount();
    const notifBadge = document.getElementById('notifBadge');
    if (notifBadge) {
      if (unreadNotifs > 0) {
        notifBadge.textContent = unreadNotifs;
        notifBadge.classList.remove('hidden');
      } else {
        notifBadge.classList.add('hidden');
      }
    }
  }

  // ================= 1. DASHBOARD VIEW =================
  renderDashboard() {
    const buckets = window.lalaDb.get4VisibilityBuckets();
    
    // Bucket 1: Waiting for Us
    const b1Count = document.getElementById('bucketWaitingForUsCount');
    if (b1Count) b1Count.textContent = buckets.waitingForUs.length;
    const b1Sub = document.getElementById('bucketWaitingForUsSubtitle');
    if (b1Sub) {
      const untriaged = buckets.waitingForUs.filter(t => t.status === 'new_request').length;
      b1Sub.textContent = `${untriaged} untriaged`;
    }

    // Bucket 2: Waiting for Client
    const b2Count = document.getElementById('bucketWaitingForClientCount');
    if (b2Count) b2Count.textContent = buckets.waitingForClient.length;

    // Bucket 3: Unassigned
    const b3Count = document.getElementById('bucketUnassignedCount');
    if (b3Count) b3Count.textContent = buckets.unassigned.length;

    // Bucket 4: Overdue
    const b4Count = document.getElementById('bucketOverdueCount');
    if (b4Count) b4Count.textContent = buckets.overdue.length;

    // Filter counts in tabs
    const countAll = document.getElementById('dashFilterCountAll');
    if (countAll) countAll.textContent = window.lalaDb.getTasks().length;
    const countUs = document.getElementById('dashFilterCountUs');
    if (countUs) countUs.textContent = buckets.waitingForUs.length;
    const countClient = document.getElementById('dashFilterCountClient');
    if (countClient) countClient.textContent = buckets.waitingForClient.length;
    const countUnassigned = document.getElementById('dashFilterCountUnassigned');
    if (countUnassigned) countUnassigned.textContent = buckets.unassigned.length;

    // Filter tasks for table
    let tasksToRender = [];
    if (this.dashboardFilter === 'all') {
      tasksToRender = window.lalaDb.getTasks();
    } else if (this.dashboardFilter === 'waiting_for_us') {
      tasksToRender = buckets.waitingForUs;
    } else if (this.dashboardFilter === 'waiting_for_client') {
      tasksToRender = buckets.waitingForClient;
    } else if (this.dashboardFilter === 'unassigned') {
      tasksToRender = buckets.unassigned;
    } else if (this.dashboardFilter === 'overdue') {
      tasksToRender = buckets.overdue;
    }

    // Apply search if present
    const searchVal = (document.getElementById('dashSearchInput')?.value || '').toLowerCase();
    if (searchVal) {
      tasksToRender = tasksToRender.filter(t => 
        t.title.toLowerCase().includes(searchVal) ||
        (t.customer && t.customer.toLowerCase().includes(searchVal)) ||
        t.id.toLowerCase().includes(searchVal)
      );
    }

    const tbody = document.getElementById('dashboardTasksTableBody');
    const emptyState = document.getElementById('dashEmptyState');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (tasksToRender.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
    } else {
      if (emptyState) emptyState.classList.add('hidden');
      tasksToRender.forEach(task => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-surface-container-low/50 transition-colors cursor-pointer group';
        tr.onclick = (e) => {
          if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SELECT') {
            this.navigateTo('task-details', { id: task.id });
          }
        };

        const statusBadge = this.renderStatusBadge(task.status, task.waitingOnClientSince);
        const priorityBadge = this.renderPriorityBadge(task.priority);
        const isOverdue = buckets.overdue.some(o => o.id === task.id);

        tr.innerHTML = `
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <span class="font-mono text-[11px] font-semibold text-secondary px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/30">${task.id}</span>
              <span class="font-medium text-on-surface hover:text-primary transition-colors line-clamp-1">${task.title}</span>
              ${isOverdue ? '<span class="px-1.5 py-0.2 rounded bg-red-100 text-red-800 text-[10px] font-bold uppercase font-mono">SLA Breach</span>' : ''}
            </div>
          </td>
          <td class="px-3 py-3 font-medium text-slate-700">${task.customer || '<span class="text-secondary">—</span>'}</td>
          <td class="px-3 py-3 text-secondary text-[12px]">${task.category}</td>
          <td class="px-3 py-3">${priorityBadge}</td>
          <td class="px-3 py-3">${statusBadge}</td>
          <td class="px-3 py-3">
            ${task.assigneeName ? `
              <div class="flex items-center gap-1.5">
                <span class="w-6 h-6 rounded-full bg-primary-container text-white text-[10px] font-bold flex items-center justify-center">${task.assigneeName.slice(0, 2).toUpperCase()}</span>
                <span class="text-[12px] text-on-surface font-medium">${task.assigneeName}</span>
              </div>
            ` : `
              <button type="button" onclick="event.stopPropagation(); window.lalaApp.quickAssignModal('${task.id}')" class="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-semibold hover:bg-sky-100 transition-colors">
                + Assign
              </button>
            `}
          </td>
          <td class="px-3 py-3 text-right">
            <button type="button" onclick="event.stopPropagation(); window.lalaApp.navigateTo('task-details', { id: '${task.id}' })" class="h-7 px-2.5 rounded bg-surface-container-high hover:bg-primary hover:text-white text-secondary text-[11px] font-semibold transition-all">
              Details →
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Team Workload List
    const workloadList = document.getElementById('teamWorkloadList');
    if (workloadList) {
      const employees = window.lalaDb.getUsers().filter(u => u.role === 'employee').slice(0, 5);
      const allTasks = window.lalaDb.getTasks();
      workloadList.innerHTML = employees.map(emp => {
        const empTasks = allTasks.filter(t => t.assigneeId === emp.id && t.status !== 'done');
        const count = empTasks.length;
        const maxTasks = 5;
        const pct = Math.min(100, Math.round((count / maxTasks) * 100));
        return `
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between text-[12px]">
              <span class="font-medium text-on-surface">${emp.name}</span>
              <span class="font-mono text-secondary">${count} active</span>
            </div>
            <div class="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
              <div class="h-full rounded-full ${count > 3 ? 'bg-amber-500' : 'bg-primary'}" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Priority Breakdown
    const priorityBars = document.getElementById('priorityBreakdownBars');
    if (priorityBars) {
      const allTasks = window.lalaDb.getTasks().filter(t => t.status !== 'done');
      const total = allTasks.length || 1;
      const counts = {
        urgent: allTasks.filter(t => t.priority === 'urgent').length,
        high: allTasks.filter(t => t.priority === 'high').length,
        medium: allTasks.filter(t => t.priority === 'medium').length,
        low: allTasks.filter(t => t.priority === 'low').length
      };
      priorityBars.innerHTML = `
        <div class="flex items-center justify-between text-[12px]">
          <span class="text-rose-700 font-medium">Urgent</span>
          <span class="font-mono font-semibold">${counts.urgent} (${Math.round((counts.urgent/total)*100)}%)</span>
        </div>
        <div class="flex items-center justify-between text-[12px]">
          <span class="text-amber-700 font-medium">High</span>
          <span class="font-mono font-semibold">${counts.high} (${Math.round((counts.high/total)*100)}%)</span>
        </div>
        <div class="flex items-center justify-between text-[12px]">
          <span class="text-indigo-700 font-medium">Medium</span>
          <span class="font-mono font-semibold">${counts.medium} (${Math.round((counts.medium/total)*100)}%)</span>
        </div>
        <div class="flex items-center justify-between text-[12px]">
          <span class="text-slate-600 font-medium">Low</span>
          <span class="font-mono font-semibold">${counts.low} (${Math.round((counts.low/total)*100)}%)</span>
        </div>
      `;
    }

    // Follow-up Alerts
    const alertsList = document.getElementById('followupAlertsList');
    if (alertsList) {
      const approaching = window.lalaDb.getTasks().filter(t => {
        if (t.status === 'done' || t.status === 'waiting_on_client' || t.status === 'needs_clarification') return false;
        return !!t.followUpDate;
      }).slice(0, 3);
      alertsList.innerHTML = approaching.map(t => `
        <div class="p-2 rounded bg-surface-container-low flex items-start justify-between gap-2">
          <div class="flex flex-col">
            <span class="font-medium text-on-surface line-clamp-1">${t.title}</span>
            <span class="text-[11px] text-secondary">Follow-up: ${t.followUpDate}</span>
          </div>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-primary-subdued text-primary font-mono font-bold">Soon</span>
        </div>
      `).join('');
    }
  }

  filterDashboard(filter) {
    this.dashboardFilter = filter;
    document.querySelectorAll('.dash-filter-btn').forEach(btn => {
      btn.className = 'dash-filter-btn px-3 py-1 rounded-lg text-[13px] font-medium text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors';
    });
    this.renderDashboard();
  }

  searchDashboard(val) {
    this.renderDashboard();
  }

  // ================= 2. REQUESTS INBOX VIEW =================
  renderRequests() {
    const requests = window.lalaDb.getRequests(this.requestsFilter);
    const container = document.getElementById('requestsListContainer');
    if (!container) return;

    // Counts
    const all = window.lalaDb.getRequests();
    const cAll = document.getElementById('reqCountAll');
    if (cAll) cAll.textContent = all.length;
    const cPending = document.getElementById('reqCountPending');
    if (cPending) cPending.textContent = all.filter(r => r.aiStatus === 'pending' || !r.convertedTaskId).length;
    const cConv = document.getElementById('reqCountConverted');
    if (cConv) cConv.textContent = all.filter(r => !!r.convertedTaskId).length;

    container.innerHTML = '';
    requests.forEach(req => {
      const isSelected = req.id === this.selectedRequestId;
      const card = document.createElement('div');
      card.className = `p-4 rounded-xl bg-surface-container-lowest border ${isSelected ? 'border-primary shadow-md ring-1 ring-primary/30' : 'border-outline-variant/40 shadow-xs hover:border-outline-variant/80'} transition-all cursor-pointer`;
      card.onclick = () => {
        this.selectedRequestId = req.id;
        this.renderRequests();
      };

      const channelClass = req.sourceChannel === 'WhatsApp' ? 'channel-whatsapp' : req.sourceChannel === 'Email' ? 'channel-email' : 'channel-chat';

      card.innerHTML = `
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="channel-tag ${channelClass}">
              <span class="material-symbols-outlined text-[13px]">${req.sourceChannel === 'WhatsApp' ? 'chat' : req.sourceChannel === 'Email' ? 'mail' : 'forum'}</span>
              ${req.sourceChannel}
            </span>
            <span class="font-mono text-[11px] text-secondary font-semibold">${req.id}</span>
          </div>
          <span class="text-[11px] text-secondary font-mono">${req.aiConfidence ? `${Math.round(req.aiConfidence * 100)}% Conf` : 'Pending'}</span>
        </div>

        <p class="text-[13px] text-on-surface font-medium line-clamp-2 mt-2 leading-snug">
          ${req.rawText}
        </p>

        <div class="mt-3 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-secondary">
          <span>By: ${req.createdByName}</span>
          ${req.convertedTaskId ? `
            <span class="font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              → ${req.convertedTaskId}
            </span>
          ` : `
            <span class="font-mono text-primary font-bold">Review AI Suggestion →</span>
          `}
        </div>
      `;
      container.appendChild(card);
    });

    // Render Right Inspection Pane
    this.renderRequestInspection();
  }

  renderRequestInspection() {
    const pane = document.getElementById('requestInspectionPane');
    if (!pane) return;

    const req = window.lalaDb.getRequest(this.selectedRequestId);
    if (!req) {
      pane.innerHTML = `
        <div class="p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/40 text-secondary">
          <span class="material-symbols-outlined text-[36px]">mark_email_read</span>
          <p class="mt-2 text-[14px]">Select a request from the left stream to inspect AI extraction details.</p>
        </div>
      `;
      return;
    }

    const ai = req.aiSuggestion || {};
    const hasConverted = !!req.convertedTaskId;

    pane.innerHTML = `
      <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/40 shadow-xs flex flex-col gap-5">
        <div class="flex items-center justify-between pb-3 border-b border-outline-variant/30">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-bold text-on-surface">${ai.title || 'Extracted Task Suggestion'}</h2>
              <span class="font-mono text-[11px] px-1.5 py-0.5 rounded bg-surface-container text-secondary font-semibold">${req.id}</span>
            </div>
            <p class="text-[12px] text-secondary mt-0.5">Ingested via ${req.sourceChannel} from ${req.createdByName}</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-full font-mono text-[11px] font-bold bg-primary-subdued text-primary">
              ${req.aiConfidence ? `${Math.round(req.aiConfidence * 100)}% Confidence` : 'Pending'}
            </span>
          </div>
        </div>

        <!-- Raw Text Preview Box -->
        <div>
          <span class="text-[11px] font-mono uppercase tracking-wider text-secondary font-semibold">Source Message Text</span>
          <div class="mt-1 p-3 rounded-lg bg-surface-container-low text-[13px] text-slate-800 font-mono border border-outline-variant/30 whitespace-pre-wrap leading-relaxed">
            ${req.rawText}
          </div>
        </div>

        <!-- Extracted Fields Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
          <div class="p-3 rounded-lg bg-surface border border-outline-variant/30">
            <span class="text-[11px] text-secondary font-semibold block mb-0.5">Customer / Account</span>
            <span class="font-semibold text-on-surface">${ai.customer || '<span class="text-secondary italic">Not specified</span>'}</span>
          </div>

          <div class="p-3 rounded-lg bg-surface border border-outline-variant/30">
            <span class="text-[11px] text-secondary font-semibold block mb-0.5">Inferred Category</span>
            <span class="font-semibold text-on-surface">${ai.category || 'General'}</span>
          </div>

          <div class="p-3 rounded-lg bg-surface border border-outline-variant/30">
            <span class="text-[11px] text-secondary font-semibold block mb-0.5">Calculated Priority</span>
            <span class="font-semibold text-on-surface">${ai.priority || 'Medium'}</span>
          </div>

          <div class="p-3 rounded-lg bg-surface border border-outline-variant/30">
            <span class="text-[11px] text-secondary font-semibold block mb-0.5">Recommended Assignee</span>
            <span class="font-semibold text-on-surface">${ai.suggestedAssigneeName || 'Unassigned (Triage in Ready to Assign)'}</span>
          </div>
        </div>

        <!-- Required Technical Action -->
        <div class="p-3 rounded-lg bg-surface border border-outline-variant/30 text-[13px]">
          <span class="text-[11px] text-secondary font-semibold block mb-1">Required Next Action</span>
          <p class="text-slate-700">${ai.requiredAction || 'Clarify or review with client.'}</p>
        </div>

        <!-- Key Entity Chips -->
        <div>
          <span class="text-[11px] font-mono uppercase tracking-wider text-secondary font-semibold block mb-1.5">Detected Entities</span>
          <div class="flex flex-wrap gap-1.5">
            ${(ai.keyEntities || []).map(k => `
              <span class="px-2 py-0.5 rounded bg-surface-container-high text-slate-800 text-[11px] font-mono border border-outline-variant/30">${k}</span>
            `).join('')}
          </div>
        </div>

        <!-- Actions -->
        <div class="pt-4 border-t border-outline-variant/30 flex items-center justify-between">
          ${hasConverted ? `
            <div class="flex items-center gap-2 text-[13px] text-emerald-700 font-semibold">
              <span class="material-symbols-outlined text-[20px]">check_circle</span>
              <span>Converted to Task: ${req.convertedTaskId}</span>
            </div>
            <button type="button" onclick="window.lalaApp.navigateTo('task-details', { id: '${req.convertedTaskId}' })" class="h-9 px-4 rounded-lg bg-primary text-on-primary text-[13px] font-semibold hover:bg-primary-hover">
              Open Task Details →
            </button>
          ` : `
            <button type="button" onclick="window.lalaApp.markRequestClarification('${req.id}')" class="h-9 px-3 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 text-[12px] font-semibold">
              Needs Clarification
            </button>
            <button type="button" onclick="window.lalaApp.openReviewModalForRequest('${req.id}')" class="h-9 px-4 rounded-lg bg-primary text-on-primary text-[13px] font-semibold hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-xs">
              <span>Review &amp; Create Task →</span>
            </button>
          `}
        </div>

      </div>
    `;
  }

  filterRequests(filter) {
    this.requestsFilter = filter;
    this.renderRequests();
  }

  // ================= 3. EMPLOYEE MY WORK VIEW =================
  renderMyWork() {
    const user = window.lalaDb.getCurrentUser();
    const myTasks = window.lalaDb.getTasks({ assigneeId: user.id });

    // Header greeting
    const greetTitle = document.getElementById('myWorkGreetingTitle');
    if (greetTitle) greetTitle.textContent = `Welcome back, ${user.name}`;
    const greetSub = document.getElementById('myWorkSubtitle');
    if (greetSub) greetSub.textContent = `${user.title} • Shift: ${user.shift || 'APAC-West (09:00 - 18:00 IST)'}`;
    const myWorkAvatar = document.getElementById('myWorkAvatar');
    if (myWorkAvatar) myWorkAvatar.src = user.avatar;

    // Categorized queues
    const nowDate = new Date();
    const dueToday = myTasks.filter(t => t.status !== 'done' && t.deadline && new Date(t.deadline).toDateString() === nowDate.toDateString());
    const inProgress = myTasks.filter(t => t.status === 'in_progress');
    const waitingClient = myTasks.filter(t => t.status === 'waiting_on_client');
    const completed = myTasks.filter(t => t.status === 'done');

    // KPI Counters
    const kpiDue = document.getElementById('myWorkDueTodayCount');
    if (kpiDue) kpiDue.textContent = dueToday.length;
    const kpiProg = document.getElementById('myWorkInProgressCount');
    if (kpiProg) kpiProg.textContent = inProgress.length;
    const kpiWait = document.getElementById('myWorkWaitingClientCount');
    if (kpiWait) kpiWait.textContent = waitingClient.length;
    const kpiDone = document.getElementById('myWorkCompletedCount');
    if (kpiDone) kpiDone.textContent = completed.length;

    // Section headers
    const cActive = document.getElementById('myWorkActiveListCount');
    if (cActive) cActive.textContent = `${inProgress.length} tasks`;
    const cWait = document.getElementById('myWorkWaitingListCount');
    if (cWait) cWait.textContent = `${waitingClient.length} tasks`;
    const cDone = document.getElementById('myWorkDoneListCount');
    if (cDone) cDone.textContent = `${completed.length} tasks`;

    // Active Tasks List
    const activeList = document.getElementById('myWorkActiveTasksList');
    if (activeList) {
      if (inProgress.length === 0) {
        activeList.innerHTML = '<div class="p-6 text-center text-secondary text-[13px]">No active tasks right now. Great job!</div>';
      } else {
        activeList.innerHTML = inProgress.map(task => this.renderEmployeeTaskRow(task)).join('');
      }
    }

    // Waiting on Client List
    const waitingList = document.getElementById('myWorkWaitingTasksList');
    if (waitingList) {
      if (waitingClient.length === 0) {
        waitingList.innerHTML = '<div class="p-6 text-center text-amber-800 text-[13px]">No tasks waiting on client input.</div>';
      } else {
        waitingList.innerHTML = waitingClient.map(task => this.renderEmployeeTaskRow(task, true)).join('');
      }
    }

    // Done List
    const doneList = document.getElementById('myWorkDoneTasksList');
    if (doneList) {
      if (completed.length === 0) {
        doneList.innerHTML = '<div class="p-6 text-center text-secondary text-[13px]">No completed tasks this sprint yet.</div>';
      } else {
        doneList.innerHTML = completed.map(task => this.renderEmployeeTaskRow(task)).join('');
      }
    }
  }

  renderEmployeeTaskRow(task, isWaitingClient = false) {
    const priorityBadge = this.renderPriorityBadge(task.priority);
    const statusBadge = this.renderStatusBadge(task.status, task.waitingOnClientSince);

    return `
      <div class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container-low/40 transition-colors">
        <div class="flex items-start gap-3">
          <div class="pt-0.5">
            <span class="font-mono text-[11px] font-semibold text-secondary px-1.5 py-0.5 rounded bg-surface-container">${task.id}</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <a href="#task-details?id=${task.id}" class="font-semibold text-on-surface hover:text-primary transition-colors text-[14px]">
                ${task.title}
              </a>
              ${priorityBadge}
            </div>
            <p class="text-[12px] text-secondary mt-0.5">
              Customer: <strong class="text-slate-800 font-medium">${task.customer || 'Internal'}</strong>
              <span class="mx-1.5">•</span>
              Deadline: <span class="font-mono">${task.deadline || 'Flexible'}</span>
            </p>
          </div>
        </div>

        <!-- Quick Inline Status Transitions (PRD Section 11) -->
        <div class="flex items-center gap-2 shrink-0">
          ${task.status === 'in_progress' ? `
            <button type="button" onclick="window.lalaApp.quickPauseForClient('${task.id}')" class="h-7 px-2.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-semibold transition-colors flex items-center gap-1" title="Pause SLA alerts while waiting on client">
              <span class="material-symbols-outlined text-[14px]">pause</span>
              <span>Wait on Client</span>
            </button>
            <button type="button" onclick="window.lalaApp.quickMarkDone('${task.id}')" class="h-7 px-2.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold transition-colors flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">check</span>
              <span>Mark Done</span>
            </button>
          ` : task.status === 'waiting_on_client' ? `
            <button type="button" onclick="window.lalaApp.quickResumeTask('${task.id}')" class="h-7 px-2.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold transition-colors flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">play_arrow</span>
              <span>Resume Work</span>
            </button>
          ` : `
            <span class="badge-status badge-done text-[11px]">Completed</span>
          `}
          <button type="button" onclick="window.lalaApp.navigateTo('task-details', { id: '${task.id}' })" class="h-7 px-2 rounded hover:bg-surface-container text-secondary text-[12px]">
            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    `;
  }

  // ================= 4. TASK DETAILS VIEW =================
  renderTaskDetails() {
    const task = window.lalaDb.getTask(this.currentTaskId);
    if (!task) return;

    // Breadcrumb
    const bcId = document.getElementById('tdBreadcrumbId');
    if (bcId) bcId.textContent = task.id;
    const bcTitle = document.getElementById('tdBreadcrumbTitle');
    if (bcTitle) bcTitle.textContent = task.title;

    // Header info
    const tdTitle = document.getElementById('tdTitle');
    if (tdTitle) tdTitle.textContent = task.title;
    const tdCustomer = document.getElementById('tdCustomer');
    if (tdCustomer) tdCustomer.textContent = task.customer || 'Not specified';
    const tdCategory = document.getElementById('tdCategory');
    if (tdCategory) tdCategory.textContent = task.category;
    const tdDescription = document.getElementById('tdDescription');
    if (tdDescription) tdDescription.textContent = task.description || 'No description provided.';
    const tdCreator = document.getElementById('tdCreatorName');
    if (tdCreator) tdCreator.textContent = task.creatorName;

    // SLA Clock Info
    const slaClock = document.getElementById('tdSlaClockInfo');
    if (slaClock) {
      if (task.status === 'waiting_on_client' || task.status === 'needs_clarification') {
        slaClock.innerHTML = `
          <span class="flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <span class="material-symbols-outlined text-[14px]">pause_circle</span>
            SLA Clock: Paused (Client Dependency)
          </span>
        `;
      } else if (task.status === 'done') {
        slaClock.innerHTML = `<span class="text-emerald-700 font-semibold">Resolved</span>`;
      } else {
        slaClock.innerHTML = `
          <span class="flex items-center gap-1 text-primary font-semibold">
            <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            SLA Clock: Active
          </span>
        `;
      }
    }

    // Status Label & Dropdown styling
    const statusLabel = document.getElementById('tdStatusLabel');
    if (statusLabel) statusLabel.textContent = window.lalaDb.formatStatus(task.status);

    const statusBtn = document.getElementById('tdStatusDropdownBtn');
    if (statusBtn) {
      if (task.status === 'waiting_on_client' || task.status === 'needs_clarification') {
        statusBtn.className = 'h-8 px-3 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-2 text-[12px] font-semibold hover:bg-amber-100 transition-all shadow-xs';
      } else if (task.status === 'done') {
        statusBtn.className = 'h-8 px-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-2 text-[12px] font-semibold hover:bg-emerald-100 transition-all shadow-xs';
      } else {
        statusBtn.className = 'h-8 px-3 rounded-lg bg-surface-container text-primary border border-outline-variant/40 flex items-center gap-2 text-[12px] font-semibold hover:bg-surface-container-high transition-all shadow-xs';
      }
    }

    // Assignee dropdown
    const assigneeSelect = document.getElementById('tdAssigneeSelect');
    if (assigneeSelect) {
      const users = window.lalaDb.getUsers().filter(u => u.role === 'employee');
      assigneeSelect.innerHTML = `
        <option value="">Unassigned</option>
        ${users.map(u => `
          <option value="${u.id}" ${task.assigneeId === u.id ? 'selected' : ''}>${u.name}</option>
        `).join('')}
      `;
    }

    // Meta fields
    const prioritySelect = document.getElementById('tdPrioritySelect');
    if (prioritySelect) prioritySelect.value = task.priority;

    const deadlineInput = document.getElementById('tdDeadlineInput');
    if (deadlineInput) deadlineInput.value = task.deadline ? task.deadline.slice(0, 10) : '';

    const followupInput = document.getElementById('tdFollowupInput');
    if (followupInput) followupInput.value = task.followUpDate ? task.followUpDate.slice(0, 10) : '';

    // Waiting duration display
    const waitDurationEl = document.getElementById('tdWaitingDuration');
    if (waitDurationEl) {
      if (task.waitingOnClientSince) {
        const diffMs = Date.now() - new Date(task.waitingOnClientSince).getTime();
        const days = Math.floor(diffMs / (24 * 3600 * 1000));
        const hours = Math.floor((diffMs % (24 * 3600 * 1000)) / 3600000);
        waitDurationEl.textContent = `${days}d ${hours}h paused`;
      } else {
        waitDurationEl.textContent = 'Active (Not paused)';
      }
    }

    // Linked Request Drawer
    const linkedReqBox = document.getElementById('tdLinkedRequestBox');
    if (linkedReqBox) {
      if (task.sourceRequestId) {
        linkedReqBox.classList.remove('hidden');
        const req = window.lalaDb.getRequest(task.sourceRequestId);
        const sourceId = document.getElementById('tdSourceReqId');
        if (sourceId) sourceId.textContent = task.sourceRequestId;
        const sourceChan = document.getElementById('tdSourceChannel');
        if (sourceChan) sourceChan.textContent = req?.sourceChannel || 'Intake';
        const sourceText = document.getElementById('tdSourceRawText');
        if (sourceText) sourceText.textContent = req?.rawText || 'Raw request not found.';
      } else {
        linkedReqBox.classList.add('hidden');
      }
    }

    // Comments List
    const comments = window.lalaDb.getComments(task.id);
    const commentsList = document.getElementById('tdCommentsList');
    const commentsCount = document.getElementById('tdCommentsCount');
    if (commentsCount) commentsCount.textContent = `${comments.length} notes`;
    if (commentsList) {
      if (comments.length === 0) {
        commentsList.innerHTML = '<div class="p-3 text-center text-secondary text-[12px]">No comments yet. Add notes or record clarification here.</div>';
      } else {
        commentsList.innerHTML = comments.map(c => `
          <div class="p-3 rounded-lg bg-surface border border-outline-variant/30 flex flex-col gap-1">
            <div class="flex items-center justify-between text-[11px]">
              <span class="font-semibold text-on-surface">${c.authorName} <span class="text-secondary font-normal font-mono">(${c.authorRole})</span></span>
              <span class="text-secondary font-mono">${new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p class="text-[12px] text-slate-700 whitespace-pre-wrap leading-relaxed">${c.body}</p>
          </div>
        `).join('');
      }
    }

    // Activity Log Timeline
    const activities = window.lalaDb.getActivityLog(task.id);
    const timeline = document.getElementById('tdActivityTimeline');
    if (timeline) {
      timeline.innerHTML = activities.map(act => `
        <div class="relative pl-6 border-l-2 border-outline-variant/40 pb-3">
          <span class="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary ring-2 ring-white"></span>
          <div class="text-[12px] text-on-surface font-medium leading-tight">${act.description}</div>
          <div class="text-[10px] text-secondary font-mono mt-0.5">${new Date(act.createdAt).toLocaleString()}</div>
        </div>
      `).join('');
    }
  }

  // ================= NOTIFICATIONS RENDER =================
  renderNotifications() {
    const list = document.getElementById('notifList');
    if (!list) return;

    const notifs = window.lalaDb.getNotifications();
    if (notifs.length === 0) {
      list.innerHTML = '<div class="p-4 text-center text-secondary text-[12px]">No notifications.</div>';
      return;
    }

    list.innerHTML = notifs.map(n => `
      <div onclick="window.lalaApp.handleNotificationClick('${n.id}', '${n.taskId}')" class="p-2.5 rounded-lg ${n.isRead ? 'bg-surface hover:bg-surface-container-low' : 'bg-primary-subdued border border-primary/20'} transition-colors cursor-pointer">
        <div class="flex items-start justify-between gap-1">
          <p class="text-[12px] ${n.isRead ? 'text-slate-700' : 'text-primary font-semibold'} leading-snug">
            ${n.message}
          </p>
          ${!n.isRead ? '<span class="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1"></span>' : ''}
        </div>
        <span class="text-[10px] text-secondary font-mono mt-1 block">
          ${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    `).join('');
  }

  handleNotificationClick(notifId, taskId) {
    window.lalaDb.markNotificationRead(notifId);
    this.closeAllDropdowns();
    if (taskId) {
      this.navigateTo('task-details', { id: taskId });
    }
  }

  markAllNotificationsRead() {
    window.lalaDb.markAllNotificationsRead();
  }

  // ================= TASK ACTIONS =================
  transitionTaskStatus(newStatus) {
    let comment = null;
    if (newStatus === 'waiting_on_client') {
      comment = prompt('Enter reason for pausing for client (e.g. Waiting for SMTP credentials / DNS update):', 'Awaiting client response. Timer paused.');
      if (comment === null) return; // User cancelled
    } else if (newStatus === 'needs_clarification') {
      comment = prompt('What clarification is needed from client?:', 'Sent question to client requesting details.');
      if (comment === null) return;
    } else if (newStatus === 'done') {
      comment = 'Task completed and verified.';
    }

    window.lalaDb.updateTaskStatus(this.currentTaskId, newStatus, comment);
    this.closeAllDropdowns();
  }

  changeTaskAssignee(assigneeId) {
    if (!assigneeId) return;
    window.lalaDb.assignTask(this.currentTaskId, assigneeId);
  }

  changeTaskPriority(priority) {
    window.lalaDb.updateTaskFields(this.currentTaskId, { priority });
  }

  changeTaskDeadline(deadline) {
    window.lalaDb.updateTaskFields(this.currentTaskId, { deadline });
  }

  changeTaskFollowup(followUpDate) {
    window.lalaDb.updateTaskFields(this.currentTaskId, { followUpDate });
  }

  submitComment(e) {
    e.preventDefault();
    const input = document.getElementById('commentInput');
    if (!input || !input.value.trim()) return;

    window.lalaDb.addComment(this.currentTaskId, { body: input.value.trim() });
    input.value = '';
  }

  quickAssignModal(taskId) {
    const user = window.lalaDb.getUsers().find(u => u.role === 'employee');
    if (user) {
      window.lalaDb.assignTask(taskId, user.id);
    }
  }

  quickPauseForClient(taskId) {
    const reason = prompt('What is needed from the client?:', 'Need client credentials/asset verification. Timer paused.');
    if (reason !== null) {
      window.lalaDb.updateTaskStatus(taskId, 'waiting_on_client', reason);
    }
  }

  quickResumeTask(taskId) {
    window.lalaDb.updateTaskStatus(taskId, 'in_progress', 'Client replied with requested info. Resuming work.');
  }

  quickMarkDone(taskId) {
    window.lalaDb.updateTaskStatus(taskId, 'done', 'Completed task.');
  }

  copyCurrentTaskId() {
    navigator.clipboard.writeText(this.currentTaskId);
    alert(`Copied ${this.currentTaskId} to clipboard!`);
  }

  // ================= MODALS & AI PIPELINE =================
  openNewRequestModal() {
    document.getElementById('newRequestModal')?.classList.remove('hidden');
    document.getElementById('requestRawTextInput')?.focus();
  }

  closeNewRequestModal() {
    document.getElementById('newRequestModal')?.classList.add('hidden');
  }

  fillPresetRequest(scenario) {
    const textInput = document.getElementById('requestRawTextInput');
    const channelSelect = document.getElementById('requestSourceChannel');
    if (!textInput) return;

    if (scenario === 'hero') {
      textInput.value = "The contact form isn't working on the website. Can you check it and let me know what's causing the issue?";
      if (channelSelect) channelSelect.value = 'WhatsApp';
    } else if (scenario === 'clarify') {
      textInput.value = "Can you update the homepage section?";
      if (channelSelect) channelSelect.value = 'WhatsApp';
    } else if (scenario === 'billing') {
      textInput.value = "Client requested monthly billing export and VAT breakdown for Q3 urgently.";
      if (channelSelect) channelSelect.value = 'Email';
    }
  }

  async submitRawRequestForAI() {
    const textInput = document.getElementById('requestRawTextInput');
    const channelSelect = document.getElementById('requestSourceChannel');
    const btn = document.getElementById('btnExtractAI');
    if (!textInput || !textInput.value.trim()) {
      alert('Please enter or paste a request message.');
      return;
    }

    const rawText = textInput.value.trim();
    const sourceChannel = channelSelect?.value || 'WhatsApp';

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">sync</span> Extracting with Gemini...';
    }

    try {
      // 1. Create Raw Request Record
      const req = window.lalaDb.createRequest({
        rawText,
        sourceChannel,
        aiStatus: 'pending'
      });

      // 2. Extract Task via AI Engine
      const suggestion = await window.lalaAi.extractTask(rawText);

      // 3. Update Request with Suggestion
      window.lalaDb.updateRequest(req.id, {
        aiStatus: 'processed',
        aiConfidence: suggestion.confidence,
        aiSuggestion: suggestion
      });

      this.pendingAiSuggestion = suggestion;
      this.pendingRawRequestData = {
        requestId: req.id,
        rawText,
        sourceChannel
      };

      // 4. Open Review Modal
      this.closeNewRequestModal();
      this.openAiReviewModal(suggestion, req);

    } catch (err) {
      alert('AI extraction error: ' + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">auto_awesome</span><span>Run AI Extraction →</span>';
      }
    }
  }

  openReviewModalForRequest(requestId) {
    const req = window.lalaDb.getRequest(requestId);
    if (!req) return;
    this.pendingRawRequestData = {
      requestId: req.id,
      rawText: req.rawText,
      sourceChannel: req.sourceChannel
    };
    this.openAiReviewModal(req.aiSuggestion, req);
  }

  openAiReviewModal(suggestion, req) {
    const modal = document.getElementById('aiReviewModal');
    if (!modal) return;

    // Populate Fields
    document.getElementById('reviewRawTextPreview').textContent = req.rawText;
    document.getElementById('reviewFieldTitle').value = suggestion.title || '';
    document.getElementById('reviewFieldCustomer').value = suggestion.customer || '';
    document.getElementById('reviewFieldCategory').value = suggestion.category || 'Website';
    document.getElementById('reviewFieldPriority').value = (suggestion.priority || 'medium').toLowerCase();
    document.getElementById('reviewFieldDeadline').value = suggestion.deadline || '';
    document.getElementById('reviewFieldFollowup').value = suggestion.followUpDate || '';
    document.getElementById('reviewFieldAction').value = suggestion.requiredAction || '';

    // Confidence meter
    const meter = document.getElementById('aiConfidenceMeter');
    if (meter) {
      meter.textContent = `Confidence: ${Math.round((suggestion.confidence || 0.9) * 100)}%`;
    }

    // Entity Badges
    const entitiesBox = document.getElementById('reviewEntityBadges');
    if (entitiesBox) {
      entitiesBox.innerHTML = (suggestion.keyEntities || []).map(e => `
        <span class="px-2 py-0.5 rounded bg-surface-container text-slate-800 text-[11px] font-mono">${e}</span>
      `).join('');
    }

    // Populate Assignees
    const assigneeSelect = document.getElementById('reviewFieldAssignee');
    if (assigneeSelect) {
      const users = window.lalaDb.getUsers().filter(u => u.role === 'employee');
      assigneeSelect.innerHTML = `
        <option value="">Leave Unassigned (ready_to_assign)</option>
        ${users.map(u => `
          <option value="${u.id}" ${suggestion.suggestedAssigneeName === u.name ? 'selected' : ''}>${u.name} (${u.title})</option>
        `).join('')}
      `;
    }

    modal.classList.remove('hidden');
  }

  closeAiReviewModal() {
    document.getElementById('aiReviewModal')?.classList.add('hidden');
  }

  confirmTaskFromReview(targetStatus = 'new_request') {
    const title = document.getElementById('reviewFieldTitle').value.trim();
    if (!title) {
      alert('Please specify a task title.');
      return;
    }

    const customer = document.getElementById('reviewFieldCustomer').value.trim();
    const category = document.getElementById('reviewFieldCategory').value;
    const priority = document.getElementById('reviewFieldPriority').value;
    const assigneeId = document.getElementById('reviewFieldAssignee').value || null;
    const deadline = document.getElementById('reviewFieldDeadline').value || null;
    const followUpDate = document.getElementById('reviewFieldFollowup').value || null;
    const action = document.getElementById('reviewFieldAction').value.trim();

    let assigneeName = null;
    if (assigneeId) {
      const u = window.lalaDb.getUser(assigneeId);
      if (u) assigneeName = u.name;
    }

    // Final status rules per PRD:
    // If assigned, move directly to in_progress
    // If saving as needs_clarification, set status = needs_clarification
    let finalStatus = targetStatus;
    if (assigneeId && finalStatus !== 'needs_clarification') {
      finalStatus = 'in_progress';
    }

    const newTask = window.lalaDb.createTask({
      title,
      description: action ? `${action}\n\nOriginal Request:\n${this.pendingRawRequestData?.rawText || ''}` : this.pendingRawRequestData?.rawText || '',
      customer,
      category,
      priority,
      status: finalStatus,
      assigneeId,
      assigneeName,
      deadline,
      followUpDate,
      sourceRequestId: this.pendingRawRequestData?.requestId || null
    });

    this.closeAiReviewModal();
    this.navigateTo('task-details', { id: newTask.id });
  }

  skipToManualTaskCreate() {
    this.closeNewRequestModal();
    const rawText = document.getElementById('requestRawTextInput')?.value || '';
    const fallback = window.lalaAi.createManualFallback(rawText);
    const req = window.lalaDb.createRequest({
      rawText: rawText || 'Manual task creation',
      sourceChannel: 'Manual',
      aiStatus: 'processed',
      aiSuggestion: fallback
    });
    this.openReviewModalForRequest(req.id);
  }

  markRequestClarification(requestId) {
    const req = window.lalaDb.getRequest(requestId);
    if (!req) return;
    const question = prompt('What clarification is needed for this request?', 'Could you clarify which section needs update?');
    if (!question) return;

    const task = window.lalaDb.createTask({
      title: req.aiSuggestion?.title || req.rawText.slice(0, 40),
      description: `Clarification needed: ${question}\n\nOriginal request: ${req.rawText}`,
      customer: req.aiSuggestion?.customer || null,
      category: req.aiSuggestion?.category || 'General',
      priority: 'medium',
      status: 'needs_clarification',
      sourceRequestId: req.id
    });

    window.lalaDb.addComment(task.id, { body: `Needs Clarification: ${question}` });
    this.render();
    this.navigateTo('task-details', { id: task.id });
  }

  // ================= 1-CLICK DEMO RUNNERS (PRD SECTION 18) =================
  
  /**
   * Hero Scenario Demo:
   * "The contact form isn't working on the website..."
   * End-to-end execution of the hero journey.
   */
  async runHeroScenarioDemo() {
    alert('Starting Lala Ops Hero Scenario (PRD Section 18):\n\n1. Intake Contact Form Request\n2. AI extraction\n3. Review & Create Task\n4. Assign to Rahul Sharma\n5. Rahul moves to Waiting on Client\n6. Verify SLA paused\n7. Resume & Mark Done!');
    
    // Switch to Manager
    window.lalaDb.setCurrentUser('user-mgr-1');
    
    // Fill Hero Text
    this.openNewRequestModal();
    this.fillPresetRequest('hero');

    // Run extraction after a short delay for visual realism
    setTimeout(async () => {
      await this.submitRawRequestForAI();
    }, 600);
  }

  /**
   * Clarification Scenario Beat:
   * "Can you update the homepage section?"
   */
  async runClarificationScenarioDemo() {
    alert('Starting Clarification Beat (PRD Section 18):\n\n1. Intake vague request ("Can you update the homepage section?")\n2. AI detects ambiguity (low confidence)\n3. Move to Needs Clarification with question\n4. Check dashboard: sits in Waiting on Client bucket, never in overdue!');
    
    window.lalaDb.setCurrentUser('user-mgr-1');
    this.openNewRequestModal();
    this.fillPresetRequest('clarify');

    setTimeout(async () => {
      await this.submitRawRequestForAI();
    }, 600);
  }

  // ================= SETTINGS & HELPERS =================
  openSettingsModal() {
    this.closeAllDropdowns();
    const modal = document.getElementById('settingsModal');
    const input = document.getElementById('geminiApiKeyInput');
    if (input) input.value = window.lalaAi.getApiKey();
    modal?.classList.remove('hidden');
  }

  closeSettingsModal() {
    document.getElementById('settingsModal')?.classList.add('hidden');
  }

  saveSettings() {
    const input = document.getElementById('geminiApiKeyInput');
    if (input) {
      window.lalaAi.setApiKey(input.value);
    }
    this.closeSettingsModal();
    alert('Settings updated!');
  }

  resetDemoData() {
    if (confirm('Reset all demo data back to clean initial state?')) {
      window.lalaDb.resetToDemoData();
      this.closeAllDropdowns();
      this.closeSettingsModal();
      this.navigateTo('dashboard');
    }
  }

  openCommandPalette() {
    const query = prompt('Command Palette (⌘K):\n1: Dashboard\n2: Requests Inbox\n3: My Work\n4: Task Details\n5: Hero Demo\nType 1-5 or press Cancel:');
    if (query === '1') this.navigateTo('dashboard');
    else if (query === '2') this.navigateTo('requests');
    else if (query === '3') this.navigateTo('my-work');
    else if (query === '4') this.navigateTo('task-details');
    else if (query === '5') this.runHeroScenarioDemo();
  }

  toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    dropdown?.classList.toggle('hidden');
    document.getElementById('notifDropdown')?.classList.add('hidden');
  }

  toggleNotifications() {
    const dropdown = document.getElementById('notifDropdown');
    dropdown?.classList.toggle('hidden');
    document.getElementById('userDropdown')?.classList.add('hidden');
  }

  toggleStatusMenu() {
    document.getElementById('tdStatusMenu')?.classList.toggle('hidden');
  }

  closeAllDropdowns() {
    document.getElementById('userDropdown')?.classList.add('hidden');
    document.getElementById('notifDropdown')?.classList.add('hidden');
    document.getElementById('tdStatusMenu')?.classList.add('hidden');
  }

  closeAllModals() {
    this.closeAllDropdowns();
    this.closeNewRequestModal();
    this.closeAiReviewModal();
    this.closeSettingsModal();
  }

  // ================= BADGE RENDERING UTILITIES =================
  renderStatusBadge(status, waitingSince = null) {
    let extra = '';
    if (status === 'waiting_on_client' || status === 'needs_clarification') {
      if (waitingSince) {
        const diffMs = Date.now() - new Date(waitingSince).getTime();
        const days = Math.floor(diffMs / (24 * 3600 * 1000));
        extra = `<span class="ml-1 px-1 py-0.2 rounded bg-amber-100/90 text-amber-900 font-mono text-[9px] font-bold">Paused ${days}d</span>`;
      }
    }

    switch (status) {
      case 'new_request':
        return `<span class="badge-status badge-new"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>New Request</span>`;
      case 'needs_clarification':
        return `<span class="badge-status badge-clarification"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Needs Clarification${extra}</span>`;
      case 'ready_to_assign':
        return `<span class="badge-status badge-ready"><span class="w-1.5 h-1.5 rounded-full bg-sky-500"></span>Ready to Assign</span>`;
      case 'in_progress':
        return `<span class="badge-status badge-progress"><span class="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>In Progress</span>`;
      case 'waiting_on_client':
        return `<span class="badge-status badge-waiting-client"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Waiting on Client${extra}</span>`;
      case 'done':
        return `<span class="badge-status badge-done"><span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>Done</span>`;
      default:
        return `<span class="badge-status badge-new">${status}</span>`;
    }
  }

  renderPriorityBadge(priority) {
    const p = (priority || 'medium').toLowerCase();
    switch (p) {
      case 'urgent':
        return `<span class="priority-urgent px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono tracking-wider">Urgent</span>`;
      case 'high':
        return `<span class="priority-high px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono tracking-wider">High</span>`;
      case 'medium':
        return `<span class="priority-medium px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono tracking-wider">Medium</span>`;
      case 'low':
        return `<span class="priority-low px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono tracking-wider">Low</span>`;
      default:
        return `<span class="priority-medium px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono">${p}</span>`;
    }
  }
}

// Global App Initialization
document.addEventListener('DOMContentLoaded', () => {
  window.lalaApp = new LalaOpsApp();
});
