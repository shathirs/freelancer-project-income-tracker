# Projects

A project is a record owned by the logged-in freelancer. It belongs to one of that freelancer’s clients. Each freelancer only sees and changes their own projects.

The page supports create, read, update, and delete. The assignment fields are name, client, status, and fee. The page also stores a category, a start date, an end date, and an optional fee note so the table matches the design.

Search matches the project name or the client name. The list can be filtered by client and by status, and sorted newest or oldest.

## Project record

Collection: `projects`

| Field | Notes |
|-------|--------|
| `user` | Required ObjectId of the freelancer who owns the project |
| `client` | Required ObjectId of one of that freelancer’s clients |
| `name` | Required, trimmed |
| `category` | Optional, defaults to an empty string. Shown under the project name |
| `status` | `In Progress`, `Completed`, or `On Hold`. Defaults to `In Progress` |
| `startDate` | Required |
| `endDate` | Optional. Empty means the table shows Ongoing |
| `fee` | Required number, `0` or greater |
| `feeNote` | Optional text after the fee, such as `/ month` |
| `createdAt` | Added automatically |
| `updatedAt` | Added automatically |

Defined in `backend/src/models/project.model.ts`.

## API

Base path: `http://localhost:5000/api/projects`

Every route requires a JWT. The auth interceptor sends `Authorization: Bearer <token>`. Queries and updates are limited to `user: req.userId`. A project can be saved only when its client belongs to that freelancer.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/` | List the freelancer’s projects |
| `POST` | `/` | Create a project |
| `PUT` | `/:id` | Update one project |
| `DELETE` | `/:id` | Delete one project |

Mounted from `backend/src/server.ts`.

### List

Optional query parameters:

| Parameter | Values | Effect |
|-----------|--------|--------|
| `search` | any text | Matches the project name or the client name, ignoring case |
| `status` | `In Progress`, `Completed`, or `On Hold` | Keeps only that status |
| `client` | a client id | Keeps only projects for that client |
| `sort` | `newest` or `oldest` | `newest` is the default |

Each project in the response includes `client` as `{ "_id", "name" }`.

### Create and update

Request:

```json
{
  "name": "Website Redesign",
  "client": "<client id>",
  "category": "Web Development",
  "status": "In Progress",
  "startDate": "2026-10-20",
  "endDate": "2026-12-15",
  "fee": 2800,
  "feeNote": ""
}
```

Leave `endDate` empty or `null` for an ongoing project.

Create returns `201` with `{ "project": { ... } }`. Update returns `200` with the same shape.

Failures:

- `400` when name, client, start date, or fee is missing, or the fee is below `0`.
- `400` when the client does not belong to the logged-in freelancer.
- `401` when the token is missing or invalid.
- `404` on update or delete when the id does not belong to the logged-in freelancer.

A status other than `Completed` or `On Hold` is stored as `In Progress`.

### Delete

`DELETE /api/projects/:id` returns `{ "message": "Project deleted" }` when the project belongs to the logged-in freelancer.

## Backend files

| File | Role |
|------|------|
| `backend/src/models/project.model.ts` | Project schema |
| `backend/src/controllers/project.controller.ts` | `listProjects`, `createProject`, `updateProject`, and `deleteProject` |
| `backend/src/routes/project.routes.ts` | Routes, all behind `requireAuth` |
| `backend/src/server.ts` | Mounts the routes at `/api/projects` |

## Frontend files

| File | Role |
|------|------|
| `frontend/src/app/core/project.service.ts` | `list`, `create`, `update`, and `delete` |
| `frontend/src/app/pages/projects/projects.ts` | Search, filters, sort, paging, and form state |
| `frontend/src/app/pages/projects/projects.html` | Cards, table, add/edit drawer, and delete confirmation |
| `frontend/src/app/app.routes.ts` | Protects `/projects` with `authGuard` |

When creating or updating, `client` is sent as the client id string. A listed project returns `client` as an object with `_id` and `name`.

## Route

| Path | Component | Protection |
|------|-----------|------------|
| `/projects` | `Projects` | `authGuard` |

A visitor without a saved JWT is sent to `/login`.

## Page

The page uses the shared sidebar and navbar. It shows four cards from the full project list: Total Projects, Active Projects, On Hold, and Completed. Active Projects counts status **In Progress**. The total card compares how many projects were added this month with last month.

Search, client, and status change only the table. The table columns are Project Name, Client, Status, Start Date, End Date, Fee, and Actions. The table has a vertical line between columns. Eight projects are shown per page.

Status colors: **In Progress** and **Completed** are green. **On Hold** is purple. An empty end date shows **Ongoing**. A fee note is shown after the amount.

The action icons are edit (blue), view (green), and delete (red). The view icon opens a read-only panel for that project.

**Add Project** and the edit icon open a panel from the right. Name, client, start date, and fee are required. Fee must be `0` or greater. Save calls create or update, then reloads the list. Cancel, the close icon, or a click on the dimmed area closes the panel.

The delete icon opens a confirmation at the top of the page. Cancel leaves the project in place. Delete removes it and reloads the list.

## How to try it

1. Start MongoDB and the API from `backend` with `npm run dev`.
2. Start the Angular app from `frontend` with `ng serve`.
3. Log in, add a client if you do not have one, then open http://localhost:4200/projects.
4. Add a project with a name, client, start date, and fee, then edit that row.
5. Leave the end date empty and confirm the table shows Ongoing.
6. Search by project name or client name, filter by client and status, and sort newest or oldest.
7. Delete a project and confirm the row and the cards update. Cancel once and confirm the row stays.
