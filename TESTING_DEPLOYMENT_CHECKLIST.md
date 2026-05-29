# 🧪 Testing & Deployment Checklist

## Pre-Deployment Verification

### Database Setup
- [ ] Login to Supabase Dashboard
- [ ] Go to SQL Editor
- [ ] Copy content from `20260528_add_performance_indexes.sql`
- [ ] Run migration and verify completion
- [ ] Copy content from `20260528_add_constraints_and_soft_delete.sql`
- [ ] Run migration and verify completion
- [ ] Check indexes created: `SELECT * FROM pg_indexes WHERE tablename = 'applications';`
- [ ] Verify foreign keys: `SELECT * FROM information_schema.table_constraints;`

### Code Quality Checks
- [ ] Run `npm run lint` - no errors
- [ ] Check TypeScript: `npx tsc --noEmit` - no type errors
- [ ] Review all `.ts` files for remaining `any` types - should be minimal
- [ ] Check imports use new constants: `grep -r "from '@/constants'" src/`

---

## Authentication & Authorization Testing

### Login Flow
- [ ] User can login with valid email/password
- [ ] Error message for invalid credentials
- [ ] Error message for non-existent user
- [ ] Password field is properly masked
- [ ] "Remember me" functionality (if implemented)
- [ ] Form validation happens on submit

### Role-Based Access
- [ ] Admin user can access `/admin` route
- [ ] HR user can access `/admin` route
- [ ] Applicant gets 403 on `/admin` route
- [ ] Navigation menu shows correct items per role
- [ ] Admin sees all menu items
- [ ] HR sees all menu items
- [ ] Applicant sees only Profile & Jobs

### Logout
- [ ] Logout button works
- [ ] User redirected to login page
- [ ] Session cleared from browser
- [ ] localStorage cleaned appropriately
- [ ] Cannot access protected routes after logout

### Session Persistence
- [ ] Login, refresh page - still logged in
- [ ] Login, close browser - session restored
- [ ] Session expires after reasonable time (check .env)

---

## Form Validation Testing

### Email Validation
- [ ] Valid email accepted: `test@example.com`
- [ ] Invalid format rejected: `test@invalid`
- [ ] Empty field shows error: `Email tidak valid`
- [ ] Special characters handled: `test+1@example.com` ✅

### Password Validation
- [ ] Password < 12 chars rejected
- [ ] Password without uppercase rejected
- [ ] Password without numbers rejected
- [ ] Password without special chars rejected
- [ ] Valid password accepted: `MyPass123!@#`
- [ ] Error messages clear and helpful

### Phone Number (Indonesia)
- [ ] `08123456789` accepted
- [ ] `+6281234567890` accepted
- [ ] `0812345678` rejected (too short)
- [ ] `123456789` rejected (wrong format)

### NIK (National ID)
- [ ] `1234567890123456` accepted (16 digits)
- [ ] `123456789012345` rejected (15 digits)
- [ ] `12345678901234567` rejected (17 digits)
- [ ] Non-numeric rejected

### Birth Date
- [ ] Future dates rejected
- [ ] Too old dates (>100 years) rejected
- [ ] Age < 18 rejected
- [ ] Valid dates accepted
- [ ] Proper error messages shown

### File Upload
- [ ] PDF uploaded successfully
- [ ] JPG/PNG uploaded successfully
- [ ] File > 5MB rejected with message
- [ ] Wrong file type rejected
- [ ] Multiple files handled correctly

---

## Error Handling Testing

### Network Errors
- [ ] Disable internet - shows network error message
- [ ] Timeout after 15 seconds with proper message
- [ ] "Retry" button appears and works
- [ ] Error is logged (check console)

### 404 Errors
- [ ] Navigate to `/nonexistent-page` 
- [ ] Shows custom 404 page
- [ ] "Back to Home" button works

### 403 Authorization Errors
- [ ] Non-admin accessing `/admin` shows 403
- [ ] Clear message: "Anda tidak memiliki akses"
- [ ] Link to return to valid page provided

### Error Boundary
- [ ] Component error caught and displayed
- [ ] "Retry" button works in error UI
- [ ] Error doesn't crash entire app
- [ ] Stack trace visible in development mode

---

## Performance Testing

### Database Queries
- [ ] Open DevTools → Network tab
- [ ] Dashboard loads
- [ ] Should see single SQL request (not 7)
- [ ] Response time < 2 seconds
- [ ] No duplicate queries

### Search Functionality
- [ ] Type in search box
- [ ] Queries should debounce (wait 500ms)
- [ ] No query on every keystroke
- [ ] Results update smoothly

### List Pagination
- [ ] Application list shows < 50 items initially
- [ ] Load more button or pagination works
- [ ] Scrolling doesn't cause lag
- [ ] Page transitions are smooth

