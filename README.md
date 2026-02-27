# Insights Mafia Office Manager

A comprehensive office management solution tailored for **Insights Mafia**, designed to streamline internal operations, task management, and financial tracking for employees and freelancers.

## 🚀 Overview

The Insights Mafia Office Manager is a custom-built web application that provides a unified platform for managing clients, tasks, attendance, and payments. It features role-based access control to ensure that Admins, Employees, and Freelancers have access to the tools they need.

## ✨ Key Features

### 🛠️ For Administrators

- **User Management:** Create, update, and manage accounts for Admins, Employees, and Freelancers.
- **Client Management:** Maintain a centralized database of clients and project details.
- **Task Orchestration:** Assign tasks to team members, track progress, and review submissions.
- **Financial Oversight:** Manage salaries for employees and wallet balances for freelancers. Track client payments and monthly charges.
- **Attendance & Leave Monitoring:** Review employee attendance logs and approve/reject leave requests.
- **Approval System:** Centralized hub for task reviews and payment approvals.

### 👥 For Employees

- **Attendance Tracking:** Easy check-in and check-out system to log daily presence.
- **Task Dashboard:** View and manage assigned tasks with status updates.
- **Leave Requests:** Submit and track the status of leave applications.
- **Salary Insights:** View monthly salary and deduction details.

### 💻 For Freelancers

- **Task Management:** Work on assigned tasks, submit links for review, and receive feedback.
- **Wallet System:** Real-time visibility into earned balances and transaction history.
- **Direct Submissions:** Integrated system for submitting work and reference links.

## 💻 Tech Stack

- **Frontend:** Next.js (App Router), React 19
- **Styling:** Tailwind CSS 4, Shadcn UI, Lucide Icons
- **Backend/Database:** Supabase (PostgreSQL)
- **Authentication:** Custom JWT-based session management with Bcrypt hashing
- **Forms & Validation:** React Hook Form, Zod

## 🛠️ Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- Supabase Project

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd office-manager
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=your_random_jwt_secret
   ```

4. **Initialize Database:**
   Run the SQL scripts provided in `schema.sql` and `supabase_updates.sql` in your Supabase SQL Editor to set up the required tables, triggers, and RLS policies.

5. **Run the development server:**
   ```bash
   npm run dev
   ```

## 📂 Project Structure

- `/app`: Next.js App Router pages and server actions.
- `/components`: Reusable UI components (Shadcn UI + custom).
- `/lib`: Utility functions, Supabase client configurations, and Auth logic.
- `/types`: TypeScript definitions for database entities and application state.
- `schema.sql`: Initial database schema definition.
- `supabase_updates.sql`: Incremental updates and RLS policies.

---

Built with ❤️ for **Insights Mafia**.
