# Delivery and hosting

## Password recovery
Both `/login` and `/admin/login` offer **Forgot password?**. Reset links return to the public `/reset-password` page. Recovery updates the password without asking for the forgotten password and signs out afterward.

The current Lovable-hosted app's return addresses are configured. Before hosting elsewhere, add the new address under **More → Users → Auth settings → Advanced → Redirect URLs**. A recovery link must be tested on the actual deployed address.

## Requested address: https://rssapps.net/SalesManager
This address is not deployed or connected by this source package. Domain/DNS or hosting access is required. Lovable custom-domain connections use hostnames, not a `/SalesManager` subfolder.

The current app assumes domain-root hosting. For an exact subpath deployment, configure the server runtime, router base path, asset paths, manifest start URL and scope, and password-recovery return URL together, then verify deep links and server functions. Do not simply upload a static folder to `/SalesManager`; Google Sheets sync uses server functions. An alternative is a dedicated app subdomain, with `/SalesManager` redirecting to it, if approved by the owner.

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