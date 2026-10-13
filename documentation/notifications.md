# Notifications

A notification is a short alert for the logged-in freelancer. The navbar bell opens this page and shows how many alerts are still unread.

The four switches on Settings decide which alerts are stored. See `documentation/settings.md`.

| Switch | When a row is created |
|--------|------------------------|
| Project updates | A project’s status changes |
| Payment received | An income record is saved as **Paid**, or an existing record changes from Pending to Paid |
| New client messages | No messages exist in the app, so this switch does not create rows |
| Marketing updates | No marketing events exist in the app, so this switch does not create rows |

Changing a project without changing its status does not create a row. Saving an income record that is already Paid does not create another payment row.

## Notification record

Collection: `notifications`

| Field | Notes |
|-------|--------|
| `user` | Required ObjectId of the freelancer who owns the alert |
| `type` | `project`, `payment`, `client`, or `marketing` |
| `title` | Required short heading |
| `message` | Required sentence |
| `read` | Boolean. Defaults to `false` |
| `createdAt` | Added automatically. The list is newest first |
| `updatedAt` | Added automatically |

Defined in `backend/src/models/notification.model.ts`.

## API

Base path: `http://localhost:5000/api/notifications`

Every route requires a JWT. The auth interceptor sends `Authorization: Bearer <token>`. Queries and updates are limited to `user: req.userId`.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/` | List the freelancer’s notifications, newest first |
| `PATCH` | `/:id/read` | Mark one notification as read |
| `PATCH` | `/read-all` | Mark every unread notification as read |

`GET /` returns `{ "notifications": [ ... ] }`.

Marking one row returns `{ "notification": { ... } }` with `read` set to `true`. A missing id, or an id owned by someone else, returns `404`.

Marking all returns `{ "message": "Notifications marked as read" }`.

A missing or invalid token returns `401`.

## Backend files

| File | Role |
|------|------|
| `backend/src/models/notification.model.ts` | Notification schema |
| `backend/src/controllers/notification.controller.ts` | `listNotifications`, `markNotificationRead`, and `markAllNotificationsRead` |
| `backend/src/routes/notification.routes.ts` | Routes, all behind `requireAuth` |
| `backend/src/utils/notify.ts` | Writes a row only when the matching Settings switch is on |
| `backend/src/controllers/project.controller.ts` | Calls `createNotification` when a project status changes |
| `backend/src/controllers/income.controller.ts` | Calls `createNotification` when an income record becomes Paid |
| `backend/src/server.ts` | Mounts the routes at `/api/notifications` |

## Frontend files

| File | Role |
|------|------|
| `frontend/src/app/core/notification.service.ts` | `list`, `markRead`, and `markAllRead`. Keeps the unread count |
| `frontend/src/app/pages/notifications/notifications.ts` | Loads the list and marks rows read |
| `frontend/src/app/pages/notifications/notifications.html` | Notification list |
| `frontend/src/app/layout/navbar/navbar.ts` | Loads the unread count for the bell |
| `frontend/src/app/layout/navbar/navbar.html` | Bell link and unread badge |
| `frontend/src/app/app.routes.ts` | Protects `/notifications` with `authGuard` |

## Route

| Path | Component | Protection |
|------|-----------|------------|
| `/notifications` | `Notifications` | `authGuard` |

A visitor without a saved JWT is sent to `/login`.

## Page

The page uses the shared sidebar and navbar. Each row shows an icon, the title, the message, and the time. Unread rows have a blue background and a blue dot.

| Type | Icon color |
|------|------------|
| `project` | Indigo |
| `payment` | Green |
| `client` | Sky |
| `marketing` | Amber |

Clicking an unread row marks that row as read. **Mark all as read** appears when at least one row is unread. An empty list says “No notifications yet.”

## Navbar bell

The bell is a link to `/notifications`. A red badge shows the unread count. Counts above 9 show `9+`. The badge disappears when every row is read.

The count updates when a row is marked read on this page, and again when the freelancer opens another signed-in page.

## How to try it

1. Start MongoDB and the API from `backend` with `npm run dev`.
2. Start the Angular app from `frontend` with `ng serve`.
3. Log in and confirm **Project updates** and **Payment received** are on in Settings.
4. Change a project’s status, then click the bell. Confirm a project alert appears and the badge shows `1`.
5. Add a **Paid** income record and confirm a payment alert appears.
6. Click one row and confirm it loses the blue dot. Choose **Mark all as read** and confirm the badge disappears.
7. Turn **Project updates** off, change another project’s status, and confirm no new project alert is created.
