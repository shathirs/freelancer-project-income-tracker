# Clients

A client is a record owned by the logged-in freelancer. Clients are not login accounts. Each freelancer only sees and changes their own clients.

The page supports create, read, update, and delete, plus search by name or email, a status filter, and sort by newest or oldest. Name and email are required. Company and phone are optional.

Projects and total earned stay at `0` until those features exist.

## Client record

Collection: `clients`

| Field | Notes |
|-------|--------|
| `user` | Required ObjectId of the freelancer who owns the client |
| `name` | Required, trimmed |
| `email` | Required, trimmed, stored in lowercase |
| `company` | Optional, defaults to an empty string |
| `phone` | Optional, defaults to an empty string |
| `status` | `Active` or `Inactive`, defaults to `Active` |
| `createdAt` | Added automatically |
| `updatedAt` | Added automatically |

Defined in `backend/src/models/client.model.ts`.

## API

Base path: `http://localhost:5000/api/clients`

Every route requires a JWT. The auth interceptor sends `Authorization: Bearer <token>`. Queries and updates are limited to `user: req.userId`.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/` | List the freelancer’s clients |
| `POST` | `/` | Create a client |
| `PUT` | `/:id` | Update one client |
| `DELETE` | `/:id` | Delete one client |

Mounted from `backend/src/server.ts`.

### List

Optional query parameters:

| Parameter | Values | Effect |
|-----------|--------|--------|
| `search` | any text | Matches name or email, ignoring case |
| `status` | `Active` or `Inactive` | Keeps only that status |
| `sort` | `newest` or `oldest` | `newest` is the default |

Success (`200`):

```json
{
  "clients": [
    {
      "_id": "<client id>",
      "name": "ABC Solutions",
      "email": "abc@solutions.com",
      "company": "ABC Solutions",
      "phone": "+94 77 123 4567",
      "status": "Active",
      "createdAt": "2026-10-09T00:00:00.000Z",
      "updatedAt": "2026-10-09T00:00:00.000Z"
    }
  ]
}
```

### Create and update

Request:

```json
{
  "name": "ABC Solutions",
  "email": "abc@solutions.com",
  "company": "ABC Solutions",
  "phone": "+94 77 123 4567",
  "status": "Active"
}
```

Create returns `201` with `{ "client": { ... } }`. Update returns `200` with the same shape.

Failures:

- `400` when name or email is missing.
- `401` when the token is missing or invalid.
- `404` on update or delete when the id does not belong to the logged-in freelancer.

A status other than `Inactive` is stored as `Active`.

### Delete

`DELETE /api/clients/:id` returns `{ "message": "Client deleted" }` when the client belongs to the logged-in freelancer.

## Backend files

| File | Role |
|------|------|
| `backend/src/models/client.model.ts` | Client schema |
| `backend/src/controllers/client.controller.ts` | `listClients`, `createClient`, `updateClient`, and `deleteClient` |
| `backend/src/routes/client.routes.ts` | Routes, all behind `requireAuth` |
| `backend/src/server.ts` | Mounts the routes at `/api/clients` |

## Frontend files

| File | Role |
|------|------|
| `frontend/src/app/core/client.service.ts` | `list`, `create`, `update`, and `delete` |
| `frontend/src/app/pages/clients/clients.ts` | Search, filter, sort, paging, and form state |
| `frontend/src/app/pages/clients/clients.html` | Cards, table, add/edit drawer, and delete confirmation |
| `frontend/src/app/app.routes.ts` | Protects `/clients` with `authGuard` |

## Route

| Path | Component | Protection |
|------|-----------|------------|
| `/clients` | `Clients` | `authGuard` |

A visitor without a saved JWT is sent to `/login`.

## Page

The page uses the shared sidebar and navbar. It shows four cards from the full client list: Total Clients, Active, Inactive, and New This Month.

Search, status, and sort change only the table. The table columns are Name, Email, Company, Phone, Status, Projects, Total Earned, and Actions. Empty company or phone shows an em dash. The table has a vertical line between columns. Four clients are shown per page.

The action icons are edit (blue), view (green), and delete (red). The view icon is not wired yet.

**Add Client** and the edit icon open a panel from the right. Name is required. Email is required and must be a valid address. Save calls create or update, then reloads the list. Cancel, the close icon, or a click on the dimmed area closes the panel.

The delete icon opens a confirmation at the top of the page. Cancel leaves the client in place. Delete removes it and reloads the list.

## How to try it

1. Start MongoDB and the API from `backend` with `npm run dev`.
2. Start the Angular app from `frontend` with `ng serve`.
3. Log in, then open http://localhost:4200/clients.
4. Add a client with a name and email, then edit that row.
5. Search by name or email, filter by Active or Inactive, and sort newest or oldest.
6. Delete a client and confirm the row and the cards update. Cancel once and confirm the row stays.
