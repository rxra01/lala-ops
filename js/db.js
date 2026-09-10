/**
 * Lala Ops — Data Layer & Firestore Document Model
 * Implements PRD Section 6 (users, requests, tasks, comments, activityLog, notifications)
 * Reactive document store with LocalStorage persistence and realistic initial demo seed.
 */

const STORAGE_KEY = 'lala_ops_db_v1';

const INITIAL_USERS = [
  {
    id: 'user-mgr-1',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@lalatech.com',
    role: 'manager',
    title: 'Operations Lead (Manager)',
    avatar: 'assets/sarah_avatar.png',
    status: 'online'
  },
  {
    id: 'user-mgr-2',
    name: 'Marcus Vance',
    email: 'marcus.vance@lalatech.com',
    role: 'manager',
    title: 'Director of Ops',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'online'
  },
  {
    id: 'user-emp-1',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@lalatech.com',
    role: 'employee',
    title: 'Support & Technical Specialist',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    shift: 'APAC-West (09:00 - 18:00 IST)',
    status: 'active'
  },
  {
    id: 'user-emp-2',
    name: 'Priya Patel',
    email: 'priya.patel@lalatech.com',
    role: 'employee',
    title: 'Web & Systems Specialist',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    shift: 'EMEA (10:00 - 19:00 UTC)',
    status: 'active'
  },
  {
    id: 'user-emp-3',
    name: 'David Kim',
    email: 'david.kim@lalatech.com',
    role: 'employee',
    title: 'Backend Operations Engineer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    shift: 'US-West (08:00 - 17:00 PST)',
    status: 'active'
  },
  {
    id: 'user-emp-4',
    name: 'Elena Rostova',
    email: 'elena.rostova@lalatech.com',
    role: 'employee',
    title: 'Client Support Engineer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    shift: 'EMEA (09:00 - 18:00 UTC)',
    status: 'offline'
  },
  {
    id: 'user-emp-5',
    name: 'Alex Chen',
    email: 'alex.chen@lalatech.com',
    role: 'employee',
    title: 'Infrastructure Specialist',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    shift: 'US-East (09:00 - 18:00 EST)',
    status: 'active'
  },
  {
    id: 'user-emp-6',
    name: 'Maya Lin',
    email: 'maya.lin@lalatech.com',
    role: 'employee',
    title: 'Billing & Account Specialist',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    shift: 'APAC-East (09:00 - 18:00 SGT)',
    status: 'active'
  },
  {
    id: 'user-emp-7',
    name: 'Carlos Mendez',
    email: 'carlos.mendez@lalatech.com',
    role: 'employee',
    title: 'Frontend Specialist',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    shift: 'LATAM (09:00 - 18:00 BRT)',
    status: 'active'
  },
  {
    id: 'user-emp-8',
    name: 'Aisha Bello',
    email: 'aisha.bello@lalatech.com',
    role: 'employee',
    title: 'QA & Compliance Lead',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    shift: 'WAT (08:00 - 17:00 WAT)',
    status: 'active'
  }
];

const now = new Date();
const hoursAgo = (h) => new Date(now.getTime() - h * 3600 * 1000).toISOString();
const daysAgo = (d) => new Date(now.getTime() - d * 24 * 3600 * 1000).toISOString();
const daysFromNow = (d) => new Date(now.getTime() + d * 24 * 3600 * 1000).toISOString();

