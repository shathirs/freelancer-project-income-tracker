# Income

An income record is a payment or invoice owned by the logged-in freelancer. It belongs to one of that freelancer’s projects. The client is read from the project, so it is not stored again on the income record.

The page supports create, read, update, and delete. The assignment needs an amount, a status, and a way to search and filter by status or client. The page also stores a type and a date so the table and charts match the design.

## Income record

Collection: `incomes`

| Field | Notes |
|-------|--------|
| `user` | Required ObjectId of the freelancer who owns the record |
| `project` | Required ObjectId of one of that freelancer’s projects |
| `type` | `Payment` or `Invoice`. Defaults to `Payment` |
| `amount` | Required number, `0` or greater |
| `status` | `Paid` or `Pending`. Defaults to `Pending` |
| `date` | Required. Used by the table, the date range, and the monthly chart |
| `createdAt` | Added automatically |
| `updatedAt` | Added automatically |

Defined in `backend/src/models/income.model.ts`.

## API

Base path: `http://localhost:5000/api/income`

Every route requires a JWT. The auth interceptor sends `Authorization: Bearer <token>`. Queries and updates are limited to `user: req.userId`. A record can be saved only when its project belongs to that freelancer.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/` | List the freelancer’s income records |
| `POST` | `/` | Create a record |
| `PUT` | `/:id` | Update one record |
| `DELETE` | `/:id` | Delete one record |

Mounted from `backend/src/server.ts`.

### List

Optional query parameters:

| Parameter | Values | Effect |
|-----------|--------|--------|
| `search` | any text | Matches the project name or the client name, ignoring case |
| `status` | `Paid` or `Pending` | Keeps only that status |
| `client` | a client id | Keeps only records whose project belongs to that client |
| `from` | `yyyy-mm-dd` | Keeps records on or after this date |
| `to` | `yyyy-mm-dd` | Keeps records on or before this date |

Records are sorted with the newest date first. Each record includes `project` as `{ "_id", "name", "client": { "_id", "name" } }`.

### Create and update

Request:

```json
{
  "project": "<project id>",
  "type": "Payment",
  "amount": 800,
  "status": "Paid",
  "date": "2026-09-28"
}
```

Create returns `201` with `{ "income": { ... } }`. Update returns `200` with the same shape.

Failures:

- `400` when project, date, or amount is missing, or the amount is below `0`.
- `400` when the project does not belong to the logged-in freelancer.
- `401` when the token is missing or invalid.
- `404` on update or delete when the id does not belong to the logged-in freelancer.

A type other than `Invoice` is stored as `Payment`. A status other than `Paid` is stored as `Pending`.

### Delete

`DELETE /api/income/:id` returns `{ "message": "Income record deleted" }` when the record belongs to the logged-in freelancer.

## Backend files

| File | Role |
|------|------|
| `backend/src/models/income.model.ts` | Income schema |
| `backend/src/controllers/income.controller.ts` | `listIncome`, `createIncome`, `updateIncome`, and `deleteIncome` |
| `backend/src/routes/income.routes.ts` | Routes, all behind `requireAuth` |
| `backend/src/server.ts` | Mounts the routes at `/api/income` |

## Frontend files

| File | Role |
|------|------|
| `frontend/src/app/core/income.service.ts` | `list`, `create`, `update`, and `delete` |
| `frontend/src/app/pages/income/income.ts` | Date range, filters, cards, and chart data |
| `frontend/src/app/pages/income/income.html` | Cards, charts, table, add/edit drawer, and delete confirmation |
| `frontend/src/app/app.routes.ts` | Protects `/income` with `authGuard` |

When creating or updating, `project` is sent as the project id string. A listed record returns `project` as an object with the client filled in.

## Route

| Path | Component | Protection |
|------|-----------|------------|
| `/income` | `Income` | `authGuard` |

A visitor without a saved JWT is sent to `/login`.

## Page

The page uses the shared sidebar and navbar. The date range defaults to the start of the current month through today. Cards, the project chart, and the table follow that range, plus the status and client filters.

| Card | What it counts |
|------|----------------|
| Total Income | Sum of **Paid** amounts in the selected range |
| Pending Payments | Sum of **Pending** amounts in the selected range |
| Paid This Month | Sum of **Paid** amounts in the current calendar month |
| Total Transactions | Number of records in the selected range |

The line under each card compares this calendar month with last month.

**Monthly Income Overview** is a bar chart of paid amounts for the last six months. **Line Chart** switches that same data to a line. **Income by Project** is a doughnut of paid amounts in the selected range. The first four projects are listed, and the rest are grouped as Others.

**Recent Transactions** shows Date, Project, Client, Type, Amount, Status, and Actions. **Paid** is green and **Pending** is amber. The table starts with five rows. **View All** shows every row in the current filters. The table has a vertical line between columns.

The action icons are edit (blue), view (green), and delete (red). The view icon opens a read-only panel for that record. **Export CSV / PDF** opens a choice: CSV downloads the filtered rows, and PDF opens the browser print dialog for those same rows. **View Reports** opens `/reports`.

**Add Income** and the edit icon open a panel from the right. Project, date, and amount are required. Amount must be `0` or greater. Save calls create or update, then reloads the list. Cancel, the close icon, or a click on the dimmed area closes the panel.

The delete icon opens a confirmation at the top of the page. Cancel leaves the record in place. Delete removes it and reloads the list.

## How to try it

1. Start MongoDB and the API from `backend` with `npm run dev`.
2. Start the Angular app from `frontend` with `ng serve`.
3. Log in, add a project if you do not have one, then open http://localhost:4200/income.
4. Add a **Paid** payment and a **Pending** invoice, then edit one row.
5. Open the green view icon and confirm the panel shows that record without changing it.
6. Choose **Export CSV / PDF**, download a CSV, and open **PDF** to print or save the filtered rows.
7. Change the date range, status, and client, and confirm the cards, project chart, and table change together.
8. Switch the monthly chart between bar and line.
9. Delete a record and confirm the row and the cards update. Cancel once and confirm the row stays.
