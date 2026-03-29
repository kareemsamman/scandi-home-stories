
CREATE OR REPLACE FUNCTION public.get_pergola_response(p_request_id uuid, p_token text)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result json;
BEGIN
  IF p_request_id IS NULL OR p_token IS NULL OR p_token = '' THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'id', r.id,
    'customer_name', r.customer_name,
    'width', r.width,
    'length', r.length,
    'height', r.height,
    'pergola_type', r.pergola_type,
    'mount_type', r.mount_type,
    'installation', r.installation,
    'lighting', r.lighting,
    'santaf_roofing', r.santaf_roofing,
    'frame_color', r.frame_color,
    'roof_color', r.roof_color,
    'notes', r.notes,
    'admin_notes', r.admin_notes,
    'quoted_price', r.quoted_price,
    'status', r.status,
    'created_at', r.created_at,
    'admin_response_sent_at', r.admin_response_sent_at,
    'module_classification', r.module_classification,
    'carrier_count', r.carrier_count,
    'front_post_count', r.front_post_count,
    'back_post_count', r.back_post_count
  )
  INTO v_result
  FROM public.pergola_requests r
  WHERE r.id = p_request_id
    AND r.response_token = p_token;

  RETURN v_result;
END;
$$;
