-- Clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  business TEXT,
  monthly_charges NUMERIC(15, 2) DEFAULT 0,
  contract_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table to store additional user info
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('Admin', 'Employee', 'Freelancer')),
  wallet_balance NUMERIC(15, 2) DEFAULT 0, -- For Freelancers
  salary NUMERIC(15, 2) DEFAULT 0,
  deduction_amount NUMERIC(15, 2) DEFAULT 0,
  paid_leaves NUMERIC(5, 2) DEFAULT 0.0, -- Default to 0, manually set by Admin
  last_leave_credited_month TEXT, -- Format: YYYY-MM
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Review', 'Completed', 'Revision')),
  payment_amount NUMERIC(10, 2), -- Only for Freelancers
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  deadline TIMESTAMP WITH TIME ZONE,
  assigned_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  revision_at TIMESTAMP WITH TIME ZONE,
  submission_note TEXT,
  submission_links TEXT[],
  reference_links TEXT[],
  feedback TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table (for Employees)
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'Present',
  date DATE DEFAULT CURRENT_DATE,
  UNIQUE(user_id, date)
);

-- Wallet Transactions (for Freelancers)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  freelancer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  type TEXT DEFAULT 'credit',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Policies
-- Clients: Admins all, Employees/Freelancers can view.
CREATE POLICY "Admins can manage all clients" ON public.clients FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
);
CREATE POLICY "Team can view all clients" ON public.clients FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
);

-- Profiles: Everyone can read their own profile, Admins can read all.
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
);

-- Tasks: Admins all, Users see assigned.
CREATE POLICY "Admins can manage all tasks" ON public.tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
);
CREATE POLICY "Users can see assigned tasks" ON public.tasks FOR SELECT USING (assignee_id = auth.uid());
CREATE POLICY "Users can update status of assigned tasks" ON public.tasks FOR UPDATE USING (assignee_id = auth.uid());

-- Attendance
CREATE POLICY "Users can manage own attendance" ON public.attendance FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can view all attendance" ON public.attendance FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
);

-- Leave requests (Rename Paid Off to Off)
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  is_paid_leave BOOLEAN DEFAULT FALSE,
  will_work_sunday BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for leave_requests
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Policies for leave_requests
CREATE POLICY "Users can manage own leave requests" ON public.leave_requests
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all leave requests" ON public.leave_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
  );

-- Wallet
CREATE POLICY "Freelancers can view own wallet" ON public.wallet_transactions FOR SELECT USING (freelancer_id = auth.uid());
CREATE POLICY "Admins can manage wallet" ON public.wallet_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
);
