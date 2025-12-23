Frontend Project Structure

This file documents the current frontend file/directory layout and the purpose of key files.

```
frontend/
├─ README.md
├─ app.json
├─ app/
│  ├─ _layout.tsx
│  ├─ home.tsx
│  ├─ index.tsx
│  ├─ login.tsx
│  ├─ map.tsx
│  ├─ report.tsx
│  ├─ reportdocs.tsx
│  ├─ signup.tsx
├─ assets/
│  └─ images/
├─ img/
├─ src/
│  ├─ components/
│  │  ├─ Alert.tsx
│  │  ├─ Footer.tsx
│  │  ├─ Header.tsx
│  │  ├─ ReportCard.tsx
│  │  ├─ ReportList.tsx
│  │  ├─ ReportModal.tsx
│  │  └─ ViewToggle.tsx
│  ├─ config/
│  │  ├─ api.ts
│  │  └─ firebase.ts
│  ├─ context/
│  │  └─ AuthContext.tsx
│  ├─ data/
│  │  └─ dummyReports.ts
│  ├─ hooks/
│  │  └─ useUserLocation.ts
│  ├─ services/
│  │  └─ authService.ts
│  ├─ styles/
│  │  └─ reportStyles.ts
│  ├─ types/
│  │  └─ StrayDog.ts
│  └─ utils/
│     └─ statusHelpers.ts
├─ temp/
│  ├─ report.tsx
│  └─ temp.tsx
├─ package.json
├─ tsconfig.json
└─ metro.config.js
```

Notes:
- `app/` contains top-level Expo/React Native screens.
- `src/` holds reusable components, hooks, services, and types.
- `assets/images/` and `img/` contain static images used in the app.
- `temp/` appears to contain scratch files; consider cleaning or moving later.

If you'd like, I can:
- Create placeholder files for any missing entries listed above.
- Generate a shell script to scaffold this structure on a new machine.
- Convert this into a JSON manifest or tree command output.