### Memory Usage
- [ ] Open DevTools → Memory tab
- [ ] Record heap snapshot on initial load
- [ ] Navigate around app
- [ ] Record heap snapshot again
- [ ] No significant memory increase
- [ ] Close app - memory released

---

## Security Testing

### Input Sanitization
- [ ] Try XSS: `<script>alert('xss')</script>` in search
- [ ] Should be escaped/rendered as text
- [ ] No alert popup
- [ ] Browser console clean (no errors)

### Sensitive Data in Errors
- [ ] Cause an error that would expose email
- [ ] Error message should not show full email
- [ ] Should be masked: `[email hidden]`
- [ ] NIK should be masked: `[HIDDEN]`

### localStorage Security
- [ ] Login and check localStorage
- [ ] Sensitive data (password) NOT stored
- [ ] Session tokens only if necessary
- [ ] Clear after logout

### HTTPS/TLS
- [ ] All API calls use HTTPS
- [ ] No mixed content warnings
- [ ] SSL certificate valid
- [ ] Security headers present

---

## UI/UX Testing

### Responsive Design
- [ ] Mobile (320px) - layout correct
- [ ] Tablet (768px) - layout correct
- [ ] Desktop (1920px) - layout correct
- [ ] No horizontal scrolling except intentional

### Loading States
- [ ] Loading spinners appear while fetching
- [ ] Disabled state on submit buttons during loading
- [ ] Skeleton loaders where applicable
- [ ] Loading is not too fast (user sees feedback)

### Error Messages
- [ ] Error messages are clear
- [ ] Messages are in Indonesian
- [ ] Color coding obvious (red for errors)
- [ ] Messages appear near relevant input

### Success Feedback
- [ ] Success toast appears after form submit
- [ ] Message is clear: "Registrasi berhasil!"
- [ ] Toast auto-dismisses after 3-4 seconds
- [ ] User redirected appropriately

### Keyboard Navigation
- [ ] Tab through form fields in order
- [ ] Enter submits form
- [ ] Escape closes dialogs
- [ ] Focus visible on all interactive elements

---

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

---

## Regression Testing

### Core Features Still Work
- [ ] Homepage loads
- [ ] Job listing displays correctly
- [ ] Job detail page works
- [ ] Admin dashboard loads
- [ ] Job management works
- [ ] Applicant management works
- [ ] Profile page loads

### No New Bugs Introduced
- [ ] No console errors
- [ ] No console warnings (except expected)
- [ ] No 404 for resources
- [ ] All links work

---

## Performance Benchmarks

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Dashboard Load | < 2s | __ | ☐ |
| Job List Load | < 1.5s | __ | ☐ |
| Search Response | < 300ms | __ | ☐ |
| Page Navigation | < 500ms | __ | ☐ |
| Mobile Load | < 3s | __ | ☐ |
| Lighthouse Score | > 80 | __ | ☐ |

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] Code reviewed
- [ ] Environment variables configured
- [ ] Database backups taken
- [ ] Staging environment tested

### Deployment
- [ ] Deploy to staging first
- [ ] Run all tests on staging
- [ ] Performance check on staging
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Check uptime

### Post-Deployment
- [ ] Smoke test on production
- [ ] Monitor performance metrics
- [ ] Check error rates
- [ ] User feedback collected
- [ ] Issues logged and tracked
- [ ] Rollback plan ready (but hopefully not needed!)

---

## Monitoring Setup

### Error Tracking (Sentry)
- [ ] [ ] Sentry account created
- [ ] [ ] Project initialized
- [ ] [ ] Error boundary integrated
- [ ] [ ] Testing error capture works
- [ ] [ ] Alerts configured

### Performance Monitoring
- [ ] [ ] Monitoring tool setup (New Relic, DataDog, etc.)
- [ ] [ ] Database query logging enabled
- [ ] [ ] API response time tracking
- [ ] [ ] User action analytics

### Uptime Monitoring
- [ ] [ ] Uptime checker configured
- [ ] [ ] SMS/Email alerts setup
- [ ] [ ] Status page created

---

## Documentation

- [ ] Code comments updated
- [ ] README.md updated with new utils
- [ ] API documentation current
- [ ] Deployment guide updated
- [ ] Troubleshooting guide created

---

## Training & Handoff

- [ ] Team trained on new code structure
- [ ] Custom hooks documented
- [ ] Constants system explained
- [ ] Error handling flow explained
- [ ] Database changes documented
- [ ] Runbooks created for common issues

---

## Sign-Off

- [ ] QA Team: ✅ ___________  Date: __________
- [ ] Dev Lead: ✅ ___________  Date: __________
- [ ] Product: ✅ ___________  Date: __________
- [ ] Operations: ✅ ___________ Date: __________

---

## Notes

```
[Space for any additional notes, issues, or observations]




```

---

**Good luck with your deployment! 🚀**