const INITIAL_REQUESTS = [
  {
    id: 'REQ-201',
    rawText: 'Client from Meridian Health texted: Our doctors portal login is rejecting valid passwords since 2pm. Can someone take a look urgently?',
    sourceChannel: 'WhatsApp',
    createdById: 'user-mgr-1',
    createdByName: 'Sarah Jenkins',
    aiStatus: 'pending',
    aiConfidence: 0.95,
    aiSuggestion: {
      title: 'Fix doctors portal password login authentication error',
      description: 'Doctors portal login is failing for valid user credentials starting at 2pm today.',
      customer: 'Meridian Health',
      category: 'Technical',
      priority: 'Urgent',
      deadline: daysFromNow(1),
      followUpDate: daysFromNow(1),
      suggestedAssigneeName: 'Rahul Sharma',
      requiredAction: 'Inspect authentication service error logs and test auth flow.',
      keyEntities: ['Meridian Health', 'Doctors Portal', 'Auth Service']
    },
    convertedTaskId: null,
    createdAt: hoursAgo(1)
  },
  {
    id: 'REQ-198',
    rawText: 'Apex Logistics email: The contact form on apexlogistics.com is throwing 500 error on submit. Please investigate SMTP credentials.',
    sourceChannel: 'Email',
    createdById: 'user-mgr-1',
    createdByName: 'Sarah Jenkins',
    aiStatus: 'processed',
    aiConfidence: 0.94,
    aiSuggestion: {
      title: 'Fix broken contact form on apexlogistics.com',
      description: 'Contact form throwing 500 internal server error on submit.',
      customer: 'Apex Logistics',
      category: 'Website',
      priority: 'High',
      deadline: daysFromNow(2),
      followUpDate: daysFromNow(2),
      suggestedAssigneeName: 'Rahul Sharma',
      requiredAction: 'Verify SMTP server configuration and test mail delivery.',
      keyEntities: ['Apex Logistics', 'apexlogistics.com', 'SMTP']
    },
    convertedTaskId: 'TASK-1042',
    createdAt: daysAgo(2)
  },
  {
    id: 'REQ-194',
    rawText: 'Can you update the homepage section?',
    sourceChannel: 'WhatsApp',
    createdById: 'user-mgr-1',
    createdByName: 'Sarah Jenkins',
    aiStatus: 'processed',
    aiConfidence: 0.62,
    aiSuggestion: {
      title: 'Update homepage section copy and graphics',
      description: 'Client sent vague request to update homepage section.',
      customer: 'GreenPeak Organics',
      category: 'Website',
      priority: 'Medium',
      deadline: daysFromNow(4),
      followUpDate: daysFromNow(2),
      suggestedAssigneeName: null,
      requiredAction: 'Request specific details on which section needs changes.',
      keyEntities: ['Homepage', 'Copywriting']
    },
    convertedTaskId: 'TASK-1038',
    createdAt: daysAgo(3)
  }
];

