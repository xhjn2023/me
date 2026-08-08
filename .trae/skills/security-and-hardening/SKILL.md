---
name: security-and-hardening
description: Hardens code against vulnerabilities. Use when handling user input, authentication, data storage, or external integrations. Use when building any feature that accepts untrusted data, manages user sessions, or interacts with third-party services.
---

# Security and Hardening

## Overview

Security-first development. Treat every external input as hostile, every secret as sacred, and every authorization check as mandatory. Security isn't a phase — it's a constraint on every line of code.

## Threat Model First

1. **Map the trust boundaries.** Where does untrusted data cross into your system? HTTP requests, form fields, file uploads, webhooks, third-party APIs, message queues, and LLM output.
2. **Name the assets.** What's worth stealing or breaking? Credentials, PII, payment data, admin actions.
3. **Run STRIDE over each boundary:**

| Threat | Ask | Mitigation |
|---|---|---|
| Spoofing | Can someone impersonate a user? | Authentication, signature verification |
| Tampering | Can data be altered? | Integrity checks, parameterized queries, HTTPS |
| Repudiation | Can an action be denied? | Audit logging of security events |
| Information disclosure | Can data leak? | Encryption, field allowlists, generic errors |
| Denial of service | Can it be overwhelmed? | Rate limiting, input size caps, timeouts |
| Elevation of privilege | Can a user gain extra rights? | Authorization checks, least privilege |

## The Three-Tier Boundary System

### Always Do (No Exceptions)
- Validate all external input at the system boundary
- Parameterize all database queries — never concatenate user input into SQL
- Encode output to prevent XSS (use framework auto-escaping)
- Use HTTPS for all external communication
- Never commit secrets (API keys, tokens, passwords)
- Use environment variables for configuration

### Ask First
- Adding new authentication providers or changing auth flow
- Changing encryption algorithms or key management
- Modifying rate limiting or security headers
- Adding cookies or changing cookie settings

### Never Do
- Use `eval()` or `Function()` with user input
- Disable security features (CORS, CSP, CORS, HSTS) without explicit approval
- Log sensitive data (passwords, tokens, PII)
- Trust client-side validation alone — always validate server-side
- Use deprecated cryptographic algorithms (MD5, SHA1 for security)

## OWASP Top 10 Prevention

- **A01 Broken Access Control**: Check authorization on every request. Don't rely on client-side hiding.
- **A02 Cryptographic Failures**: Use bcrypt/argon2 for passwords. Encrypt sensitive data at rest.
- **A03 Injection**: Parameterize all queries. Validate and sanitize all inputs.
- **A04 Insecure Design**: Threat model before coding. Limit resource consumption.
- **A05 Security Misconfiguration**: Remove default credentials. Disable unnecessary features.
- **A06 Vulnerable Components**: Keep dependencies updated. Audit with `npm audit`.
- **A07 Auth Failures**: Rate-limit login attempts. Use secure session management.
- **A08 Software & Data Integrity**: Verify signatures. Pin dependency versions.
- **A09 Logging & Monitoring**: Log security events. Never log sensitive data.
- **A10 SSRF**: Validate and sanitize URLs. Use allowlists for external requests.