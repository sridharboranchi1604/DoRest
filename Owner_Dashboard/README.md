# DoRest Owner Dashboard v22

Separate owner/admin dashboard for accepting customer bookings and assigning partners.

## 1. Firebase setup
Use the same Firebase project as the customer website.

### Create the owner account
Firebase Console → Authentication → Users → Add user.
Create the owner email/password account.

### Create the admin document
Firestore → `admins` → Add document.

Document ID MUST be the Firebase Auth UID of the owner account.

Fields:
```json
{
  "name": "DoRest Owner",
  "active": true,
  "role": "owner"
}
```

Do not let customers create this document. Only create it manually from Firebase Console.

### Firestore rules
Replace the current rules with `firestore.rules` from this folder. It preserves customer access and adds owner access to bookings, partners and admin profile.

## 2. Run
Open this folder in VS Code and use Live Server.
Open `index.html`.

## 3. Owner flow
Owner login → Overview → New Orders → View → Accept → Select partner → Assign.

Partners can also be created from the Partners tab.

Replace only the owner dashboard folder with this version. The existing customer website remains separate and unchanged.
