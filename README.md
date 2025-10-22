# Monthly Budget Tracker

A React-based personal finance tracker with charts and analytics.

## Features
- 📊 Monthly income and expense tracking
- 📈 Visual analytics with charts
- 🔒 Password protection
- 💾 Local data storage
- 📱 Responsive design

## Setup

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/SasankaSenanayake/budget-tracker-2025.git
cd budget-tracker
\`\`\`

### 2. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Set up environment variables
\`\`\`bash
cp .env.example .env
# Edit .env and set your own password
\`\`\`

### 4. Run development server
\`\`\`bash
npm run dev
\`\`\`

### 5. Build for production
\`\`\`bash
npm run build
npm run preview
\`\`\`

## Security

⚠️ **Important Security Notice**

This application uses **client-side authentication only**. This means:

- The password is checked in the browser
- Data is stored in browser localStorage
- A technical user could bypass authentication
- **DO NOT use this for highly sensitive financial data**

For personal use only. If you need real security:
- Implement backend authentication (AWS Cognito, Auth0, etc.)
- Store data in a database with proper access controls
- Use HTTPS everywhere

## License
MIT

## Contributing
Pull requests welcome!
```

---

## **7. Add a LICENSE File**

Create `LICENSE` file (MIT is common for open source):
```
MIT License

Copyright (c) 2025 Sasanka Senanayake

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...