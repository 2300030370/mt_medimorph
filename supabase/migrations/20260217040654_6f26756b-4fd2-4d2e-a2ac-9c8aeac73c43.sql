
-- Fix: Drop all restrictive policies and recreate as permissive

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT USING (public.can_manage(auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- residents
DROP POLICY IF EXISTS "Residents can view own record" ON public.residents;
DROP POLICY IF EXISTS "Staff can view all residents" ON public.residents;
DROP POLICY IF EXISTS "Residents can update own record" ON public.residents;
DROP POLICY IF EXISTS "Admins can update any resident" ON public.residents;
DROP POLICY IF EXISTS "Admins can delete residents" ON public.residents;

CREATE POLICY "Residents can view own record" ON public.residents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all residents" ON public.residents FOR SELECT USING (public.can_manage(auth.uid()));
CREATE POLICY "Residents can update own record" ON public.residents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any resident" ON public.residents FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete residents" ON public.residents FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- meal_plans
DROP POLICY IF EXISTS "Staff can view meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Residents can view meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Staff can insert meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Staff can update meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Staff can delete meal plans" ON public.meal_plans;

CREATE POLICY "Anyone authenticated can view meal plans" ON public.meal_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert meal plans" ON public.meal_plans FOR INSERT WITH CHECK (public.can_manage(auth.uid()));
CREATE POLICY "Staff can update meal plans" ON public.meal_plans FOR UPDATE USING (public.can_manage(auth.uid()));
CREATE POLICY "Staff can delete meal plans" ON public.meal_plans FOR DELETE USING (public.can_manage(auth.uid()));

-- inventory
DROP POLICY IF EXISTS "Staff can view inventory" ON public.inventory;
DROP POLICY IF EXISTS "Staff can insert inventory" ON public.inventory;
DROP POLICY IF EXISTS "Staff can update inventory" ON public.inventory;
DROP POLICY IF EXISTS "Staff can delete inventory" ON public.inventory;

CREATE POLICY "Staff can view inventory" ON public.inventory FOR SELECT USING (public.can_manage(auth.uid()));
CREATE POLICY "Staff can insert inventory" ON public.inventory FOR INSERT WITH CHECK (public.can_manage(auth.uid()));
CREATE POLICY "Staff can update inventory" ON public.inventory FOR UPDATE USING (public.can_manage(auth.uid()));
CREATE POLICY "Staff can delete inventory" ON public.inventory FOR DELETE USING (public.can_manage(auth.uid()));

-- audit_log
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_log;
DROP POLICY IF EXISTS "Staff can view audit logs" ON public.audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_log;

CREATE POLICY "Staff and admins can view audit logs" ON public.audit_log FOR SELECT USING (public.can_manage(auth.uid()));
CREATE POLICY "System can insert audit logs" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- user_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
