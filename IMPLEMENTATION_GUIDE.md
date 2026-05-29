# Panduan Implementasi - Struktur Baru & Utility

## Daftar Isi
1. [Constants & Types](#constants--types)
2. [Validation](#validation)
3. [Error Handling](#error-handling)
4. [Custom Hooks](#custom-hooks)
5. [Authentication](#authentication)
6. [Contoh Implementasi](#contoh-implementasi)

---

## Constants & Types

### Menggunakan Constants

#### Sebelumnya (❌ Tidak Ideal):
```typescript
const items = [];
if (user.role === "admin" || user.role === "hr") {
  items.push({ to: "/admin", label: "Dashboard" });
}
```

#### Sekarang (✅ Ideal):
```typescript
import { ROLES } from '@/constants';
import { useAuth } from '@/lib/auth-context';

function Navigation() {
  const { isAdmin, isHR } = useAuth();
  const items = [];
  
  if (isAdmin() || isHR()) {
    items.push({ to: "/admin", label: "Dashboard" });
  }
}
```

### Type Safety

#### Sebelumnya (❌ Tidak Ideal):
```typescript
const [data, setData] = useState<any>(null); // Kehilangan type checking
const user: any = data; // Bisa akses property apapun
```

#### Sekarang (✅ Ideal):
```typescript
import type { Application, UserProfile } from '@/types';

const [data, setData] = useState<Application | null>(null);
const user: UserProfile = data.applicant; // Type-safe!

// IDE akan memberi error jika mengakses property yang tidak ada
```

---

## Validation

### 1. Simple Function Validation

```typescript
import { 
  validateEmail, 
  validatePhone, 
  validatePassword,
  validateBirthDate 
} from '@/lib/validation';

// Gunakan saat input dari user
function LoginForm() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // Validate on change
    if (!validateEmail(value)) {
      setErrors(['Email tidak valid']);
    } else {
      setErrors([]);
    }
  };

  return (
    <div>
      <input 
        type="email" 
        value={email} 
        onChange={handleEmailChange}
      />
      {errors.map(err => <span className="text-red-500">{err}</span>)}
    </div>
  );
}
```

### 2. Zod Schema Validation

```typescript
import { loginSchema, registrationSchema } from '@/lib/validation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    // data type is automatically inferred as LoginFormData
    const { error } = await supabase.auth.signInWithPassword(data);
    // ...
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} placeholder="Email" />
      {errors.email && <span>{errors.email.message}</span>}

      <input {...register('password')} type="password" placeholder="Password" />
      {errors.password && <span>{errors.password.message}</span>}

      <button type="submit">Login</button>
    </form>
  );
}
```

### 3. File Validation

```typescript
import { validateFileSize, validateFileType } from '@/lib/validation';
import { VALIDATION } from '@/constants';

function FileUpload() {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size
    if (!validateFileSize(file, VALIDATION.FILE_MAX_SIZE)) {
      alert('File terlalu besar. Maksimal 5MB');
      return;
    }

    // Check type
    if (!validateFileType(file, ['application/pdf', 'image/jpeg'])) {
      alert('Hanya PDF dan JPEG yang didukung');
      return;
    }

    // File is valid
    console.log('File OK:', file);
  };

  return (
    <input 
      type="file" 
      onChange={handleFileChange}
      accept=".pdf,.jpg,.jpeg"
    />
  );
}
```

---

## Error Handling

### 1. Error Boundary untuk Components

```typescript
import { ErrorBoundary } from '@/components/error-boundary';

// Wrap komponen yang mungkin error
function App() {
  return (
    <ErrorBoundary 
      onError={(error, errorInfo) => {
        // Optional: Send to error tracking service
        console.error('Component error:', error);
      }}
    >
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### 2. Try-Catch dengan Error Handling

```typescript
import { mapSupabaseError, withTimeout, retryAsync } from '@/lib/error-handling';
import { REQUEST_TIMEOUT_MS } from '@/constants';

async function fetchJobs() {
  try {
    const promise = supabase
      .from('jobs')
      .select('*')
      .eq('status', 'published');

    // Add timeout protection
    const { data, error } = await withTimeout(promise, REQUEST_TIMEOUT_MS);

    if (error) {
      const { message, code } = mapSupabaseError(error);
      console.error(`Error [${code}]:`, message);
      showErrorToast(message); // Show to user
      return null;
    }

    return data;
  } catch (error) {
    const { message } = mapSupabaseError(error);
    showErrorToast(message);
    return null;
  }
}
```

### 3. Retry dengan Exponential Backoff

```typescript
import { retryAsync } from '@/lib/error-handling';

async function fetchWithRetry() {
  try {
    const data = await retryAsync(
      () => supabase.from('applications').select('*'),
      3, // max attempts
      1000 // initial delay in ms
    );
    return data;
  } catch (error) {
    console.error('Failed after retries:', error);
  }
}
```

---

## Custom Hooks

### 1. useDebounce - Optimize Search

```typescript
import { useDebounce } from '@/hooks/use-custom-hooks';

function JobSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 500); // Wait 500ms

  const { data: results } = useQuery({
    queryKey: ['jobs', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      return supabase
        .from('jobs')
        .select('*')
        .ilike('title', `%${debouncedQuery}%`);
    },
  });

  return (
    <div>
      <input 
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Cari lowongan..."
      />
      {results?.map(job => <JobCard key={job.id} job={job} />)}
    </div>
  );
}
```

### 2. useLocalStorage - Form Draft Saving

```typescript
import { useLocalStorage } from '@/hooks/use-custom-hooks';
import { STORAGE_KEYS } from '@/constants';

function RegistrationForm() {
  const [formData, setFormData] = useLocalStorage(
    STORAGE_KEYS.DRAFT_FORM,
    { name: '', email: '', phone: '' }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated); // Auto-saved to localStorage
  };

  return (
    <form>
      <input 
        name="name" 
        value={formData.name} 
        onChange={handleChange}
      />
      <input 
        name="email" 
        value={formData.email} 
        onChange={handleChange}
      />
      {/* ... */}
    </form>
  );
}
```

### 3. useAsync - Handle Async State

```typescript
import { useAsync } from '@/hooks/use-custom-hooks';

function ApplicationDetail({ applicationId }) {
  const { 
    value: application, 
    status, 
    error, 
    execute: refetch 
  } = useAsync(
    () => supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single(),
    true // immediate fetch
  );

  if (status === 'pending') return <div>Loading...</div>;
  if (status === 'error') return <div>Error: {error?.message}</div>;
  
  return (
    <div>
      <ApplicationCard app={application} />
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### 4. useToggle - Simple Boolean State

```typescript
import { useToggle } from '@/hooks/use-custom-hooks';

function ApplicantCard() {
  const [isExpanded, toggleExpand] = useToggle(false);

  return (
    <div>
      <h3>{applicant.name}</h3>
      {isExpanded && <DetailedInfo />}
      <button onClick={toggleExpand}>
        {isExpanded ? 'Collapse' : 'Expand'}
      </button>
    </div>
  );
}
```

---

## Authentication

### 1. Menggunakan Auth Context (Improved)

```typescript
import { useAuth } from '@/lib/auth-context';
import { ROLES } from '@/constants';

function Dashboard() {
  const { 
    user, 
    loading, 
    error,
    roles,
    isAdmin, 
    isHR,
    hasRole,
    signOut 
  } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>Not logged in</div>;

  return (
    <div>
      <h1>Welcome {user.email}</h1>
      
      {/* Check single role */}
      {isAdmin() && <AdminPanel />}
      
      {/* Check multiple roles */}
      {hasRole([ROLES.ADMIN, ROLES.HR]) && <ManagerPanel />}
      
      {/* Check array or single */}
      {hasRole(ROLES.APPLICANT) && <ApplicantPanel />}

      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

### 2. Role-Based Route Protection

```typescript
// Already fixed in src/routes/_authenticated.tsx

// Contoh menggunakan untuk custom route:
import { Navigate } from '@tanstack/react-router';

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!isAdmin()) return <Navigate to="/403" />;
  
  return children;
}

// Usage
<AdminRoute>
  <AdminDashboard />
</AdminRoute>
```

---

## Contoh Implementasi

### Complete Registration Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registrationSchema } from '@/lib/validation';
import { supabase } from '@/integrations/supabase/client';
import { mapSupabaseError, withTimeout } from '@/lib/error-handling';
import { REQUEST_TIMEOUT_MS } from '@/constants';
import { toast } from 'sonner';

function RegistrationForm() {
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting },
    watch 
  } = useForm({
    resolver: zodResolver(registrationSchema),
  });

  const onSubmit = async (data) => {
    try {
      // Sign up
      const signUpPromise = supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      const { data: authData, error: authError } = await withTimeout(
        signUpPromise,
        REQUEST_TIMEOUT_MS
      );

      if (authError) {
        const { message } = mapSupabaseError(authError);
        toast.error(message);
        return;
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          nik: data.nik,
          full_name: data.full_name,
          gender: data.gender,
          birth_date: data.birth_date,
          phone: data.phone,
          address_domicile: data.address_domicile,
          city: data.city,
        });

      if (profileError) {
        const { message } = mapSupabaseError(profileError);
        toast.error(message);
        return;
      }

      toast.success('Registrasi berhasil! Silakan login.');
      navigate({ to: '/login' });
    } catch (error) {
      const { message } = mapSupabaseError(error);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Email</label>
        <input {...register('email')} type="email" />
        {errors.email && <span className="text-red-500">{errors.email.message}</span>}
      </div>

      <div>
        <label>Password</label>
        <input {...register('password')} type="password" />
        {errors.password && <span className="text-red-500">{errors.password.message}</span>}
      </div>

      <div>
        <label>NIK</label>
        <input {...register('nik')} placeholder="16 digit" />
        {errors.nik && <span className="text-red-500">{errors.nik.message}</span>}
      </div>

      <div>
        <label>Nama Lengkap</label>
        <input {...register('full_name')} />
        {errors.full_name && <span className="text-red-500">{errors.full_name.message}</span>}
      </div>

      {/* More fields... */}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}
```

### Dashboard with Type Safety

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Job, Application, DashboardStats } from '@/types';
import { CACHE_TIMES } from '@/constants';
import { ErrorBoundary } from '@/components/error-boundary';

function Dashboard() {
  // Type-safe query
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_admin_stats'); // Returns typed data

      if (error) throw error;
      return data;
    },
    staleTime: CACHE_TIMES.DASHBOARD_STATS,
  });

  // Type-safe list query
  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'published');

      if (error) throw error;
      return data;
    },
  });

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <StatsGrid stats={stats} loading={statsLoading} error={statsError} />
        <JobsList jobs={jobs} />
      </div>
    </ErrorBoundary>
  );
}
```

---

## Migration Checklist

- [ ] Import Constants dari `@/constants` daripada hardcode
- [ ] Import Types dari `@/types` daripada gunakan `any`
- [ ] Gunakan validation utilities dari `@/lib/validation`
- [ ] Wrap components dengan `<ErrorBoundary>`
- [ ] Gunakan `mapSupabaseError` untuk error messages
- [ ] Gunakan custom hooks untuk state management
- [ ] Gunakan `useAuth()` methods: `isAdmin()`, `isHR()`, `hasRole()`
- [ ] Run database migrations di Supabase
- [ ] Test all authentication flows
- [ ] Test error boundaries
- [ ] Test form validation

---

## Performance Tips

1. **Use useDebounce untuk search:**
   ```typescript
   const debouncedSearch = useDebounce(searchQuery, 500);
   ```

2. **Enable query caching:**
   ```typescript
   staleTime: CACHE_TIMES.JOBS_LIST
   ```

3. **Use server functions untuk complex queries:**
   ```typescript
   const { data } = await supabase.rpc('get_admin_stats');
   ```

4. **Paginate large lists:**
   ```typescript
   .limit(PAGINATION.DEFAULT_PAGE_SIZE)
   .offset(page * PAGINATION.DEFAULT_PAGE_SIZE)
   ```

5. **Use lazy loading for heavy components:**
   ```typescript
   const HeavyComponent = lazy(() => import('./Heavy'));
   ```
