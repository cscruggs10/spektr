# AutoInspect Pro - Vehicle Inspection Management System

## Overview

AutoInspect Pro is a full-stack vehicle inspection management system built for automotive dealers and inspectors. The application manages auction runlists, schedules inspections, and provides mobile-friendly tools for inspectors to complete detailed vehicle assessments with photo and video documentation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom theme configuration
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **File Storage**: Cloudinary for cloud storage with local fallback using Multer
- **Real-time**: WebSocket support for live updates
- **Authentication**: Session-based authentication (extensible)

## Key Components

### Core Modules
1. **Auction Management** - Handle auction houses and schedules
2. **Runlist Processing** - Import and manage vehicle runlists from CSV/Excel
3. **Inspection Workflow** - Complete inspection lifecycle management
4. **Inspector Portal** - Mobile-optimized interface for field inspectors
5. **Dealer Management** - Client relationship and buy-box management
6. **Reporting System** - Generate inspection reports and invoices

### Database Schema
- **Users & Authentication**: User management with role-based access
- **Auctions**: Auction house information and schedules
- **Vehicles**: Vehicle data with VIN decoding via NHTSA API
- **Inspections**: Inspection records with status tracking
- **Results**: Detailed inspection results with media attachments
- **Dealers**: Client information and preferences
- **Invoicing**: Billing and payment tracking

### Inspector Mobile Interface
- **Touch-optimized UI**: Designed for mobile devices and tablets
- **Media Capture**: Photo, video, and audio recording capabilities
- **Offline Support**: Local storage for working without internet
- **Real-time Sync**: Automatic data synchronization when connected

## Data Flow

### Inspection Workflow
1. **Runlist Upload** - CSV/Excel files imported and parsed
2. **Inspection Assignment** - Vehicles assigned to inspectors by auction/location
3. **Field Inspection** - Inspectors use mobile interface to complete assessments
4. **Media Upload** - Photos/videos uploaded to Cloudinary with automatic optimization
5. **Result Processing** - Inspection data compiled and made available to dealers
6. **Invoicing** - Automatic invoice generation and approval workflow

### File Processing
- **Upload Handling**: Multer middleware for multipart form data
- **Storage Strategy**: Cloudinary primary with local backup
- **Media Types**: Support for images, videos, and audio files
- **Validation**: File type and size validation with error handling

## External Dependencies

### Third-party Services
- **Cloudinary**: Media storage and optimization
- **NHTSA API**: Vehicle data and VIN decoding
- **SendGrid**: Email notifications (configured)
- **Neon Database**: PostgreSQL hosting

### Key Libraries
- **Drizzle ORM**: Type-safe database queries
- **ExcelJS**: Excel file processing
- **Puppeteer**: PDF generation (for training guides)
- **React Query**: Server state management
- **Zod**: Schema validation

## Deployment Strategy

### Development
- **Local Development**: Uses Vite dev server with hot module replacement
- **Database**: Connected to remote PostgreSQL via DATABASE_URL
- **File Storage**: Toggleable between Cloudinary and local storage

### Production Build
- **Frontend**: Vite builds static assets to `dist/public`
- **Backend**: ESBuild compiles TypeScript server to `dist/index.js`
- **Database Migrations**: Drizzle Kit handles schema changes
- **Environment**: All configuration via environment variables

### Configuration
- **Theme**: Customizable via `theme.json` with shadcn integration
- **Database**: Drizzle config points to `shared/schema.ts`
- **Build**: Separate TypeScript configs for build vs development

## Recent Changes: Latest modifications with dates
- Manual inspection batch upload functionality without template requirements
- Removed user authentication tracking from batch operations
- Added inspection date calendar picker field to batch upload process
- Implemented notes field mapping from CSV data with prominent display
- Enhanced inspection detail pages with blinking alert emoji for important notes
- **Added auction filter to inspector portal** - Inspectors can now filter inspections by specific auction house
- **Implemented automatic cleanup of expired inspections** - Inspections not performed by 11:59 PM are automatically removed from the queue
- **Enhanced inspection sorting** - Inspections are sorted by lane number first, then run number for optimal workflow
- **Removed invoice functionality (July 9, 2025)** - Removed all invoice-related features, database tables, API routes, and UI components as they belonged to a different application
- **Removed obsolete runlist upload feature (July 9, 2025)** - Removed runlist upload component from dashboard as system now uses manual inspection batch uploads
- **Added recommendation feature (July 9, 2025)** - Inspectors can now mark vehicles as recommended during inspection process
- **Enhanced completed inspections page (July 9, 2025)** - Added advanced filtering with VIN search (last 6), inspector filter, auction filter, and date range filter. Recommended vehicles display with flashing green animation
- **Enhanced section completion tracking (July 11, 2025)** - Implemented comprehensive visual feedback system:
  - Each numbered inspection section (1-6) at the top of the inspection modal turns green with a large checkmark overlay when completed
  - Photos section: Marked complete when photos are uploaded
  - Walkaround/Engine videos: Marked complete when respective videos are uploaded
  - Cosmetics/Mechanical sections: Marked complete when both estimate amount and details are entered
  - Notes section: Marked complete when either text notes are entered or voice note is recorded
  - Section headers also display inline checkmarks next to titles for additional confirmation

The system is designed to be scalable and maintainable, with clear separation of concerns between the inspection workflow, dealer management, and inspector tools. The mobile-first approach for inspectors ensures usability in field conditions while maintaining data integrity through proper validation and error handling.