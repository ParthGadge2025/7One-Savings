# 7one Saving — Code Guide
### By Parth Gadge

7one Saving is a browser-based personal money-management app built with plain **HTML, CSS and JavaScript**. It is intentionally framework-free so the project is easy to understand, customize and publish on GitHub.

## Files

- `index.html` — page structure, navigation, forms and modals.
- `assets/css/style.css` — responsive UI, dashboard cards, tables, calendar, modals and dark mode.
- `assets/js/app.js` — all application logic and localStorage data handling.
- `README.md` — project overview and GitHub instructions.
- `CODE-GUIDE.md` — this file.

## 30+ implemented features

1. Dashboard
2. Monthly spending total
3. Monthly budget
4. Budget remaining
5. Saving-rate estimate
6. Expense entry
7. Expense categories
8. Expense search
9. Expense filtering
10. Month filtering
11. Expense deletion
12. CSV export
13. Recurring payments
14. Daily reminders
15. Weekly reminders
16. Monthly reminders
17. Yearly reminders
18. Reminder-before-due setting
19. Actual payment date
20. Adjusted payment date
21. Holiday/off-day list
22. Mess-payment-friendly date adjustment
23. Overdue/exceeded payment status
24. Payment calendar
25. Expense calendar events
26. Mark recurring payment as paid
27. Automatic next payment calculation
28. Saving competition
29. Competition duration in days/weeks/months
30. Equal starting amount
31. Player spending records
32. Final balance calculation
33. Winner calculation
34. Saving goals
35. Goal progress
36. Subscription tracker
37. Monthly subscription estimate
38. Yearly subscription estimate
39. Expense reports by date range
40. PDF expense history
41. Browser share summary
42. Print / Save as PDF
43. Category insights
44. Money-health summary
45. Smart saving observations
46. Dark mode
47. Profile name
48. Currency selector
49. JSON backup
50. JSON import
51. Local-only storage
52. Responsive mobile layout

## Main data model

The application keeps one object in browser localStorage:

```js
{
  settings: { name, budget, currency, theme },
  expenses: [],
  payments: [],
  competitions: [],
  goals: [],
  subscriptions: []
}
```

The key is `7oneSaving_v1`.

## Expense flow

When the Add Expense form is submitted:

```js
state.expenses.push({
  id: uid(),
  date,
  description,
  category,
  paidBy,
  amount,
  note
});
save();
```

`save()` serializes the state using `localStorage.setItem()`. This means refreshing the page does not remove the data.

## Recurring payment logic

Each payment stores:

- name
- amount
- original/actual date
- repeat interval
- reminder days
- payment type
- whether dates can be adjusted
- a list of holidays/off-days

`nextOccurrence()` advances the original date until it reaches today. `adjustedDate()` then moves the date forward while the date exists in the payment's off-day list.

This is the important part for mess payments:

```js
while (p.adjust === "yes" && p.offs.includes(d)) {
  d = addDays(d, 1);
}
```

The UI deliberately displays both dates instead of hiding the original date.

## Competition calculation

For each player:

```text
final balance = starting amount - recorded spending
```

The winner is the player with the higher final balance.

Example:

- Starting amount = ₹10,000
- Parth spent ₹3,000
- Friend spent ₹4,200
- Parth final = ₹7,000
- Friend final = ₹5,800
- Parth wins

The app supports days, weeks and months as competition durations.

## PDF report

The report page takes a `From` and `To` date. It filters:

```js
state.expenses.filter(
  x => x.date >= from && x.date <= to
)
```

It then calculates:

- total amount
- transaction count
- average expense
- category totals
- detailed expense history

The PDF is generated with jsPDF loaded from a CDN. If the CDN is unavailable, the **Print / Save as PDF** option can still be used from the browser.

## Calendar

The calendar combines:

- expense events
- actual recurring payment dates
- adjusted recurring payment dates
- today's date
- exceeded/overdue indicators

The calendar is generated entirely in JavaScript, so no external calendar library is required.

## Why localStorage?

This version is intentionally simple and GitHub-friendly. It works as a static website without a backend or database.

For a production version, replace localStorage with:

- Firebase / Supabase
- user authentication
- cloud database
- server-side PDF generation
- push notifications
- encrypted financial data
- multi-device synchronization

## GitHub Pages

1. Create a GitHub repository, for example `7one-saving`.
2. Upload `index.html`.
3. Upload the `assets` folder.
4. Upload `README.md` and this guide.
5. Open GitHub → Settings → Pages.
6. Select the main branch and root folder.
7. Save.
8. GitHub will provide the live website URL.

## Important limitation

Browser reminders are not guaranteed background notifications when the website is closed. The current version calculates and displays reminders whenever the app is opened. Real push notifications require a service worker plus a notification backend/service.

## Suggested future upgrades

- Login / signup
- Firebase/Supabase database
- WhatsApp/Email PDF sending
- Browser push notifications
- Shared competitions with invite links
- Bank/UPI import
- Receipt photo scanning
- Automatic category suggestions
- Monthly spending charts
- PWA install support
- Encryption
- Multi-currency conversion
