# 🏗️ Technical Architecture Overview

## Project Structure Hierarchy

```
kayaba-recruitment-portal/
│
├── 📄 Configuration Files
│   ├── package.json          # Dependencies & scripts
│   ├── tsconfig.json         # TypeScript config
│   ├── vite.config.ts        # Vite build config
│   ├── eslint.config.js      # Linting rules
│   └── components.json       # shadcn/ui config
│
├── 📁 src/ (Main Application)
│   │
│   ├── 📁 components/
│   │   ├── admin/            # Admin-specific components
│   │   │   ├── Dashboard.tsx       # Stats & overview
│   │   │   ├── JobManagement.tsx   # CRUD for jobs
│   │   │   ├── ApplicantManagement.tsx
│   │   │   └── AdminLayout.tsx
│   │   │
│   │   ├── site/             # Public website components
│   │   │   ├── SiteShell.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Logo.tsx
│   │   │   └── Reveal.tsx
│   │   │
│   │   ├── ui/               # Reusable UI components (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   └── ... (25+ components)
│   │   │
│   │   ├── error-boundary.tsx ✨ NEW
│   │   └── FileUpload.tsx
│   │
│   ├── 📁 constants/ ✨ NEW
│   │   └── index.ts
│   │       ├── ROLES enum
│   │       ├── STORAGE_KEYS
│   │       ├── VALIDATION rules
│   │       ├── ERROR_MESSAGES
│   │       └── ROUTES paths
│   │
│   ├── 📁 types/ ✨ NEW
│   │   └── index.ts
│   │       ├── User, UserProfile, UserRole
│   │       ├── Job, Application
│   │       ├── Education, Experience
│   │       ├── API Response types
│   │       └── Filter types
│   │
│   ├── 📁 hooks/
│   │   ├── use-mobile.tsx
│   │   └── use-custom-hooks.ts ✨ NEW (10+ hooks)
│   │       ├── useDebounce()
│   │       ├── useLocalStorage()
│   │       ├── useAsync()
│   │       └── ... (7 more)
│   │
│   ├── 📁 lib/
│   │   ├── auth-context.tsx 📝 IMPROVED
│   │   ├── auth-context-improved.tsx ✨ NEW (reference)
│   │   ├── validation.ts ✨ NEW
│   │   ├── error-handling.ts ✨ NEW
│   │   ├── error-page.ts
│   │   └── utils.ts
│   │
│   ├── 📁 middleware/ ✨ NEW
│   │   └── auth-middleware.ts (server-side RBAC)
│   │
│   ├── 📁 integrations/
│   │   └── supabase/
│   │       ├── client.ts       # Frontend client
│   │       ├── client.server.ts # Backend client
│   │       ├── auth-middleware.ts
│   │       └── types.ts        # Auto-generated types
│   │
│   ├── 📁 routes/
│   │   ├── __root.tsx          # Root layout
│   │   ├── _authenticated.tsx   # Auth layout 📝 IMPROVED
│   │   ├── index.tsx            # Home page
│   │   ├── about.tsx
│   │   ├── contact.tsx
│   │   ├── login.tsx
│   │   ├── admin-login.tsx
│   │   ├── register.tsx
│   │   ├── jobs.tsx
│   │   ├── jobs.$jobId.tsx
│   │   ├── _authenticated/
│   │   │   ├── admin.tsx
│   │   │   ├── admin.jobs.tsx
│   │   │   └── admin.applicants.tsx
│   │   └── routeTree.gen.ts (auto-generated)
│   │
│   ├── 📁 assets/
│   │   └── images & static files
│   │
│   ├── router.tsx            # TanStack Router config
│   ├── server.ts             # Server entry point
│   ├── start.ts              # App initialization
│   └── styles.css            # Global styles
│
├── 📁 supabase/
│   ├── config.toml           # Supabase config
│   └── migrations/
│       ├── 20260509*.sql     # Initial setup
│       ├── 20260511*.sql     # Admin schema
│       ├── 20260528_add_performance_indexes.sql ✨ NEW
│       └── 20260528_add_constraints_and_soft_delete.sql ✨ NEW
│
├── 📄 Documentation (NEW)
│   ├── QUICK_SUMMARY.md ✨ NEW
│   ├── REDESIGN_AND_BUGFIXES.md ✨ NEW
│   ├── IMPLEMENTATION_GUIDE.md ✨ NEW
│   ├── TESTING_DEPLOYMENT_CHECKLIST.md ✨ NEW
│   └── README.md (existing)
│
└── 📄 Config Files
    ├── .env              # Environment variables
    ├── .gitignore
    ├── vercel.json       # Deployment config
    └── wrangler.jsonc    # Cloudflare Workers config
```

