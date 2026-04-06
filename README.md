# Leave Management Tool

A full-stack React-based leave management application designed to handle employee leave requests, role-based access, attendance tracking, and hierarchical reporting.

## Features

- **Role-Based Access Control**: Different views and permissions for Admins, Managers, and Employees.
- **Leave Requests & Approvals**: Employees can submit leave requests; Managers/Admins can approve or reject them.
- **Dynamic Leave Balance**: Calculates leave durations while automatically excluding holidays and weekends.
- **Hierarchical Reporting**: Admins can promote employees to manager roles to support complex reporting structures.
- **Attendance Tracking**: Monitor daily attendance records.

## Default Test Accounts

Use the following credentials to test the platform's different roles:

| Role  | Email | Password |
| ------------- | ------------- | ------------- |
| Admin  | `admin@test.com`  | `12345678` |
| Employee 1  | `emp1@test.com` | `12345678` |
| Employee 2  | `emp2@test.com` | `12345678` |

## Code Structure

- `/frontend` - React SPA (Vite/CRA), handles UI and state management.
- `/backend` - Express Server with Node.js, manages API routes and database connections.

## Getting Started

### Backend
1. Navigate to the `backend` directory.
2. Install dependencies: `npm install`
3. Set up environment variables (if required).
4. Run the server: `npm start` or `npm run dev`

### Frontend
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`
3. Run the development server: `npm start` or `npm run dev`
