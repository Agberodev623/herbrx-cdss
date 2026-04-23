# Security Specification for HerbRx

## Data Invariants
1. A patient can only read and write their own profile.
2. A patient can only read prescriptions assigned to their patientId.
3. Remedies can only be modified by admins; patients have read-only access to help them search for remedies.
4. Admins have full access to all collections (patients, remedies, prescriptions).
5. Identity roles (Admin) are verified against the `/admins/` collection.

## The Dirty Dozen (Vulnerability Payloads)

1. **Identity Spoofing**: Patient trying to create a prescription for another patient.
   - Target: `prescriptions/p1`, Payload: `{ patientId: "another_user_id", ... }`
2. **Privilege Escalation**: Patient trying to add a remedy.
   - Target: `remedies/r1`, Payload: `{ sicknessName: "test", ... }`
3. **Data Poisoning**: Creating an ID with 1MB of garbage.
   - Target: `patients/VERY_LONG_ID_...`, Payload: `{ ... }`
4. **Accessing PII**: Patient trying to read another patient's profile.
   - Target: `patients/other_patient_id`, Method: `GET`
5. **State Shortcut**: Admin trying to update a terminal state (if any, e.g., if we had "delivered" status).
6. **Orphaned Write**: Creating a prescription with a non-existent remedyId.
   - Payload: `{ remedyId: "invalid_id", ... }`
7. **Bypassing Verification**: Writing as an user with unverified email (if `email_verified` is required).
8. **Shadow Field Injection**: Adding `isAdmin: true` to a patient profile.
9. **Bulk Scrape**: Unauthorized list query on all prescriptions.
10. **Immutable Field Change**: Changing `createdAt` on a patient profile.
11. **Negative Age**: Setting patient age to -5.
12. **Junk Regex**: ID containing illegal characters for injection attempts.

## Success Criteria
All "Dirty Dozen" payloads must return `PERMISSION_DENIED`.
