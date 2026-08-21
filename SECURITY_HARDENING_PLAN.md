# Security hardening plan

This file documents the security hardening applied to the application.

- Firestore authorization is enforced server-side and does not trust client-supplied roles.
- User profile fields that control identity and authorization are protected from unauthorized mutation.
- Configuration access is restricted to professors.
- Sensitive administrative rendering escapes untrusted database values before inserting them into HTML.
- Dependency/security automation remains enabled through Dependabot and CodeQL.
