# Spektr Inspection Pro

A comprehensive inspection management application built with React, Express, and PostgreSQL.

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (Neon)
- **File Storage**: Cloudinary
- **Email**: SendGrid
- **Deployment**: Railway

## Railway Deployment Setup

### Prerequisites

1. Railway account
2. GitHub repository connected to Railway
3. Required services:
   - PostgreSQL database (Neon recommended)
   - Cloudinary account for image storage
   - SendGrid account for email notifications

### Environment Variables

Configure these variables in your Railway project:

```env
# Database
DATABASE_URL=your-neon-postgres-url

# Session
SESSION_SECRET=generate-a-secure-random-string

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Optional: OpenAI
OPENAI_API_KEY=your-openai-api-key
```

### Deployment Steps

1. **Connect GitHub Repository**
   - In Railway, create a new project
   - Connect your GitHub repository
   - Railway will auto-deploy on push to main branch

2. **Add PostgreSQL Database**
   - Add a Neon PostgreSQL service to your Railway project
   - Copy the DATABASE_URL to your environment variables

3. **Configure Environment Variables**
   - Go to your service settings in Railway
   - Add all required environment variables from `.env.example`

4. **Deploy**
   - Push your code to GitHub
   - Railway will automatically build and deploy using the configuration in `railway.json`

5. **Initialize Database**
   - After first deployment, run database migrations:
   - Use Railway's CLI or web console to run: `npm run db:push`

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your local configuration

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### Build Commands

- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Production**: `npm run start`
- **Type Check**: `npm run check`
- **Database Push**: `npm run db:push`
- **Database Migrate**: `npm run db:migrate`

## Project Structure

```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
├── migrations/      # Database migrations
├── dist/           # Production build output
└── uploads/        # Local file uploads (dev only)
```

## Features

- User authentication and authorization
- Inspection management
- File upload and management
- Email notifications
- PDF report generation
- Real-time updates via WebSockets