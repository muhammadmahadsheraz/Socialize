# Google Sign-In Workflow

This document explains how Google Sign-In works with VibeCheck, including signup, signin, and how we handle missing data.

---

## Table of Contents
1. [How Google Sign-In Works](#how-google-sign-in-works)
2. [Complete Signup Flow](#complete-signup-flow)
3. [Complete Signin Flow](#complete-signin-flow)
4. [Handling Missing Data](#handling-missing-data)
5. [API Endpoints](#api-endpoints)

---

## How Google Sign-In Works

### What Google Provides
When a user signs in with Google, Google returns:
```json
{
  "id": "google_user_id_123",
  "email": "user@gmail.com",
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/...",
  "email_verified": true
}
```

### What Google Does NOT Provide
- ❌ Password
- ❌ Phone number
- ❌ Age
- ❌ Favorite places

---

## Complete Signup Flow

### Step 1: User Opens App
User sees the login screen with a "Sign in with Google" button.

### Step 2: User Taps "Sign in with Google"
**Frontend action:**
```
User taps button
→ React Native opens Google Sign-In dialog
→ User selects their Google account
→ Google returns ID token to frontend
```

### Step 3: Frontend Sends ID Token to Backend
**Frontend sends:**
```
POST /api/auth/google/verify
{
  "idToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Step 4: Backend Verifies Token with Google
**Backend does:**
```
1. Receives ID token from frontend
2. Calls Google API to verify the token is legitimate
3. Extracts user data: email, name, picture
4. Checks if user already exists in database
```

### Step 5: New User — Create Account
**If user doesn't exist:**
```
1. Backend creates new user with:
   - email: from Google
   - fullname: from Google
   - profilePic: from Google
   - password: random generated (user won't use it)
   - phoneNumber: placeholder "+00000000000"
   - age: null (user can update later)
   - favouritePlaces: empty array

2. Backend auto-creates free subscription

3. Backend generates JWT token

4. Backend returns to frontend:
   {
     "success": true,
     "token": "jwt_token_here",
     "user": {
       "id": "507f1f77bcf86cd799439011",
       "email": "user@gmail.com",
       "fullname": "John Doe",
       "profilePic": "https://lh3.googleusercontent.com/...",
       "phoneNumber": "+00000000000",  // placeholder
       "age": null,
       "isVerified": true,  // Google verified the email
       "favouritePlaces": [],
       "createdAt": "2026-05-13T10:30:00.000Z",
       "updatedAt": "2026-05-13T10:30:00.000Z"
     }
   }
```

### Step 6: Frontend Stores Token
**Frontend does:**
```
1. Receives JWT token
2. Stores in secure storage (AsyncStorage or Keychain)
3. Redirects to home screen
4. User is now logged in
```

### Step 7: User Completes Profile (Optional)
**User can now:**
```
PUT /api/users/:userId
{
  "phoneNumber": "+1234567890",
  "age": 25,
  "favouritePlaces": ["New York", "Paris"]
}
```

---

## Complete Signin Flow

### Step 1: User Opens App (Already Has Account)
User sees login screen.

### Step 2: User Taps "Sign in with Google"
**Frontend action:**
```
User taps button
→ React Native opens Google Sign-In dialog
→ User selects their Google account
→ Google returns ID token to frontend
```

### Step 3: Frontend Sends ID Token to Backend
**Frontend sends:**
```
POST /api/auth/google/verify
{
  "idToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Step 4: Backend Verifies Token with Google
**Backend does:**
```
1. Receives ID token from frontend
2. Calls Google API to verify the token
3. Extracts email from token
4. Checks if user exists in database
```

### Step 5: Existing User — Return Token
**If user exists:**
```
1. Backend finds user by email
2. Backend generates JWT token
3. Backend returns to frontend:
   {
     "success": true,
     "token": "jwt_token_here",
     "user": {
       "id": "507f1f77bcf86cd799439011",
       "email": "user@gmail.com",
       "fullname": "John Doe",
       "profilePic": "https://lh3.googleusercontent.com/...",
       "phoneNumber": "+1234567890",
       "age": 25,
       "isVerified": true,
       "favouritePlaces": ["New York", "Paris"],
       "createdAt": "2026-05-13T10:30:00.000Z",
       "updatedAt": "2026-05-13T10:35:00.000Z"
     }
   }
```

### Step 6: Frontend Stores Token
**Frontend does:**
```
1. Receives JWT token
2. Stores in secure storage
3. Redirects to home screen
4. User is logged in
```

---

## Handling Missing Data

### What We Do

| Data | From Google? | If Missing | User Can Update? |
|------|-------------|-----------|------------------|
| Email | ✅ Yes | Error (required) | ❌ No |
| Name | ✅ Yes | Use "User" | ✅ Yes (via PUT /users/:id) |
| Picture | ✅ Yes | Use default avatar | ✅ Yes (via PUT /users/:id) |
| Phone | ❌ No | Placeholder "+00000000000" | ✅ Yes (via PUT /users/:id) |
| Age | ❌ No | null | ✅ Yes (via PUT /users/:id) |
| Favorite Places | ❌ No | Empty array | ✅ Yes (via POST /users/:id/favourite-places) |
| Password | ❌ No | Random generated | ❌ No (not needed for Google users) |

### Example: New Google User

**Google provides:**
```json
{
  "email": "john@gmail.com",
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/..."
}
```

**Backend creates user with:**
```json
{
  "email": "john@gmail.com",
  "fullname": "John Doe",
  "profilePic": "https://lh3.googleusercontent.com/...",
  "phoneNumber": "+00000000000",  // placeholder
  "password": "aB3$xY9@kL2#mN5",  // random, never used
  "age": null,
  "isVerified": true,
  "favouritePlaces": []
}
```

**User can later update:**
```
PUT /api/users/:userId
{
  "phoneNumber": "+1234567890",
  "age": 28,
  "favouritePlaces": ["Paris", "Tokyo"]
}
```

---

## API Endpoints

### 1. Verify Google ID Token (New Endpoint Needed)
**Endpoint:** `POST /api/auth/google/verify`

**Request:**
```json
{
  "idToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK) — New User:**
```json
{
  "success": true,
  "message": "User created and signed in",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@gmail.com",
    "fullname": "John Doe",
    "profilePic": "https://lh3.googleusercontent.com/...",
    "phoneNumber": "+00000000000",
    "age": null,
    "isVerified": true,
    "favouritePlaces": [],
    "createdAt": "2026-05-13T10:30:00.000Z",
    "updatedAt": "2026-05-13T10:30:00.000Z"
  }
}
```

**Response (200 OK) — Existing User:**
```json
{
  "success": true,
  "message": "User signed in",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@gmail.com",
    "fullname": "John Doe",
    "profilePic": "https://lh3.googleusercontent.com/...",
    "phoneNumber": "+1234567890",
    "age": 28,
    "isVerified": true,
    "favouritePlaces": ["Paris", "Tokyo"],
    "createdAt": "2026-05-13T10:30:00.000Z",
    "updatedAt": "2026-05-13T10:35:00.000Z"
  }
}
```

**Error — Invalid token (401):**
```json
{
  "success": false,
  "message": "Invalid Google ID token"
}
```

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER OPENS APP                                │
├─────────────────────────────────────────────────────────────────┤
│ Sees login screen with "Sign in with Google" button              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  User taps       │
                    │  "Sign in with   │
                    │  Google"         │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────┐
                    │  FRONTEND ONLY               │
                    │  Google Sign-In Dialog opens │
                    │  User selects account        │
                    │  Google returns ID token     │
                    └──────────────────────────────┘
                              │
                              ▼
                    POST /api/auth/google/verify
                    { idToken: "..." }
                              │
                              ▼
                    ┌──────────────────────────────┐
                    │  BACKEND                     │
                    │  1. Verify token with Google │
                    │  2. Extract email, name, pic │
                    │  3. Check if user exists     │
                    └──────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
        ┌──────────────────┐      ┌──────────────────┐
        │  NEW USER        │      │  EXISTING USER   │
        │  Create account  │      │  Return existing │
        │  with Google     │      │  user data       │
        │  data + defaults │      │                  │
        └──────────────────┘      └──────────────────┘
                │                           │
                └─────────────┬─────────────┘
                              ▼
                    Return JWT token
                    + user data
                              │
                              ▼
                    ┌──────────────────────────────┐
                    │  FRONTEND                    │
                    │  1. Store JWT in secure      │
                    │     storage                  │
                    │  2. Redirect to home screen  │
                    │  3. User is logged in        │
                    └──────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────┐
                    │  USER CAN NOW:               │
                    │  - Use app                   │
                    │  - Update profile (optional) │
                    │  - Upgrade to pro            │
                    └──────────────────────────────┘
```

---

## Key Differences: Google Sign-In vs Email/Password

| Feature | Email/Password | Google Sign-In |
|---------|----------------|----------------|
| Password | User creates | Not needed |
| Email verification | Manual | Auto-verified by Google |
| Phone number | Required at signup | Optional (can add later) |
| Profile picture | Optional | From Google |
| Account creation | Explicit signup | Implicit (on first signin) |
| Password reset | Needed | Not needed |

---

## Security Notes

1. **ID Token Verification** — Backend verifies the token with Google's servers, not just decoding it
2. **JWT Token** — Backend generates a separate JWT for the app (not using Google's token directly)
3. **Secure Storage** — Frontend stores JWT in secure storage (not localStorage)
4. **No Password Stored** — Google users have a random password that's never used

---

## Next Steps

1. Frontend dev implements Google Sign-In using `react-native-google-signin`
2. Frontend sends ID token to `POST /api/auth/google/verify`
3. Backend verifies and returns JWT token
4. Frontend stores JWT and uses it for all subsequent API calls

