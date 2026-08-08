# Security Specification for Guardian Safety App

## Data Invariants
1. A user document at `/users/{userId}` can only be created, read, updated, or deleted by the authenticated user whose `request.auth.uid == userId`.
2. All subcollections (`contacts`, `audioRecords`, `smsLogs`) belong directly to a user under `/users/{userId}/...` and can only be accessed or modified if `request.auth.uid == userId`.
3. Identity integrity: Any `userId` field present inside document data must strictly equal `request.auth.uid`.
4. String length bounds and key structural constraints are strictly enforced on all incoming data fields to prevent denial-of-wallet resource attacks.

## The "Dirty Dozen" Payloads (Security Attack Vectors Tested)
1. **Unauthenticated Read/Write**: Reading `/users/usr123` or writing `/users/usr123` without authentication -> `PERMISSION_DENIED`.
2. **Cross-User Data Leak**: User A trying to read or modify `/users/userB/contacts/c1` -> `PERMISSION_DENIED`.
3. **ID Poisoning Attack**: Injecting a 2KB junk character string as `userId` or `contactId` -> `PERMISSION_DENIED`.
4. **Shadow Key Injection**: Adding unwanted administrative fields like `isAdmin: true` to a user profile -> `PERMISSION_DENIED`.
5. **Identity Spoofing**: User A creating a contact under `/users/userA/contacts/c1` with `userId: "userB"` -> `PERMISSION_DENIED`.
6. **Oversized String Payload**: Attempting to save a 500KB string in `friendName` or `message` field -> `PERMISSION_DENIED`.
7. **Invalid Enum Value**: Saving `status: "Hacked"` in `smsLogs` instead of `Sent` or `Failed` -> `PERMISSION_DENIED`.
8. **Subcollection Orphan Attack**: Creating a contact without a valid parent `userId` matching `request.auth.uid` -> `PERMISSION_DENIED`.
9. **Blanket Query Scraping**: Running an un-filtered `list` query across `/users` -> `PERMISSION_DENIED`.
10. **Timestamp Manipulation**: Inserting future/past spoofed dates without strict bounds -> `PERMISSION_DENIED`.
11. **Type Confusion**: Passing a number for `friendName` or boolean for `recipients` -> `PERMISSION_DENIED`.
12. **Immutable Field Mutation**: Trying to change `uid` on an existing `/users/{userId}` document -> `PERMISSION_DENIED`.