const INITIAL_TASKS = [
  // 1. WAITING ON CLIENT TASK (Hero Scenario Task - paused for SMTP credentials)
  {
    id: 'TASK-1042',
    title: 'Fix broken contact form on apexlogistics.com',
    description: 'Contact form throwing 500 error on submit. Investigation shows SMTP password is stale and requires client update.',
    customer: 'Apex Logistics',
    category: 'Website',
    priority: 'high',
    status: 'waiting_on_client',
    assigneeId: 'user-emp-1',
    assigneeName: 'Rahul Sharma',
    isUnassigned: false,
    creatorId: 'user-mgr-1',
    creatorName: 'Sarah Jenkins',
    deadline: daysFromNow(2),
    followUpDate: daysFromNow(2),
    lastActivityAt: daysAgo(2),
    waitingOnClientSince: daysAgo(2), // 2 days paused
    sourceRequestId: 'REQ-198',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
    completedAt: null
  },
  // 2. NEEDS CLARIFICATION TASK (Clarification Beat - waiting on client before assignment)
  {
    id: 'TASK-1038',
    title: 'Update homepage section copy and graphics',
    description: 'Client requested update to homepage section, but did not specify which hero/feature/footer section.',
    customer: 'GreenPeak Organics',
    category: 'Website',
    priority: 'medium',
    status: 'needs_clarification',
    assigneeId: null,
    assigneeName: null,
    isUnassigned: true,
    creatorId: 'user-mgr-1',
    creatorName: 'Sarah Jenkins',
    deadline: daysFromNow(3),
    followUpDate: daysFromNow(1),
    lastActivityAt: daysAgo(1),
    waitingOnClientSince: daysAgo(1),
    sourceRequestId: 'REQ-194',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
    completedAt: null
  },
  // 3. READY TO ASSIGN (Waiting for Us - sitting unassigned!)
  {
    id: 'TASK-1045',
    title: 'Export monthly billing invoices and VAT summary for Q3',
    description: 'Accounting team requires consolidated Q3 billing invoices and VAT breakdown exported to CSV.',
    customer: 'Lala Internal Finance',
    category: 'Billing',
    priority: 'high',
    status: 'ready_to_assign',
    assigneeId: null,
    assigneeName: null,
    isUnassigned: true,
    creatorId: 'user-mgr-1',
    creatorName: 'Sarah Jenkins',
    deadline: daysFromNow(1),
    followUpDate: daysFromNow(1),
    lastActivityAt: hoursAgo(8),
    waitingOnClientSince: null,
    sourceRequestId: null,
    createdAt: hoursAgo(8),
    updatedAt: hoursAgo(8),
    completedAt: null
  },
  // 4. READY TO ASSIGN (Waiting for Us - sitting unassigned!)
  {
    id: 'TASK-1046',
    title: 'Fix responsive layout overflow on mobile checkout cart',
    description: 'Payment summary table breaks on viewport widths below 380px on iOS Safari.',
    customer: 'Velox Apparel',
    category: 'Technical',
    priority: 'medium',
    status: 'ready_to_assign',
    assigneeId: null,
    assigneeName: null,
    isUnassigned: true,
    creatorId: 'user-mgr-1',
    creatorName: 'Sarah Jenkins',
    deadline: daysFromNow(3),
    followUpDate: daysFromNow(2),
    lastActivityAt: hoursAgo(12),
    waitingOnClientSince: null,
    sourceRequestId: null,
    createdAt: hoursAgo(12),
    updatedAt: hoursAgo(12),
    completedAt: null
  },
  // 5. NEW REQUEST (Untriaged - Waiting for Us!)
  {
    id: 'TASK-1047',
    title: 'Update SSL certificates across staging subdomains',
    description: 'Wildcard staging certificate expires in 72 hours (*.staging.lalatech.dev).',
    customer: 'Internal Infrastructure',
    category: 'Technical',
    priority: 'high',
    status: 'new_request',
    assigneeId: null,
    assigneeName: null,
    isUnassigned: true,
    creatorId: 'user-mgr-1',
    creatorName: 'Sarah Jenkins',
    deadline: daysFromNow(2),
    followUpDate: daysFromNow(1),
    lastActivityAt: hoursAgo(4),
    waitingOnClientSince: null,
    sourceRequestId: null,
    createdAt: hoursAgo(4),
    updatedAt: hoursAgo(4),
    completedAt: null
  },
  // 6. IN PROGRESS (Assigned to Rahul Sharma)
  {
    id: 'TASK-1040',
    title: 'Implement Stripe Webhook signature verification',
    description: 'Ensure incoming charge.succeeded and invoice.payment_failed webhooks check cryptographic signatures.',
    customer: 'Beacon Subscriptions',
    category: 'Billing',
    priority: 'high',
    status: 'in_progress',
    assigneeId: 'user-emp-1',
    assigneeName: 'Rahul Sharma',
    isUnassigned: false,
    creatorId: 'user-mgr-1',
    creatorName: 'Sarah Jenkins',
    deadline: daysFromNow(1),
    followUpDate: daysFromNow(1),
    lastActivityAt: hoursAgo(2),
    waitingOnClientSince: null,
    sourceRequestId: null,
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(2),
    completedAt: null
  },
  // 7. IN PROGRESS (Assigned to Rahul Sharma)
  {
    id: 'TASK-1041',
    title: 'Database connection pool optimization for surge traffic',
    description: 'Increase pool connection size and tune idle timeouts for weekend campaign.',
    customer: 'Beacon Subscriptions',
    category: 'Technical',
    priority: 'medium',
    status: 'in_progress',
    assigneeId: 'user-emp-1',
    assigneeName: 'Rahul Sharma',
    isUnassigned: false,
    creatorId: 'user-mgr-1',
    creatorName: 'Sarah Jenkins',
    deadline: daysFromNow(2),
    followUpDate: daysFromNow(2),
    lastActivityAt: hoursAgo(6),
    waitingOnClientSince: null,
    sourceRequestId: null,
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(6),
    completedAt: null
  },
  // 8. IN PROGRESS (Assigned to Priya Patel)
  {
    id: 'TASK-1035',
    title: 'Optimize product catalog WebP images',
    description: 'Compress 2,400 hero and thumbnail assets using WebP image processor pipeline.',
    customer: 'Kinetix Fitness',
    category: 'Website',
    priority: 'low',
    status: 'in_progress',
    assigneeId: 'user-emp-2',
    assigneeName: 'Priya Patel',
    isUnassigned: false,
    creatorId: 'user-mgr-1',
    creatorName: 'Sarah Jenkins',
    deadline: daysFromNow(4),
    followUpDate: daysFromNow(3),
    lastActivityAt: daysAgo(1),
    waitingOnClientSince: null,
    sourceRequestId: null,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
    completedAt: null
  },
  // 9. OVERDUE TASK (Deadline passed, not waiting on client!)
  {
    id: 'TASK-1029',
    title: 'Security patch CVE-2026-4412 on WordPress headless instances',
    description: 'Core security patch for remote code vulnerability on external client instances.',
    customer: 'Apex Logistics',
    category: 'Technical',
    priority: 'urgent',
    status: 'in_progress',
    assigneeId: 'user-emp-3',
    assigneeName: 'David Kim',
    isUnassigned: false,
    creatorId: 'user-mgr-1',
    creatorName: 'Sarah Jenkins',
    deadline: daysAgo(1), // PAST DEADLINE -> OVERDUE
    followUpDate: daysAgo(1),
    lastActivityAt: daysAgo(2),
    waitingOnClientSince: null,
    sourceRequestId: null,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(2),
    completedAt: null
  },
  // 10. STALE TASK (Waiting for Us - in_progress with no activity > 3 days!)
  {
    id: 'TASK-1025',
    title: 'Audit third-party JavaScript tracking scripts on checkout',
    description: 'Performance review of third-party pixels slowing page load times.',
    customer: 'OmniTrade Direct',
    category: 'Technical',
    priority: 'medium',
    status: 'in_progress',
    assigneeId: 'user-emp-4',
    assigneeName: 'Elena Rostova',
    isUnassigned: false,
    creatorId: 'user-mgr-1',
    creatorName: 'Sarah Jenkins',
    deadline: daysFromNow(3),
    followUpDate: daysAgo(1),
    lastActivityAt: daysAgo(4), // STALE (> 3 days) -> feeds Waiting for Us!
    waitingOnClientSince: null,
    sourceRequestId: null,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(4),
    completedAt: null
  },
  // 11. WAITING ON CLIENT TASK (Paused for custom domain DNS)
  {
    id: 'TASK-1033',
    title: 'Configure custom domain apex CNAME and SSL for Acme Corp',
    description: 'Waiting for client IT department to create DNS TXT verification record.',
    customer: 'Acme Global',
    category: 'Technical',
    priority: 'medium',
    status: 'waiting_on_client',
    assigneeId: 'user-emp-5',
    assigneeName: 'Alex Chen',
    isUnassigned: false,
    creatorId: 'user-mgr-1',
    creatorName: 'Sarah Jenkins',
    deadline: daysFromNow(5),
    followUpDate: daysFromNow(2),
    lastActivityAt: daysAgo(3),
    waitingOnClientSince: daysAgo(3), // 3 days paused
    sourceRequestId: null,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(3),
    completedAt: null
  },
  // 12. COMPLETED TASK (Terminal state)
  {
    id: 'TASK-1020',
    title: 'Migrate DNS zone files from GoDaddy to Cloudflare',
    description: 'Updated authoritative nameservers and migrated proxy records with zero downtime.',
    customer: 'Apex Logistics',
    category: 'Technical',
    priority: 'high',
    status: 'done',
    assigneeId: 'user-emp-1',
    assigneeName: 'Rahul Sharma',
    isUnassigned: false,
    creatorId: 'user-mgr-1',
    creatorName: 'Sarah Jenkins',
    deadline: daysAgo(2),
    followUpDate: null,
    lastActivityAt: daysAgo(1),
    waitingOnClientSince: null,
    sourceRequestId: null,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
    completedAt: daysAgo(1)
  },
  // 13. COMPLETED TASK
  {
    id: 'TASK-1018',
    title: 'Update Terms of Service and Privacy Policy v2.4 footer links',
    description: 'Revised legal links across all localized website templates.',
    customer: 'GreenPeak Organics',
    category: 'General',
    priority: 'low',
    status: 'done',
    assigneeId: 'user-emp-2',
    assigneeName: 'Priya Patel',
    isUnassigned: false,
    creatorId: 'user-mgr-1',
    creatorName: 'Sarah Jenkins',
    deadline: daysAgo(3),
    followUpDate: null,
    lastActivityAt: daysAgo(2),
    waitingOnClientSince: null,
    sourceRequestId: null,
    createdAt: daysAgo(6),
    updatedAt: daysAgo(2),
    completedAt: daysAgo(2)
  }
];

