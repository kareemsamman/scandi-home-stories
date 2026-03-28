
-- 1. Fix notify_contact_sms: add SET search_path
CREATE OR REPLACE FUNCTION public.notify_contact_sms()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  s            jsonb;
  admin_phone  text;
  phone_fmt    text;
  sms_msg      text;
  xml_body     text;
  dlr          text;
begin
  select value into s from app_settings where key = 'sms';

  if s is null or not coalesce((s->>'enabled')::boolean, false) then
    return new;
  end if;

  admin_phone := s->>'admin_phone';
  if admin_phone is null or s->>'token' is null then
    return new;
  end if;

  phone_fmt := regexp_replace(admin_phone, '[\s\-\+]', '', 'g');
  if phone_fmt like '0%' then
    phone_fmt := '972' || substring(phone_fmt from 2);
  end if;

  sms_msg :=
    '📬 פנייה חדשה מהאתר' || chr(10) ||
    'שם: '     || new.name  || chr(10) ||
    'אימייל: ' || new.email ||
    case when new.phone is not null
      then chr(10) || 'טל: ' || new.phone
      else ''
    end ||
    chr(10) || 'הודעה: ' || left(new.message, 120) ||
    case when length(new.message) > 120 then '…' else '' end;

  dlr := left(replace(gen_random_uuid()::text, '-', ''), 16);

  xml_body :=
    '<?xml version="1.0" encoding="UTF-8"?>' ||
    '<sms>' ||
      '<user><username>' || (s->>'user') || '</username></user>' ||
      '<source>' || coalesce(s->>'source', 'AMGPergola') || '</source>' ||
      '<destinations><phone id="' || dlr || '">' || phone_fmt || '</phone></destinations>' ||
      '<message>' || sms_msg || '</message>' ||
    '</sms>';

  perform extensions.http_post(
    url     := 'https://019sms.co.il/api',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (s->>'token'),
      'Content-Type',  'application/xml',
      'charset',       'utf-8'
    ),
    body    := xml_body
  );

  return new;
end;
$function$;

-- 2. Tighten app_settings public read policy to exclude sensitive keys
DROP POLICY IF EXISTS public_read_settings ON public.app_settings;
CREATE POLICY public_read_settings ON public.app_settings
  FOR SELECT TO anon, authenticated
  USING (key NOT IN ('sms', 'sms_messages'));
