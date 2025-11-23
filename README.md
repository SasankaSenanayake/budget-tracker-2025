# Monthly Budget Tracker

A React-based personal finance tracker with charts and analytics, supporting multiple years (2025, 2026).

## Features
- 📊 Monthly income and expense tracking
- 📅 Multi-year support (2025, 2026)
- 📈 Visual analytics with charts
- 🔒 Firebase authentication
- ☁️ Cloud data storage with Firestore
- 📱 Responsive design
- 🎯 Expected vs Actual budget comparison

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

### 3. Set up Firebase
\`\`\`bash
cp .env.example .env
# Edit .env and add your Firebase configuration:
# VITE_FIREBASE_API_KEY=your_api_key
# VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
# VITE_FIREBASE_PROJECT_ID=your_project_id
# VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
# VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
# VITE_FIREBASE_APP_ID=your_app_id
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

## Deployment

### AWS S3 + CloudFront Deployment

This application is hosted on AWS using S3 for static file hosting and CloudFront for CDN distribution.

#### Deployment Steps

1. **Build the application**
\`\`\`bash
npm run build
\`\`\`

2. **Upload to S3**
   - Upload the contents of the \`dist\` folder to your S3 bucket
   - Include both \`index.html\` and the \`assets\` folder
   - Ensure the files have public read permissions

3. **Invalidate CloudFront Cache**
   - After uploading new files, invalidate the CloudFront distribution cache
   - Create an invalidation for \`/*\` to clear all cached files

\`\`\`bash
# Example using AWS CLI
aws s3 sync dist/ s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
\`\`\`

#### AWS Infrastructure Setup
- **S3 Bucket**: Static website hosting enabled
- **CloudFront**: CDN distribution pointing to S3 bucket
- **Route 53** (optional): Custom domain DNS configuration
- **Certificate Manager** (optional): SSL/TLS certificate for HTTPS

## Security

### Firebase Authentication

This application uses **Firebase Authentication** for user management:

- User accounts are managed through Firebase Auth
- Data is stored in Firestore with user-specific access
- Each user's budget data is isolated and secured
- All communication with Firebase is encrypted via HTTPS

### Best Practices
- Always use HTTPS in production (CloudFront provides SSL/TLS)
- Keep your Firebase API keys in environment variables
- Configure Firebase security rules to restrict data access
- Enable Firebase Authentication email verification for added security

## Contributing
Pull requests welcome!
```

Copyright (c) 2025 Sasanka Senanayake

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...