const INITIAL_COMMENTS = [
  {
    id: 'COM-1',
    taskId: 'TASK-1042',
    authorId: 'user-emp-1',
    authorName: 'Rahul Sharma',
    authorRole: 'employee',
    body: 'Investigated apexlogistics.com mail server connection. The SMTP endpoint rejects auth: "535 5.7.8 Authentication credentials invalid". We need Apex Logistics to provide their updated password or app-specific key.',
    createdAt: daysAgo(2)
  },
  {
    id: 'COM-2',
    taskId: 'TASK-1042',
    authorId: 'user-emp-1',
    authorName: 'Rahul Sharma',
    authorRole: 'employee',
    body: 'Status changed to Waiting on Client. Sent clarification request email to Dave at Apex Logistics. SLA clock paused.',
    createdAt: daysAgo(2)
  },
  {
    id: 'COM-3',
    taskId: 'TASK-1038',
    authorId: 'user-mgr-1',
    authorName: 'Sarah Jenkins',
    authorRole: 'manager',
    body: 'Sent message to client asking: "Could you clarify if you mean the hero headline, the testimonials carousel, or the pricing matrix?" Task held in Needs Clarification.',
    createdAt: daysAgo(1)
  }
];

const INITIAL_ACTIVITY = [
  {
    id: 'ACT-1',
    taskId: 'TASK-1042',
    actorId: 'user-mgr-1',
    actorName: 'Sarah Jenkins',
    eventType: 'task_created',
    description: 'Sarah Jenkins created task from incoming raw request (REQ-198).',
    createdAt: daysAgo(2)
  },
  {
    id: 'ACT-2',
    taskId: 'TASK-1042',
    actorId: 'user-mgr-1',
    actorName: 'Sarah Jenkins',
    eventType: 'task_assigned',
    description: 'Sarah Jenkins moved task to Ready to Assign and assigned to Rahul Sharma.',
    createdAt: daysAgo(2)
  },
  {
    id: 'ACT-3',
    taskId: 'TASK-1042',
    actorId: 'user-emp-1',
    actorName: 'Rahul Sharma',
    eventType: 'status_changed',
    description: 'Rahul Sharma moved status to Waiting on Client: awaiting SMTP password from client.',
    createdAt: daysAgo(2)
  },
  {
    id: 'ACT-4',
    taskId: 'TASK-1038',
    actorId: 'user-mgr-1',
    actorName: 'Sarah Jenkins',
    eventType: 'status_changed',
    description: 'Sarah Jenkins moved task to Needs Clarification: awaiting client response on homepage section.',
    createdAt: daysAgo(1)
  }
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 'NOTIF-1',
    userId: 'user-emp-1',
    type: 'assigned',
    taskId: 'TASK-1040',
    message: 'New task assigned to you: Implement Stripe Webhook signature verification',
    isRead: false,
    createdAt: hoursAgo(2)
  },
  {
    id: 'NOTIF-2',
    userId: 'user-mgr-1',
    type: 'overdue',
    taskId: 'TASK-1029',
    message: 'Task Overdue: Security patch CVE-2026-4412 on WordPress instances breached deadline.',
    isRead: false,
    createdAt: hoursAgo(5)
  },
  {
    id: 'NOTIF-3',
    userId: 'user-mgr-1',
    type: 'stale_task',
    taskId: 'TASK-1025',
    message: 'Waiting for Us: Audit third-party JavaScript tracking scripts has had no activity in 4 days.',
    isRead: true,
    createdAt: daysAgo(1)
  }
];

