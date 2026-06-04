# Firebase Security Rules Fix

## Issue
You're seeing "Missing or insufficient permissions" errors in the console. This is because Firebase security rules are blocking read/write operations for the new payment collections.

## Solution

Your current rules don't include the new `payments` and `task_approvals` collections. Add these rules to your existing rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && (
        request.auth.uid == userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'startup'
      );
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /tasks/{taskId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.companyId ||
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['participants']) && request.resource.data.participants == resource.data.diff(resource.data).newValue().intValue() + 1)
      );
      allow delete: if request.auth != null && request.auth.uid == resource.data.companyId;
    }

    match /submissions/{submissionId} {
      allow create: if request.auth != null && request.auth.uid == request.resource.data.studentId;
      allow read: if request.auth != null &&
        (request.auth.uid == resource.data.studentId || request.auth.uid == resource.data.companyId);
      allow update: if request.auth != null && request.auth.uid == resource.data.studentId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.studentId;
    }

    // Payment collection rules
    match /payments/{paymentId} {
      allow read: if request.auth != null &&
        (request.auth.uid == resource.data.studentId || request.auth.uid == resource.data.companyId);
      allow create: if request.auth != null && request.auth.uid == request.resource.data.companyId;
    }

    // Task approvals collection rules
    match /task_approvals/{approvalId} {
      allow read: if request.auth != null &&
        (request.auth.uid == resource.data.studentId || request.auth.uid == resource.data.companyId);
      allow create: if request.auth != null && request.auth.uid == request.resource.data.companyId;
    }
  }
}
```

## How to Update

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: "skillstreetofficial"
3. Go to "Firestore Database" → "Rules" tab
4. Add the `payments` and `task_approvals` match blocks at the end (before the closing braces)
5. Click "Publish"

## What This Fixes

After updating the rules, these errors will be resolved:
- "Missing or insufficient permissions" when fetching payment history
- "Missing or insufficient permissions" when processing payments
- "Missing or insufficient permissions" when creating payment records

## Current Status

✅ Server is running on port 3001
✅ File upload endpoint is fixed
✅ B2 storage is authorized
⏳ Firebase security rules need to be updated for payment collections
