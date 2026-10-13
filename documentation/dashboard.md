# Dashboard

The dashboard is the freelancer’s home page after login. It shows a summary of projects, clients, income, and payments, plus charts and recent lists.

The numbers come from the logged-in freelancer’s clients, projects, and income records.

## Route

| Path | Component | Protection |
|------|-----------|------------|
| `/dashboard` | `Dashboard` | `authGuard` |

A visitor without a saved JWT is sent to `/login`.

## Files

| File | Role |
|------|------|
| `frontend/src/app/pages/dashboard/dashboard.ts` | Loads the freelancer’s clients, projects, and income for the cards, charts, and tables |
| `frontend/src/app/pages/dashboard/dashboard.html` | Page layout |
| `frontend/src/app/core/client.service.ts` | Client list |
| `frontend/src/app/core/project.service.ts` | Project list |
| `frontend/src/app/core/income.service.ts` | Income list |
| `frontend/src/app/app.config.ts` | Registers Chart.js through `provideCharts` |

The page uses the shared sidebar and navbar:

```html
<div class="min-h-screen bg-slate-100 lg:flex">
  <app-sidebar />
  <div class="min-w-0 flex-1 lg:pl-64">
    <app-navbar />
    <main class="p-6">
      <!-- dashboard content -->
    </main>
  </div>
</div>
```

`lg:pl-64` leaves room for the fixed sidebar on a wide screen.

## What the page shows

1. Greeting: “Good morning”, “Good afternoon”, or “Good evening”, followed by the logged-in freelancer’s name.
2. Four summary cards. The line under each card compares this calendar month with last month.
   - Total Projects: every project. The comparison counts projects whose start date falls in each month.
   - Total Clients: every client. The comparison counts clients created in each month.
   - Total Income: the sum of **Paid** income. The comparison uses paid amounts in each month.
   - Pending Payments: the sum of **Pending** income. The comparison uses pending amounts in each month.
3. **Monthly income** is a bar chart of paid amounts for the last seven months, including the current month.
4. **Project Status** is a doughnut of Completed, In Progress, and On Hold counts.
5. **Recent Projects** shows the five newest projects: name, client, status, fee, and due date. A project with no end date shows Ongoing. **View All** opens `/projects`.
6. **Recent Income** shows the five newest income records: date, project, client, amount, and Paid or Pending. **View All** opens `/income`.

## Charts

Charts use Chart.js through `ng2-charts` version 10, which matches Angular 21.

`dashboard.ts` builds `incomeChartData` and `statusChartData` from those records. The templates bind those values with the `baseChart` directive.

## Layout

On a wide screen the summary cards sit in one row, the two charts sit side by side, and the two tables sit side by side. On a narrow screen those sections stack, and the sidebar sits above the content.