class LalaOpsStore {
  constructor() {
    this.subscribers = [];
    this.load();
  }

  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        this.users = parsed.users || INITIAL_USERS;
        this.requests = parsed.requests || INITIAL_REQUESTS;
        this.tasks = parsed.tasks || INITIAL_TASKS;
        this.comments = parsed.comments || INITIAL_COMMENTS;
        this.activityLog = parsed.activityLog || INITIAL_ACTIVITY;
        this.notifications = parsed.notifications || INITIAL_NOTIFICATIONS;
        this.currentUser = parsed.currentUser || this.users[0]; // Sarah Jenkins
        return;
      } catch (e) {
        console.warn('Failed to parse cached store, reseeding:', e);
      }
    }
    this.resetToDemoData();
  }

  save() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        users: this.users,
        requests: this.requests,
        tasks: this.tasks,
        comments: this.comments,
        activityLog: this.activityLog,
        notifications: this.notifications,
        currentUser: this.currentUser
      })
    );
    this.notify();
  }

  resetToDemoData() {
    this.users = JSON.parse(JSON.stringify(INITIAL_USERS));
    this.requests = JSON.parse(JSON.stringify(INITIAL_REQUESTS));
    this.tasks = JSON.parse(JSON.stringify(INITIAL_TASKS));
    this.comments = JSON.parse(JSON.stringify(INITIAL_COMMENTS));
    this.activityLog = JSON.parse(JSON.stringify(INITIAL_ACTIVITY));
    this.notifications = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
    this.currentUser = this.users[0]; // Sarah Jenkins (Manager)
    this.save();
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(fn => fn !== callback);
    };
  }

  notify() {
    for (const callback of this.subscribers) {
      try {
        callback(this);
      } catch (e) {
        console.error('Subscriber callback error:', e);
      }
    }
  }

  // --- User & Auth Operations ---
  getUsers() {
    return this.users;
  }

  getUser(id) {
    return this.users.find(u => u.id === id);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  setCurrentUser(userId) {
    const user = this.getUser(userId);
    if (user) {
      this.currentUser = user;
      this.save();
    }
  }

  // --- 4 Core Visibility Buckets (PRD Section 10) ---
  get4VisibilityBuckets() {
    const nowDate = new Date();
    const staleThresholdMs = 3 * 24 * 3600 * 1000; // 3 days

    // Bucket 1: Waiting for Us
    // - new_request (untriaged)
    // - ready_to_assign (unassigned, needs owner)
    // - in_progress tasks with no activity in 3+ days (stale)
    const waitingForUs = this.tasks.filter(t => {
      if (t.status === 'done' || t.status === 'needs_clarification' || t.status === 'waiting_on_client') {
        return false;
      }
      if (t.status === 'new_request' || t.status === 'ready_to_assign') {
        return true;
      }
      if (t.status === 'in_progress') {
        const lastAct = new Date(t.lastActivityAt || t.updatedAt || t.createdAt);
        return (nowDate.getTime() - lastAct.getTime()) >= staleThresholdMs;
      }
      return false;
    });

    // Bucket 2: Waiting for Client
    // - needs_clarification
    // - waiting_on_client
    // EXPLICITLY SUPPRESSED FROM OVERDUE ALERTS
    const waitingForClient = this.tasks.filter(t => {
      return t.status === 'needs_clarification' || t.status === 'waiting_on_client';
    });

    // Bucket 3: Unassigned
    // Any task where assigneeId is null / isUnassigned === true
    const unassigned = this.tasks.filter(t => t.isUnassigned || !t.assigneeId);

    // Bucket 4: Overdue
    // deadline passed, not done, and NOT in needs_clarification or waiting_on_client
    const overdue = this.tasks.filter(t => {
      if (t.status === 'done' || t.status === 'needs_clarification' || t.status === 'waiting_on_client') {
        return false;
      }
      if (!t.deadline) return false;
      return new Date(t.deadline).getTime() < nowDate.getTime();
    });

    return {
      waitingForUs,
      waitingForClient,
      unassigned,
      overdue
    };
  }

  // --- Requests Inbox API ---
  getRequests(filter = 'all') {
    if (filter === 'pending') {
      return this.requests.filter(r => r.aiStatus === 'pending' || !r.convertedTaskId);
    }
    if (filter === 'converted') {
      return this.requests.filter(r => !!r.convertedTaskId);
    }
    return this.requests;
  }

  getRequest(id) {
    return this.requests.find(r => r.id === id);
  }

  createRequest(data) {
    const id = `REQ-${Date.now().toString().slice(-4)}`;
    const newReq = {
      id,
      rawText: data.rawText,
      sourceChannel: data.sourceChannel || 'WhatsApp',
      createdById: this.currentUser.id,
      createdByName: this.currentUser.name,
      aiStatus: data.aiStatus || 'pending',
      aiConfidence: data.aiConfidence || null,
      aiSuggestion: data.aiSuggestion || null,
      convertedTaskId: null,
      createdAt: new Date().toISOString()
    };
    this.requests.unshift(newReq);
    this.save();
    return newReq;
  }

  updateRequest(id, patch) {
    const req = this.getRequest(id);
    if (!req) return null;
    Object.assign(req, patch);
    this.save();
    return req;
  }

  // --- Tasks API ---
  getTasks(filter = {}) {
    return this.tasks.filter(task => {
      if (filter.status && filter.status !== 'all' && task.status !== filter.status) return false;
      if (filter.assigneeId && task.assigneeId !== filter.assigneeId) return false;
      if (filter.category && filter.category !== 'all' && task.category !== filter.category) return false;
      if (filter.priority && filter.priority !== 'all' && task.priority !== filter.priority) return false;
      if (filter.search) {
        const q = filter.search.toLowerCase();
        const match =
          task.title.toLowerCase().includes(q) ||
          (task.customer && task.customer.toLowerCase().includes(q)) ||
          task.id.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }

  getTask(id) {
    return this.tasks.find(t => t.id === id);
  }

  createTask(data) {
    const id = `TASK-${1000 + this.tasks.length + 1}`;
    const timestamp = new Date().toISOString();
    const newTask = {
      id,
      title: data.title || 'Untitled Task',
      description: data.description || '',
      customer: data.customer || null,
      category: data.category || 'General',
      priority: (data.priority || 'medium').toLowerCase(),
      status: data.status || 'new_request',
      assigneeId: data.assigneeId || null,
      assigneeName: data.assigneeName || null,
      isUnassigned: !data.assigneeId,
      creatorId: this.currentUser.id,
      creatorName: this.currentUser.name,
      deadline: data.deadline || null,
      followUpDate: data.followUpDate || null,
      lastActivityAt: timestamp,
      waitingOnClientSince: (data.status === 'waiting_on_client' || data.status === 'needs_clarification') ? timestamp : null,
      sourceRequestId: data.sourceRequestId || null,
      createdAt: timestamp,
      updatedAt: timestamp,
      completedAt: data.status === 'done' ? timestamp : null
    };

    this.tasks.unshift(newTask);

    // Link back to request if converted
    if (data.sourceRequestId) {
      this.updateRequest(data.sourceRequestId, { convertedTaskId: id });
    }

    this.logActivity(id, 'task_created', `${this.currentUser.name} created task "${newTask.title}".`);

    // Notification if assigned immediately
    if (newTask.assigneeId) {
      this.createNotification({
        userId: newTask.assigneeId,
        type: 'assigned',
        taskId: id,
        message: `New task assigned to you: ${newTask.title}`
      });
    }

    this.save();
    return newTask;
  }

  updateTaskStatus(taskId, nextStatus, commentText = null) {
    const task = this.getTask(taskId);
    if (!task) return null;

    const prevStatus = task.status;
    const timestamp = new Date().toISOString();

    task.status = nextStatus;
    task.updatedAt = timestamp;

    // Handle waitingOnClientSince logic per PRD Section 7 & 9
    if (nextStatus === 'waiting_on_client' || nextStatus === 'needs_clarification') {
      if (!task.waitingOnClientSince) {
        task.waitingOnClientSince = timestamp;
      }
    } else {
      task.waitingOnClientSince = null;
    }

    if (nextStatus === 'done') {
      task.completedAt = timestamp;
    } else {
      task.completedAt = null;
    }

    // Only update lastActivityAt if moving out of or into active states
    task.lastActivityAt = timestamp;

    // Optional comment
    if (commentText) {
      this.addComment(taskId, { body: commentText });
    }

    // Activity log entry with human readable narrative
    let description = `${this.currentUser.name} moved status from ${this.formatStatus(prevStatus)} → ${this.formatStatus(nextStatus)}.`;
    if (nextStatus === 'waiting_on_client') {
      description = `${this.currentUser.name} moved task to Waiting on Client: SLA alert paused pending external response.`;
    } else if (prevStatus === 'waiting_on_client' && nextStatus === 'in_progress') {
      description = `${this.currentUser.name} resumed task to In Progress: client response received.`;
    } else if (nextStatus === 'needs_clarification') {
      description = `${this.currentUser.name} marked task as Needs Clarification: awaiting client input before triage.`;
    } else if (nextStatus === 'done') {
      description = `${this.currentUser.name} completed task.`;
    }

    this.logActivity(taskId, 'status_changed', description);
    this.save();
    return task;
  }

  assignTask(taskId, assigneeId) {
    const task = this.getTask(taskId);
    if (!task) return null;

    const assignee = this.getUser(assigneeId);
    if (!assignee) return null;

    task.assigneeId = assignee.id;
    task.assigneeName = assignee.name;
    task.isUnassigned = false;

    // Advancing to in_progress if currently in ready_to_assign or new_request per PRD
    if (task.status === 'ready_to_assign' || task.status === 'new_request') {
      task.status = 'in_progress';
    }

    const timestamp = new Date().toISOString();
    task.updatedAt = timestamp;
    task.lastActivityAt = timestamp;

    this.logActivity(taskId, 'task_assigned', `${this.currentUser.name} assigned task to ${assignee.name}.`);

    this.createNotification({
      userId: assignee.id,
      type: 'assigned',
      taskId,
      message: `You were assigned task: ${task.title}`
    });

    this.save();
    return task;
  }

  updateTaskFields(taskId, patch) {
    const task = this.getTask(taskId);
    if (!task) return null;

    const timestamp = new Date().toISOString();
    Object.assign(task, patch);
    task.updatedAt = timestamp;
    task.lastActivityAt = timestamp;

    if (patch.priority) {
      this.logActivity(taskId, 'priority_changed', `${this.currentUser.name} updated priority to ${patch.priority.toUpperCase()}.`);
    }

    this.save();
    return task;
  }

  // --- Comments API ---
  getComments(taskId) {
    return this.comments.filter(c => c.taskId === taskId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  addComment(taskId, data) {
    const id = `COM-${Date.now().toString().slice(-4)}`;
    const newComment = {
      id,
      taskId,
      authorId: this.currentUser.id,
      authorName: this.currentUser.name,
      authorRole: this.currentUser.role,
      body: data.body,
      createdAt: new Date().toISOString()
    };

    this.comments.push(newComment);

    const task = this.getTask(taskId);
    if (task) {
      task.lastActivityAt = newComment.createdAt;
      this.logActivity(taskId, 'comment_added', `${this.currentUser.name} added a note/comment.`);

      // Notify assignee or manager if different user
      const recipientId = task.assigneeId && task.assigneeId !== this.currentUser.id ? task.assigneeId : (task.creatorId !== this.currentUser.id ? task.creatorId : null);
      if (recipientId) {
        this.createNotification({
          userId: recipientId,
          type: 'comment_added',
          taskId,
          message: `${this.currentUser.name} commented on "${task.title}": "${data.body.slice(0, 60)}..."`
        });
      }
    }

    this.save();
    return newComment;
  }

  // --- Activity Log API ---
  getActivityLog(taskId) {
    return this.activityLog.filter(a => a.taskId === taskId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  logActivity(taskId, eventType, description) {
    const id = `ACT-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`;
    const entry = {
      id,
      taskId,
      actorId: this.currentUser ? this.currentUser.id : null,
      actorName: this.currentUser ? this.currentUser.name : 'System',
      eventType,
      description,
      createdAt: new Date().toISOString()
    };
    this.activityLog.unshift(entry);
    return entry;
  }

  // --- Notifications API ---
  getNotifications(userId = null) {
    const targetUserId = userId || this.currentUser.id;
    return this.notifications.filter(n => n.userId === targetUserId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getUnreadNotificationsCount(userId = null) {
    return this.getNotifications(userId).filter(n => !n.isRead).length;
  }

  markNotificationRead(id) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.save();
    }
  }

  markAllNotificationsRead(userId = null) {
    const targetUserId = userId || this.currentUser.id;
    this.notifications.forEach(n => {
      if (n.userId === targetUserId) n.isRead = true;
    });
    this.save();
  }

  createNotification(data) {
    // Avoid creating duplicate unread notification of same type for task+user
    const existing = this.notifications.find(
      n => n.userId === data.userId && n.taskId === data.taskId && n.type === data.type && !n.isRead
    );
    if (existing) return existing;

    const id = `NOTIF-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`;
    const newNotif = {
      id,
      userId: data.userId,
      type: data.type,
      taskId: data.taskId || null,
      message: data.message,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.notifications.unshift(newNotif);
    return newNotif;
  }

  // Helper formatter
  formatStatus(status) {
    const map = {
      new_request: 'New Request',
      needs_clarification: 'Needs Clarification',
      ready_to_assign: 'Ready to Assign',
      in_progress: 'In Progress',
      waiting_on_client: 'Waiting on Client',
      done: 'Done'
    };
    return map[status] || status;
  }
}

// Global Singleton
window.lalaDb = new LalaOpsStore();
