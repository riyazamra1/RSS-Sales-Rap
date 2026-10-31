# Password recovery update

The existing GitHub /SalesManager hosting setup and sign-in email links were preserved. The reset page now requires a recovery link or PASSWORD_RECOVERY event, rather than accepting every ordinary signed-in session. It revalidates the user before updating the password and signs out afterward.

Before recovery on rssapps.net can be confirmed, add https://rssapps.net/** to the allowed Redirect URLs in Lovable Cloud: More → Users → Auth settings → Advanced. Test the actual email link on the deployed site. No existing account password was changed during verification.

This targeted update does not establish full offline support, durable order processing, atomic stock updates or scheduled Sheets synchronization. Those features still need implementation and end-to-end verification. External hosting requires compatible server configuration and connector access. Never commit credentials or .env files.
