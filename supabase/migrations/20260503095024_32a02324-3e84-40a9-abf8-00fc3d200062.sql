UPDATE public.videos v
SET company_id = p.company_id
FROM public.profiles p
WHERE v.user_id = p.id
  AND v.company_id IS NULL
  AND p.company_id IS NOT NULL;