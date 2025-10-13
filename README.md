## Installation
1) Install
npm install
2) Run dev server
 npm run dev
 3) Open http://localhost:5173
 4) Build: npm run build

 Notes:
 - This scaffold uses localStorage "auth" (for demo). Replace Login with Firebase Auth or your backend for production.
 - PDF parsing is heuristic and may need tuning for specific bank layouts.
 - Add proper Firestore / server sync by implementing a sync worker that uploads `syncQueue` entries on 'online'.
 - Add form validation, better UX, and budgets/goals screens next.


 End of project file bundle


 firebase deploy --only hosting

 npm run preview