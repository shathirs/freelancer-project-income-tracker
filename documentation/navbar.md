# Navbar

The navbar is the white top bar shared by the signed-in pages. It is the `app-navbar` component.

## Files

| File | Role |
|------|------|
| `frontend/src/app/layout/navbar/navbar.ts` | Reads the logged-in user and loads their profile |
| `frontend/src/app/layout/navbar/navbar.html` | Search field, notification icon, profile icon, and name |
| `frontend/src/app/layout/navbar/navbar.css` | Empty stylesheet |
| `frontend/src/app/core/auth.service.ts` | Stores the user and calls `GET /api/auth/me` |

Selector: `app-navbar`.

## What it shows

From left to right:

1. A search box with the placeholder “Search projects, clients...”. It does not filter data yet.
2. A notification bell. The button has no menu yet.
3. A blue profile icon.
4. The name of the freelancer who is logged in.

The name comes from `AuthService.user()`. It is not a fixed string.

## How the name is loaded

1. Login and registration save the user object in `localStorage` under the key `user`, next to the JWT.
2. When the navbar is created, it calls `AuthService.loadCurrentUser()`.
3. If a token exists, that method calls `GET /api/auth/me` and replaces the stored user with the API result.
4. The template displays `auth.user()?.name`.
5. Logout removes both `token` and `user` from `localStorage`.

If the token is missing or rejected, `loadCurrentUser()` clears the session.

## How a page includes it

Import `Navbar` from `frontend/src/app/layout/navbar/navbar` and add it to the component `imports` array. Place it above the page content, inside the area that is offset from the sidebar:

```html
<div class="min-w-0 flex-1 lg:pl-64">
  <app-navbar />
  <main class="p-6">
    <!-- page content -->
  </main>
</div>
```

These pages already include it: Dashboard, Clients, Projects, Income, Reports, and Settings. Login and registration do not.
