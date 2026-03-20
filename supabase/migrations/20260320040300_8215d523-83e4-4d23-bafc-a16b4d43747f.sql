
CREATE OR REPLACE FUNCTION public.get_order_owner_hint(p_order_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text;
  v_user_id uuid;
  v_masked text;
  v_at int;
  v_local text;
  v_domain text;
BEGIN
  SELECT email, user_id INTO v_email, v_user_id
  FROM public.orders
  WHERE id = p_order_id;

  -- Order doesn't exist
  IF v_email IS NULL THEN
    RETURN json_build_object('status', 'not_found');
  END IF;

  -- Order belongs to current user
  IF v_user_id = auth.uid() THEN
    RETURN json_build_object('status', 'owner');
  END IF;

  -- Order belongs to different user or guest - mask the email
  v_at := position('@' in v_email);
  IF v_at > 0 THEN
    v_local := left(v_email, v_at - 1);
    v_domain := substring(v_email from v_at);
    IF length(v_local) <= 2 THEN
      v_masked := v_local || '****' || v_domain;
    ELSE
      v_masked := left(v_local, 1) || repeat('*', greatest(length(v_local) - 2, 2)) || right(v_local, 1) || v_domain;
    END IF;
  ELSE
    v_masked := '****';
  END IF;

  RETURN json_build_object('status', 'wrong_user', 'masked_email', v_masked);
END;
$$;
