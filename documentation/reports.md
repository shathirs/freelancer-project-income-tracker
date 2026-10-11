# Reports

Reports is a read-only view of the logged-in freelancer’s income and projects. It does not add a collection or an API. The page loads the existing income and project lists, then groups them by the selected date range.

Income records and projects are still created on the Income and Projects pages. See `documentation/income.md` and `documentation/projects.md` for those fields and routes.

## Frontend files

| File | Role |
|------|------|
| `frontend/src/app/pages/reports/reports.ts` | Date range, cards, charts, table, and exports |
| `frontend/src/app/pages/reports/reports.html` | Layout, charts, transaction table, and quick actions |
| `frontend/src/app/core/income.service.ts` | `list()` supplies every income record |
| `frontend/src/app/core/project.service.ts` | `list()` supplies every project |
| `frontend/src/app/app.routes.ts` | Protects `/reports` with `authGuard` |

`IncomeService.list()` and `ProjectService.list()` are called with no filters. The date range is applied in the page.

## Route

| Path | Component | Protection |
|------|-----------|------------|
| `/reports` | `Reports` | `authGuard` |

A visitor without a saved JWT is sent to `/login`.

## Page

The page uses the shared sidebar and navbar. The date range at the top defaults to the start of the current month through today. Changing either date updates the cards that follow the range, both charts, and the transaction table.

The comparison line under each card uses the current calendar month against last month. It does not follow the selected range.

| Card | What it shows |
|------|----------------|
| Total Income | Sum of **Paid** amounts whose date falls in the selected range |
| Total Transactions | Number of income records in the selected range, paid and pending |
| Total Projects | Number of projects whose start date falls in the selected range |
| Avg. Project Duration | Average length of all projects, shown as `n.n months` |

A project with no end date is treated as ongoing, so its length runs from the start date to today. One month is `30.44` days. The Total Projects comparison says how many more or fewer projects started this month than last month.

**Income Overview** is a line chart of paid amounts inside the selected range.

| Button | Buckets |
|--------|---------|
| Daily | One point per day, up to 31 days |
| Weekly | One point per week, up to 12 weeks |
| Monthly | One point per month, up to 12 months. This is the default |

A range that covers only the current month shows one monthly point until the dates are widened.

**Income by Project** is a doughnut of paid amounts in the selected range. The center shows the same total as the Total Income card. The first four projects are listed, and the rest are grouped as Others. Colors are blue, green, amber, violet, and slate.

**Transaction Details** shows Date, Project, Client, Type, Amount, and Status for income records in the range, newest first. **Paid** is green and **Pending** is amber. The table has a vertical line between columns. It starts with five rows. **View All** shows every row in the range. The table has no edit, view, or delete actions.

**Quick Actions**

| Action | What it does |
|--------|----------------|
| Generate Report | Reloads income and projects from the API |
| Export PDF | Opens the browser print dialog for the rows in the selected range. Choose Save as PDF there |
| Export CSV | Downloads those same rows as `report.csv` |
| Date Range | Focuses the start date at the top of the page |

CSV columns are Date, Project, Client, Type, Amount, and Status.

The Insight card repeats the paid-income comparison of this calendar month with last month.

## How to try it

1. Start MongoDB and the API from `backend` with `npm run dev`.
2. Start the Angular app from `frontend` with `ng serve`.
3. Log in, add at least one project and one paid income record, then open http://localhost:4200/reports.
4. Widen the date range and confirm the cards, both charts, and the table change together.
5. Switch Income Overview between Daily, Weekly, and Monthly.
6. Choose **View All** and confirm the table shows every row in the range.
7. Choose **Generate Report** and confirm the page reloads.
8. Choose **Export CSV** and open `report.csv`.
9. Choose **Export PDF** and use the print dialog to save or print the rows.
10. Choose **Date Range** and confirm the start date at the top of the page is focused.
