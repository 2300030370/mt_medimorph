
-- Update handle_new_user to use role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_role app_role;
BEGIN
  selected_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'resident'
  );

  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, selected_role);

  -- Only create resident record if role is resident
  IF selected_role = 'resident' THEN
    INSERT INTO public.residents (user_id)
    VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$;
