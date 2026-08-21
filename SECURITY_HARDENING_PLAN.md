# Security hardening plan

This file documents the security hardening applied to the application.

- Firestore authorization is enforced server-side and does not trust client-supplied roles.
- User profile fields that control identity and authorization are protected from unauthorized mutation.
- Configuration access is restricted to professors.
- Sensitive UI rendering is handled with escaped text where applicable.
- Dependency/security automation remains enabled through Dependabot and CodeQL.
