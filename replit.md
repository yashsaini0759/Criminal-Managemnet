# Overview

The Criminal Management System is a comprehensive web-based application designed for law enforcement agencies to manage criminal records and First Information Reports (FIRs). The system implements role-based access control with Admin and Operator roles, providing different permission levels for managing criminal data, FIR records, and system users. It features a modern React frontend with TypeScript and a Node.js/Express backend with PostgreSQL database integration via Drizzle ORM.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application uses a modern React 18 with TypeScript setup, leveraging several key architectural decisions:

- **Component Library**: Built with Shadcn/UI components for consistent, accessible design
- **Routing**: Uses Wouter for lightweight client-side routing instead of React Router
- **State Management**: React Query (@tanstack/react-query) for server state management and caching
- **Styling**: Tailwind CSS with custom design system supporting light/dark themes
- **Form Handling**: React Hook Form with Zod validation schemas
- **Build Tool**: Vite for fast development and optimized production builds

The frontend follows a feature-based folder structure with reusable UI components, page components, and custom hooks. Authentication state is managed through localStorage with utility functions for role-based access control.

## Backend Architecture
The server follows a RESTful API design with Express.js:

- **Server Framework**: Express.js with TypeScript for type safety
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Authentication**: Password hashing with bcrypt, session-based auth stored in localStorage
- **File Handling**: Multer middleware for photo uploads with size and type restrictions
- **Development**: Hot reload with Vite integration for seamless full-stack development

The backend uses an abstraction layer (IStorage interface) that allows for both in-memory storage during development and PostgreSQL in production, making the system flexible for different deployment scenarios.

## Data Storage Design
The database schema includes three main entities:

- **Users**: Stores authentication and role information (admin/operator)
- **Criminal Records**: Core entity with personal information, crime details, photos, and case status
- **FIR Records**: Linked to criminal records, stores First Information Report details

The system uses UUIDs for primary keys and includes proper timestamps for audit trails. Photo storage is handled as base64 encoded strings for simplicity.

## Authentication & Authorization
Role-based access control is implemented at both frontend and backend levels:

- **Admin Role**: Full CRUD operations on all records, user management capabilities
- **Operator Role**: Limited to add/view operations, cannot delete or edit records
- **Session Management**: Client-side storage with server-side validation
- **Security**: Passwords are hashed using bcrypt before storage

## UI/UX Design Patterns
The interface follows modern design principles:

- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Theme System**: Light/dark mode toggle with CSS custom properties
- **Accessibility**: Screen reader support and keyboard navigation
- **Professional Aesthetics**: Clean blue, grey, white color scheme with consistent spacing

# External Dependencies

## Database
- **Neon Database**: PostgreSQL-compatible serverless database (@neondatabase/serverless)
- **Drizzle ORM**: Type-safe database toolkit with migration support
- **Connection**: Uses DATABASE_URL environment variable for connection string

## UI Components & Styling
- **Radix UI**: Comprehensive set of accessible, unstyled components
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide Icons**: Consistent icon system throughout the application
- **Chart.js**: Data visualization for dashboard analytics

## File Processing & Export
- **Multer**: Multipart/form-data handling for file uploads
- **jsPDF**: Client-side PDF generation for reports
- **XLSX**: Excel file export functionality

## Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across the entire application
- **React Query**: Server state synchronization and caching
- **Zod**: Runtime type validation for forms and API requests

## Authentication & Security
- **bcrypt**: Password hashing and verification
- **Input validation**: Client and server-side validation using Zod schemas
- **File upload security**: MIME type validation and size limits for photo uploads