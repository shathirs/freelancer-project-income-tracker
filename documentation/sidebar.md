# Sidebar

The sidebar is the dark navigation panel shared by the signed-in pages. It is the `app-sidebar` component.

## Files

| File | Role |
|------|------|
| `frontend/src/app/layout/sidebar/sidebar.ts` | Logout action and router imports |
| `frontend/src/app/layout/sidebar/sidebar.html` | Logo, links, icons, and logout button |
| `frontend/src/app/layout/sidebar/sidebar.css` | Empty stylesheet |

Selector: `app-sidebar`.

## What it contains

- The FreelancerTrack logo: a chart icon, **Freelancer** in white, and **Track** in light blue.
- A link and icon for each signed-in page.
- A **Logout** button.

| Item | Route | Notes |
|------|--------|--------|
| Dashboard | `/dashboard` | Home icon |
| Clients | `/clients` | People icon |
| Projects | `/projects` | Clipboard icon |
| Income | `/income` | Coin icon |
| Reports | `/reports` | Bar chart icon |
| Settings | `/settings` | Gear icon |
| Logout | none | Clears the session and opens `/login` |

The open page is highlighted with `routerLinkActive`. That adds a blue background and white text only while that route is active.

Logout calls `AuthService.logout()`, which removes `token` and `user` from `localStorage`, then navigates to `/login`.

## How a page includes it

Import `Sidebar` from `frontend/src/app/layout/sidebar/sidebar` and add it to the component `imports` array.

```html
<div class="min-h-screen bg-slate-100 lg:flex">
  <app-sidebar />
  <div class="min-w-0 flex-1 lg:pl-64">
    <app-navbar />
    <!-- page content -->
  </div>
</div>
```

The sidebar is fixed on large screens (`lg:fixed`, width `lg:w-64`). The page content needs `lg:pl-64` so it does not sit underneath the panel. On a small screen the sidebar is full width and appears above the content.

These pages already include it: Dashboard, Clients, Projects, Income, Reports, and Settings. Login and registration do not.
