# WebsiteAudit AI Test Checklist

## Authentication
- Register with valid credentials
- Reject duplicate email
- Login with valid credentials
- Reject invalid password
- Forgot password request
- Reset password with token
- Protected route redirect when unauthenticated

## Audit Workflow
- Create audit with valid URL
- Reject invalid URL format
- Reject private/local URL (SSRF protection)
- Stage progress transitions: pending → running → completed/failed
- Audit report loads after completion
- Rescan creates new audit record

## Database and Ownership
- Users can only read their own websites/audits/findings
- Website list includes latest audit status
- Audit history sorts by newest first

## UI/UX
- Mobile navigation drawer opens/closes
- Command menu opens with Cmd/Ctrl + K
- Theme toggle persists selection
- Tables remain usable on small screens via horizontal scrolling
- Empty states render with actionable copy

## Security
- URL validator blocks localhost and private ranges
- Server-only secrets are not exposed to client code
- Sessions stored via httpOnly cookie token
