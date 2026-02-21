
-- Allow admins to insert profiles
CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to insert residents
CREATE POLICY "Admins can insert residents"
ON public.residents FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Also allow staff to delete residents (not just admins)
CREATE POLICY "Staff can delete residents"
ON public.residents FOR DELETE
USING (can_manage(auth.uid()));

-- Staff can delete profiles too
CREATE POLICY "Staff can delete profiles"
ON public.profiles FOR DELETE
USING (can_manage(auth.uid()));
