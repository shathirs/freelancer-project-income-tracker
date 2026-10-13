# User authentication

The app has one account type: a freelancer. Registration creates that account. Login proves who they are. Logout ends the session in the browser.

Clients, projects, and payments are records the freelancer manages. They are not separate login accounts.

## What was implemented

- Register a freelancer with name, email, and password.
- Log in with email and password.
- Hash the password with bcrypt before it is stored.
- Return a JWT that expires after 7 days.
- Protect `GET /api/auth/me` and the dashboard route.
- Log out by deleting the token from the browser.

## User record

Collection: `users`

| Field | Notes |
|-------|--------|
| `name` | Required, trimmed |
| `email` | Required, unique, stored in lowercase |
| `password` | Required, at least 6 characters, stored as a bcrypt hash, excluded from normal queries |
| `phone` | Optional text. Defaults to an empty string |
| `notifications` | Four switches. Project updates, payment received, and client messages default to on. Marketing defaults to off |
| `theme` | `light`, `dark`, or `system`. Defaults to `light` |
| `language` | Defaults to `English` |
| `createdAt` | Added automatically |
| `updatedAt` | Added automatically |

Defined in `backend/src/models/user.model.ts`.

## API

Base path: `http://localhost:5000/api/auth`

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| `POST` | `/register` | Public | Create an account and return a token |
| `POST` | `/login` | Public | Check email and password, then return a token |
| `GET` | `/me` | JWT required | Return the logged-in user |
| `PUT` | `/profile` | JWT required | Update name, email, and phone |
| `PUT` | `/password` | JWT required | Change the password |
| `PUT` | `/preferences` | JWT required | Save notifications, theme, and language |

Profile, password, and preference details are in `documentation/settings.md`.

### Register

Request:

```json
{
  "name": "Shathir",
  "email": "shathir@example.com",
  "password": "secret123"
}
```

Success (`201`):

```json
{
  "token": "<jwt>",
  "user": {
    "id": "<user id>",
    "name": "Shathir",
    "email": "shathir@example.com"
  }
}
```

Failures:

- `400` when name, email, or password is missing, or the password is shorter than 6 characters.
- `409` when the email is already registered.

### Login

Request:

```json
{
  "email": "shathir@example.com",
  "password": "secret123"
}
```

Success (`200`) uses the same `token` and `user` shape as registration.

Failure: `401` when the email or password is wrong. The message is the same for both cases.

### Current user

```http
GET /api/auth/me
Authorization: Bearer <jwt>
```

Success (`200`) returns the user without the password. A missing or invalid token returns `401`.

## Backend files

| File | Role |
|------|------|
| `backend/src/models/user.model.ts` | User schema |
| `backend/src/utils/token.ts` | Signs the JWT with `JWT_SECRET` |
| `backend/src/controllers/auth.controller.ts` | `register`, `login`, and `me` |
| `backend/src/routes/auth.routes.ts` | Auth routes |
| `backend/src/middleware/auth.middleware.ts` | Reads `Authorization: Bearer <token>` and sets `req.userId` |
| `backend/src/server.ts` | Mounts the routes at `/api/auth` |

`JWT_SECRET` lives in `backend/.env` and is not committed.

## Frontend files

| File | Role |
|------|------|
| `frontend/src/app/core/auth.service.ts` | Calls register and login, stores the token, clears it on logout |
| `frontend/src/app/core/auth.interceptor.ts` | Adds the bearer token to later API requests |
| `frontend/src/app/core/auth.guard.ts` | Blocks `/dashboard` when no token is stored |
| `frontend/src/app/pages/register/` | Registration form |
| `frontend/src/app/pages/login/` | Login form |
| `frontend/src/app/pages/dashboard/` | Protected page and logout button |
| `frontend/src/app/app.routes.ts` | Routes |
| `frontend/src/app/app.config.ts` | Registers `HttpClient` and the interceptor |

The token is stored in `localStorage` under the key `token`.

## Register

1. The form requires a full name, a valid email, a password of at least 6 characters, and a matching confirm-password field.
2. The page calls `POST /api/auth/register`. The full name is sent as `name`.
3. On success, the token and user are saved and the app opens `/dashboard`.
4. On failure, the API message is shown on the form. A duplicate email shows "Email is already registered".

## Login

1. The form requires a valid email and a password of at least 6 characters.
2. The page calls `POST /api/auth/login`.
3. If the response includes a token, the form shows "Successfully logged in. JWT token created." and opens `/dashboard` after about 1.5 seconds.
4. A wrong email or password shows "Invalid email or password" and stays on the login page.

## Logout

Logout does not call the API. The JWT is stateless, so the server cannot revoke it from this button.

1. The dashboard **Log out** button calls `AuthService.logout()`.
2. That removes `token` from `localStorage` and clears the in-memory user.
3. The app navigates to `/login`.
4. Opening `/dashboard` again redirects to `/login` because `authGuard` finds no token.

## Routes

| Path | Page | Protection |
|------|------|------------|
| `/` and `/login` | Login | Public |
| `/register` | Register | Public |
| `/dashboard` | Dashboard | `authGuard` |

## How to try it

1. Start MongoDB and the API from `backend` with `npm run dev`.
2. Start the Angular app from `frontend` with `ng serve`.
3. Register a new email at http://localhost:4200/register.
4. Log out, then log in with that email.
5. Confirm `token` exists in the browser Local Storage after login, and that it is gone after logout.
6. While logged out, open http://localhost:4200/dashboard and confirm the app returns to the login page.
