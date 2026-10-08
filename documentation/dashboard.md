# Dashboard

The dashboard is the freelancer’s home page after login. It shows a summary of projects, clients, income, and payments, plus charts and recent lists.

The numbers on this page are sample data from the design. They are not loaded from MongoDB yet.

## Route

| Path | Component | Protection |
|------|-----------|------------|
| `/dashboard` | `Dashboard` | `authGuard` |

A visitor without a saved JWT is sent to `/login`.

## Files

| File | Role |
|------|------|
| `frontend/src/app/pages/dashboard/dashboard.ts` | Chart data and component imports |
| `frontend/src/app/pages/dashboard/dashboard.html` | Page layout and sample content |
| `frontend/src/app/pages/dashboard/dashboard.css` | Empty stylesheet |
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

1. Greeting: “Good morning, Shathir!” and a short overview line. This greeting is still fixed text. It does not use the logged-in user’s name.
2. Four summary cards:
   - Total Projects: 5
   - Total Clients: 4
   - Total Income: $4,250
   - Pending Payments: $1,200
3. **Monthly income** bar chart for April through October.
4. **Project Status** donut chart: Completed 2, In Progress 2, On Hold 1.
5. **Recent Projects** table: name, client, status, fee, and due date.
6. **Recent Income** table: date, project, client, amount, and Paid or Pending.

**View All** on both tables is a label only. It does not open another page yet.

## Charts

Charts use Chart.js through `ng2-charts` version 10, which matches Angular 21.

`dashboard.ts` defines:

- `incomeChartData` and `incomeChartOptions` for the bar chart
- `statusChartData` and `statusChartOptions` for the doughnut chart

The templates bind those values with the `baseChart` directive.

## Layout

On a wide screen the summary cards sit in one row, the two charts sit side by side, and the two tables sit side by side. On a narrow screen those sections stack, and the sidebar sits above the content.
