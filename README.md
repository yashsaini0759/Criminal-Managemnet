# Criminal Management System

A modern, web-based Criminal Management System designed for law enforcement agencies to manage criminal records, FIR (First Information Reports), and user operations with role-based access control.

## Features

### 🔐 Authentication & Authorization
- **Role-based Access Control**: Admin and Operator roles with different permissions
- **Secure Login**: Hashed password authentication
- **Session Management**: Persistent login with localStorage

### 👥 User Management
- **Admin Dashboard**: Full CRUD operations for criminal records
- **Operator Access**: Limited permissions (add/view only, no delete/edit)
- **User Management**: Admin can manage operators and their permissions

### 📊 Criminal Records Management
- **Complete CRUD Operations**: Add, view, edit, delete criminal records
- **Photo Upload**: Support for criminal mugshot photos (up to 5MB)
- **Advanced Search**: Filter by name, crime type, case status, FIR number
- **Case Status Tracking**: Open, Pending, Closed status management

### 📝 FIR Management
- **FIR Creation**: Create and manage First Information Reports
- **Criminal Association**: Link FIRs to criminal records
- **Search & Filter**: Search FIRs by number, description, date range

### 📈 Dashboard & Analytics
- **Real-time Statistics**: Total criminals, active FIRs, solved/pending cases
- **Visual Charts**: Crime type distribution and case status overview
- **Recent Activities**: Track system activities and changes

### 📄 Reports & Export
- **PDF Export**: Generate PDF reports for criminal and FIR records
- **Excel Export**: Export data to Excel spreadsheets
- **Date Range Filtering**: Filter reports by custom date ranges

### 🎨 Modern UI/UX
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Light/Dark Mode**: Toggle between light and dark themes
- **Professional Design**: Clean blue, grey, white color scheme
- **Accessible**: Screen reader friendly and keyboard navigation

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/UI** components
- **Wouter** for routing
- **TanStack Query** for data fetching
- **Chart.js** for dashboard charts
- **Recharts** for data visualization

### Backend
- **Express.js** with TypeScript
- **In-Memory Storage** (MemStorage) for development
- **bcrypt** for password hashing
- **Multer** for file uploads
- **Zod** for data validation

### Export Libraries
- **jsPDF** for PDF generation
- **xlsx** for Excel export

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd criminal-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   