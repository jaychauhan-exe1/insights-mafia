-- Add leave_requests table
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
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
