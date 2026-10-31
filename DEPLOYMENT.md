# Delivery and hosting

## Password recovery
Both `/login` and `/admin/login` offer **Forgot password?**. Reset links return to the public `/reset-password` page. Recovery updates the password without asking for the forgotten password and signs out afterward.

The current Lovable-hosted app's return addresses are configured. Before hosting elsewhere, add the new address under **More → Users → Auth settings → Advanced → Redirect URLs**. A recovery link must be tested on the actual deployed address.

## Production subpath: https://rssapps.net/SalesManager/
The app is configured for the `/SalesManager/` base path in Vite, TanStack Router and the PWA manifest. The Cloudflare server entry also normalizes requests for known static assets (`/assets/*`, icons, favicon and manifest) so they resolve whether the Cloudflare asset binding exposes them at the origin root or under the app prefix. Application routes and server-function requests retain the `/SalesManager` prefix.

The production deployment must use the `rssapps.net/SalesManager*` Cloudflare Worker route and the current Worker deployment. Verify the HTML, stylesheet, JavaScript chunks, manifest, deep links and server functions on the production hostname after each deployment. A successful build or Worker upload alone does not prove that the public route is serving every asset. Google Sheets sync uses server functions and requires the configured production connector credentials.

## Functionality boundaries
- Authentication, admin approvals, customer creation, item creation and standalone payment receipts have backend implementations.
- Several customer/order/inventory/report displays still use sample data. Order entry does not yet provide a durable order write, atomic stock updates or an offline submission queue.
- Home-screen installation is present; full offline operation is not implemented.
- Google Sheets sync exports Customers, Products and Payments through the configured connection. Orders and scheduled background sync are not implemented. External hosting must provide compatible server configuration and connector access, not just browser keys.
- Therefore this package must not be represented as a fully functional offline production order-management system.

## Update the existing GitHub repository
Repository: `riyazamra1/RSS-Sales-Rap`. Preserve existing history and repository-specific files. Never force-push or commit `.env`, credentials, generated output or dependencies. The source ZIP includes `.env.example`, not local credentials. CI runs dependency installation, typechecking and the production build.

## Recovery verification
The admin recovery email request was accepted by the authentication service. Inbox delivery and completing the password change from the real emailed link require the account owner; no existing password was changed during verification.