---

## Technology Stack

### Frontend
```
┌─────────────────────────────────────┐
│         TanStack Start              │ SSR Framework
│  (React + File-based Routing)       │
└──────────────┬──────────────────────┘
               │
      ┌────────┴──────────┐
      │                   │
  ┌───▼──────────┐  ┌────▼────────────┐
  │  React 19    │  │ React Router    │
  │  (UI Layer)  │  │ (Routing)       │
  └──────────────┘  └─────────────────┘
      │                   │
  ┌───▼──────────┐  ┌────▼────────────┐
  │ Tailwind CSS │  │  React Query    │
  │ (Styling)    │  │ (State Mgmt)    │
  └──────────────┘  └─────────────────┘
      
  ┌───────────────────────────────────┐
  │ shadcn/ui Components              │
  │ (25+ Pre-built Components)        │
  └───────────────────────────────────┘
      
  ┌───────────────────────────────────┐
  │ Radix UI (Component Library)      │
  └───────────────────────────────────┘
```

### Backend & Services
```
┌──────────────────────────────────────────┐
│         Supabase (BaaS)                  │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────┐  ┌────────────────┐ │
│  │ PostgreSQL     │  │ Authentication │ │
│  │ (Database)     │  │ (Auth.js)      │ │
│  └────────────────┘  └────────────────┘ │
│                                          │
│  ┌────────────────┐  ┌────────────────┐ │
│  │ Storage        │  │ Real-time      │ │
│  │ (S3-like)      │  │ Subscriptions  │ │
│  └────────────────┘  └────────────────┘ │
│                                          │
│  ┌────────────────┐  ┌────────────────┐ │
│  │ Edge Functions │  │ Row-Level      │ │
│  │ (Serverless)   │  │ Security (RLS) │ │
│  └────────────────┘  └────────────────┘ │
│                                          │
└──────────────────────────────────────────┘
```

### Deployment
```
┌────────────────────────┐
│ Cloudflare Workers     │ Edge Computing
│ (Hono Runtime)         │
└───────────┬────────────┘
            │
    ┌───────▼────────┐
    │ wrangler.jsonc │ Deploy Config
    └────────────────┘
```

---

## Data Flow Architecture

### Authentication Flow
```
User Login
    ↓
[login.tsx]
    ↓
submitCredentials()
    ↓
supabase.auth.signInWithPassword()
    ↓
[Supabase Auth Service]
    ↓
JWT Token Generated
    ↓
[AuthContext] ← setSession()
    ↓
fetchRoles(userId) ← NO setTimeout!
    ↓
[supabase.from('user_roles')]
    ↓
setRoles() ← Race condition FIXED ✅
    ↓
[_authenticated.tsx]
    ↓
Check isAdmin() / isHR()
    ↓
Show appropriate dashboard
```

### Data Fetching Flow (IMPROVED)
```
Component Mounts
    ↓
useQuery({
  queryKey: ['jobs'],
  queryFn: async () => {
    // Query is debounced ✅
    const { data, error } = await withTimeout(
      supabase.from('jobs').select(...),
      15000 // Request timeout ✅
    );
    
    if (error) {
      const { message } = mapSupabaseError(error); ✅
      throw new Error(message);
    }
    return data;
  },
  staleTime: 5 * 60 * 1000, // 5-min cache ✅
})
    ↓
[React Query Cache]
    ↓
Render Component
    ↓
Error? → [Error Boundary] ✅
Success? → Display Data
Loading? → Show Skeleton
```

