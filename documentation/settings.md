# Settings

Settings is the logged-in freelancer’s account page. It updates the same user record created at registration. It does not add a new collection.

Name, email, and password are described in `documentation/user-authentication.md`. This page adds a phone number, notification switches, a theme, and a language.

## User fields used here

Collection: `users`

| Field | Notes |
|-------|--------|
| `phone` | Optional text. Defaults to an empty string |
| `notifications.projectUpdates` | Boolean. Defaults to `true` |
| `notifications.paymentReceived` | Boolean. Defaults to `true` |
| `notifications.clientMessages` | Boolean. Defaults to `true` |
| `notifications.marketing` | Boolean. Defaults to `false` |
| `theme` | `light`, `dark`, or `system`. Defaults to `light` |
| `language` | Text. Defaults to `English` |

Defined in `backend/src/models/user.model.ts`.

## API

Base path: `http://localhost:5000/api/auth`

Every route below requires a JWT. The auth interceptor sends `Authorization: Bearer <token>`. Each update is limited to the logged-in user.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/me` | Return the user, including phone, notifications, theme, and language |
| `PUT` | `/profile` | Update name, email, and phone |
| `PUT` | `/password` | Replace the password |
| `PUT` | `/preferences` | Save the four switches, theme, and language |

Login and register return the same user shape, without the password.

### Profile

```json
{
  "name": "Shathir Sheriff",
  "email": "shathir@example.com",
  "phone": "+94 77 123 4567"
}
```

Success (`200`) returns `{ "user": { ... } }`.

Failures:

- `400` when name or email is missing.
- `409` when the email belongs to another account.
- `401` when the token is missing or invalid.

### Password

```json
{
  "currentPassword": "secret123",
  "newPassword": "newsecret"
}
```

Success (`200`) returns `{ "message": "Password updated" }`. The new password is stored as a bcrypt hash. The response does not include the password.

Failures:

- `400` when either password is missing, the new password is shorter than 6 characters, or the current password is wrong.
- `401` when the token is missing or invalid.

### Preferences

```json
{
  "notifications": {
    "projectUpdates": true,
    "paymentReceived": true,
    "clientMessages": true,
    "marketing": false
  },
  "theme": "dark",
  "language": "English"
}
```

`theme` must be `light`, `dark`, or `system`. Language must be a non-empty string.

Success (`200`) returns `{ "user": { ... } }`.

Failures:

- `400` when a notification value is missing, the theme is not one of the three values, or language is blank.
- `401` when the token is missing or invalid.

## Backend files

| File | Role |
|------|------|
| `backend/src/models/user.model.ts` | User schema, including phone, notifications, theme, and language |
| `backend/src/controllers/auth.controller.ts` | `updateProfile`, `changePassword`, and `updatePreferences` |
| `backend/src/routes/auth.routes.ts` | Routes, with the three updates behind `requireAuth` |

## Frontend files

| File | Role |
|------|------|
| `frontend/src/app/core/auth.service.ts` | Profile, password, and preference calls. Applies the theme |
| `frontend/src/app/pages/settings/settings.ts` | Section choice, profile edit, password form, and preference state |
| `frontend/src/app/pages/settings/settings.html` | Settings layout |
| `frontend/src/app/app.routes.ts` | Protects `/settings` with `authGuard` |
| `frontend/src/styles.css` | Dark colors used when the theme is dark |
| `frontend/tailwind.config.ts` | `darkMode: 'class'` |

A successful profile or preference save writes the returned user into `localStorage` and the navbar name.

## Route

| Path | Component | Protection |
|------|-----------|------------|
| `/settings` | `Settings` | `authGuard` |

A visitor without a saved JWT is sent to `/login`.

## Page

The page uses the shared sidebar and navbar. A menu on the left scrolls to Account, Security, Notifications, Preferences, or Billing. The selected item is highlighted.

**Profile Information** shows the name, email, and phone. An empty phone shows “Not added”. The avatar is a static icon. **Edit** turns the three fields into inputs. **Save profile** calls `PUT /api/auth/profile`. **Cancel** restores the saved values.

**Change Password** has current, new, and confirm fields. Each eye icon shows or hides that field. The new password and confirmation must match, and the new password must be at least 6 characters. **Change Password** calls `PUT /api/auth/password`.

**Notification Preferences** has four switches: project updates, payment received, new client messages, and marketing updates. The switches stay on the page until **Save Changes**.

**Appearance** has Light, Dark, and System, plus a language list: English, Spanish, French, German. Choosing a theme applies it immediately. **Save Changes** stores the switches, theme, and language with `PUT /api/auth/preferences`.

| Theme | What it does |
|-------|----------------|
| Light | Removes the dark class and uses the original colors |
| Dark | Adds the `dark` class on the page. The background, navbar, and cards turn dark, and the text lightens |
| System | Follows the operating system. It updates if that setting changes while the app is open |

Language is saved on the account. It does not translate the pages.

**Billing** explains that payment methods and invoices are not set up. It has no save action.

Logout returns the page to the light theme.

## How to try it

1. Start MongoDB and the API from `backend` with `npm run dev`.
2. Start the Angular app from `frontend` with `ng serve`.
3. Log in and open http://localhost:4200/settings.
4. Choose **Edit**, change the phone number, and save. Refresh and confirm the phone is still there.
5. Change the password, log out, and log in with the new password.
6. Turn a notification switch off, choose **Dark**, and click **Save Changes**. Open Clients or Income and confirm the dark colors remain after a refresh.
7. Choose **Light** or **System**, save, and confirm the colors follow that choice.
