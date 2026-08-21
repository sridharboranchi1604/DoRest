# DoRest Master v21 — Review & Confirm Booking Fixed

This version restores the missing Review Booking and Booking Confirmed modals that the JavaScript expected but the HTML did not contain.

## Fixed flow
Home → Service → Date/Time → Address → Review booking → **Confirm booking** → Booking Confirmed → My Bookings

The Review Booking screen now includes the required IDs used by app.js, including service, duration, date, time, address, cooking details, total, and the **Confirm booking** button.

Replace the entire DoRest folder with this version. Do not merge files. After replacing, hard-refresh with Ctrl+Shift+R.


## Firebase auth fix
The Firebase Auth instance is now explicitly exposed as `window.dorestAuth`, which is required by the booking confirmation flow.