### Form Submission Flow (NEW VALIDATION)
```
User Fills Form
    ↓
onChange Handler
    ↓
updateFormState()
    ↓
[useDebounce] ← 500ms debounce
    ↓
validateWith(schema)
    ↓
├─ Email: validateEmail()
├─ Password: validatePassword()
├─ Phone: validatePhone()
├─ NIK: validateNIK()
└─ Date: validateBirthDate()
    ↓
Errors? → Display to User
Valid? → Enable Submit Button
    ↓
User Submits
    ↓
Try-Catch Block
    ↓
├─ withTimeout(...) ← 15s timeout
├─ mapSupabaseError(...) ← User-friendly message
└─ retryAsync(...) ← 3 retries with backoff
    ↓
Success → toast.success() + redirect
Error → toast.error() + highlight field
```

### Database Query Optimization
```
BEFORE (❌ N+1 Problem):
Dashboard loads
    ↓
7 Separate Queries
├─ SELECT COUNT(*) FROM jobs
├─ SELECT COUNT(*) FROM jobs WHERE status='published'
├─ SELECT COUNT(*) FROM applications
├─ SELECT COUNT(*) FROM applications WHERE status='new'
├─ SELECT COUNT(*) FROM applications WHERE status='screening'
├─ SELECT COUNT(*) FROM applications WHERE status='hired'
└─ SELECT COUNT(*) FROM applications WHERE status='rejected'
    ↓
Total: 7 queries, slow! 🐌

AFTER (✅ Optimized):
Dashboard loads
    ↓
1 SQL Function Call
SELECT * FROM get_admin_stats()
    ↓
Returns all stats in 1 query
Total: 1 query + 12 indexes, fast! ⚡
```

---

## Error Handling Flow

```
API Call
    ↓
Try-Catch Block
    ↓
┌─────────────────────┐
│ Error Occurred?     │
└──────────┬──────────┘
           │
    ┌──────▼──────┐
    │ Map Error   │ mapSupabaseError()
    └──────┬──────┘
           │
    ┌──────▼──────────────────┐
    │ Type of Error?          │
    └──────┬────────┬────┬────┘
           │        │    │
     ┌─────▼──┐  ┌──▼─┐ ┌─▼──┐
     │Network │  │404 │ │403 │
     │Error   │  │    │ │    │
     └────────┘  └────┘ └────┘
           │        │    │
     ┌─────▼──────────────▼─────┐
     │ Get User-Friendly        │
     │ Message from             │
     │ ERROR_MESSAGES           │
     └──────────┬───────────────┘
                │
     ┌──────────▼──────────────┐
     │ Sanitize Message        │
     │ (Remove sensitive data) │
     └──────────┬──────────────┘
                │
     ┌──────────▼──────────────┐
     │ Show Toast/Alert        │
     │ to User                 │
     └──────────┬──────────────┘
                │
     ┌──────────▼──────────────┐
     │ Log to Console          │
     │ + Sentry if needed      │
     └─────────────────────────┘
```

---

## State Management Architecture

### Global State (Auth Context)
```
AuthContext
├── user: User | null
├── session: Session | null
├── roles: RoleType[]
├── loading: boolean
├── error: Error | null
│
├── Methods:
├── signOut()
├── hasRole(role)
├── isAdmin()
├── isHR()
│
└── Listeners:
    └── onAuthStateChange()
```

### Local State (Component Level)
```
Using React Hooks:
├── useState() - Simple state
├── useReducer() - Complex state
├── useContext() - Share state
│
Using Custom Hooks:
├── useDebounce() - Delay state updates
├── useLocalStorage() - Persist state
├── useAsync() - Handle async state
└── useToggle() - Boolean state
```

### Server State (React Query)
```
useQuery({
  queryKey: ['resources', filters],
  queryFn: fetchFromServer,
  staleTime: 5 * 60 * 1000,
  cacheTime: 10 * 60 * 1000,
})
↓
Automatic caching
Automatic refetching
Automatic deduplication
```

---

## Type System Architecture

### Type Hierarchy
```
src/types/index.ts (Root Types)
│
├── User Types
│   ├── User (Supabase Auth)
│   ├── UserProfile (Extended Info)
│   └── UserRole (RBAC)
│
├── Application Types
│   ├── Job
│   ├── Application
│   ├── Education
│   ├── Experience
│   └── ApplicantSkill
│
├── Request/Response Types
│   ├── ApiResponse<T>
│   ├── PaginatedResponse<T>
│   └── DashboardStats
│
├── Filter Types
│   ├── JobFilters
│   ├── ApplicationFilters
│   └── [others]
│
└── Form Types
    ├── LoginFormData
    ├── RegistrationFormData
    └── [others]
```

