# Farmhouse Service Hub

A comprehensive service management platform designed for property management companies and service providers to handle maintenance requests, work orders, and service tickets efficiently.

## Overview

Farmhouse Service Hub is a modern web application that streamlines the process of creating, managing, and tracking service tickets for various property maintenance tasks. The platform supports multiple service types including house cleaning, lawn care, snow removal, and custom services.

## Features

### Service Ticket Management
- **Multiple Service Templates**: Pre-built templates for common services
  - House Turnover Cleaning
  - Lawn Mowing & Weed Whacking
  - Snow Removal
  - Custom Service Tickets
- **Comprehensive Ticket Creation**: Detailed forms with photo uploads, time tracking, and financial documentation
- **Status Tracking**: Full lifecycle management from draft to completion
- **Before/After Documentation**: Photo upload capabilities for service verification

### User Management & Permissions
- **Role-based Access Control**: Different permissions for users, admins, and service providers
- **User Management**: Admin interface for managing user accounts and roles
- **Authentication**: Secure login system with Supabase integration

### Dashboard & Analytics
- **Real-time Dashboard**: Overview of all tickets with filtering and search capabilities
- **Status Filtering**: Filter tickets by status (draft, submitted, approved, declined, etc.)
- **Date Range Filtering**: View tickets within specific time periods
- **Statistics**: Track total tickets, amounts, and status distributions

### Financial Management
- **Invoice Generation**: Automatic PDF invoice creation
- **Payment Tracking**: Monitor payment status and amounts
- **Cost Documentation**: Track labor hours and material costs

### Communication & Notifications
- **Email Notifications**: Automated email alerts for ticket updates
- **Status Updates**: Real-time status changes and notifications

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **Backend**: Supabase (PostgreSQL database, authentication, storage)
- **Build Tool**: Vite
- **State Management**: React Query for server state
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation
- **PDF Generation**: jsPDF for invoice creation
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd farmhouse-service-hub
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ticket/         # Ticket-specific components
│   └── ui/             # shadcn/ui components
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── pages/              # Application pages
│   └── tickets/        # Ticket template pages
└── lib/                # Utility functions
```

## Database Schema

The application uses Supabase with the following main tables:
- `tickets`: Service ticket information
- `user_roles`: User role assignments
- `profiles`: User profile information
- `ticket_photos`: Photo attachments for tickets
- `ticket_time_entries`: Time tracking data

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.
