export type Role = "Admin" | "Employee" | "Freelancer";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar_url?: string;
  wallet_balance?: number;
  salary?: number;
  deduction_amount?: number;
  created_at: string;
}

export type TaskStatus = "Pending" | "Review" | "Completed" | "Revision";

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee_id: string | null;
  status: TaskStatus;
  payment_amount: number | null;
  feedback: string | null;
  created_by: string;
  created_at: string;
  assignee?: Profile;
}

export interface Attendance {
  id: string;
  user_id: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  date: string;
}

export interface WalletTransaction {
  id: string;
  freelancer_id: string;
  amount: number;
  task_id: string | null;
  type: "credit" | "debit";
  description?: string | null;
  created_at: string;
}