### Constants Hierarchy
```
src/constants/index.ts (Root Constants)
│
├── ROLES = enum
│   ├── ADMIN
│   ├── HR
│   └── APPLICANT
│
├── STORAGE_KEYS = all localStorage keys
├── VALIDATION = all validation rules
├── ERROR_MESSAGES = all error strings
├── ROUTES = all route paths
├── CACHE_TIMES = all cache durations
└── PAGINATION = default page sizes
```

---

## Security Architecture

### Layer 1: Input Validation (Client)
```
User Input
    ↓
Validation Functions
├─ validateEmail()
├─ validatePassword()
├─ validatePhone()
├─ validateNIK()
└─ validateDate()
    ↓
Zod Schemas
├─ loginSchema
├─ registrationSchema
└─ [others]
    ↓
Error Display
```

### Layer 2: Error Sanitization (Client)
```
API Error
    ↓
Error Occurs
    ↓
Sanitize Message
├─ Remove emails
├─ Remove NIK
├─ Remove card numbers
└─ [sensitive data]
    ↓
Show to User
```

### Layer 3: Authorization (Server)
```
User Request
    ↓
authMiddleware()
    ↓
Verify JWT
    ↓
Fetch User Roles
    ↓
Check requireRoles()
    ↓
├─ Has Role? → Allow
└─ No Role? → 403 Forbidden
```

### Layer 4: Database Security (Supabase)
```
Query Execution
    ↓
Row-Level Security (RLS)
    ↓
├─ User can only see own data
├─ Admin can see all data
└─ HR can see assigned data
    ↓
Return Filtered Results
```

---

## Performance Optimization Strategy

### Frontend Optimization
```
1. Code Splitting
   └─ Lazy load route components

2. Component Optimization
   └─ useCallback, useMemo for expensive computations

3. State Management
   └─ React Query for server state caching

4. User Input
   └─ useDebounce for search (500ms delay)

5. Network
   └─ withTimeout(promise, 15s)

6. Pagination
   └─ Load 50 items per page
```

### Backend Optimization
```
1. Database Indexes (12 new)
   ├─ status indexes
   ├─ foreign key indexes
   ├─ composite indexes
   └─ text search indexes

2. Query Optimization
   ├─ Reduce N+1 queries
   ├─ Use SQL functions
   └─ Aggregate at DB level

3. Caching Strategy
   ├─ 5-min cache for job lists
   ├─ 3-min cache for dashboard stats
   └─ 10-min cache for user profiles
```

---

## Migration & Rollback Plan

### Forward Migration
```
1. Deploy new code
   ├─ New utility files
   ├─ Updated components
   └─ Updated contexts

2. Run database migrations
   ├─ Add performance indexes
   ├─ Add foreign key constraints
   └─ Add soft delete support

3. Verify
   ├─ No errors in console
   ├─ Authentication works
   ├─ RBAC enforced
   └─ Queries optimized
```

### Rollback Plan
```
If issues arise:

1. Immediate
   ├─ Revert code deployment
   └─ Rollback database migrations

2. Investigation
   ├─ Check error logs
   ├─ Review changes
   └─ Identify issue

3. Resolution
   ├─ Fix issue
   ├─ Re-test thoroughly
   └─ Re-deploy
```

---

## Monitoring & Observability

### Monitoring Points
```
1. Error Tracking (Sentry)
   └─ Catch and log all errors

2. Performance Monitoring
   ├─ Database query times
   ├─ API response times
   └─ Frontend rendering times

3. User Analytics
   ├─ Login success rate
   ├─ Form submission rate
   └─ Error frequency

4. Uptime Monitoring
   ├─ API availability
   ├─ Database availability
   └─ Frontend availability
```

---

## Future Architecture Enhancements

```
Phase 2:
├─ Feature flags system
├─ Advanced caching (Redis)
├─ Message queue (Bull, RabbitMQ)
└─ Real-time notifications (Socket.io)

Phase 3:
├─ Machine learning for job matching
├─ Analytics dashboard
├─ Advanced reporting
└─ Automated workflows

Phase 4:
├─ Mobile app
├─ API for third parties
├─ Advanced search (Elasticsearch)
└─ Recommendation engine
```

---

**This architecture is built for scalability, maintainability, and security! 🏗️**
