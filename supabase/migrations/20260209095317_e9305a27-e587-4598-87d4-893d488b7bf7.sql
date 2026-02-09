-- Create a secure view for public vehicle access that excludes registration_number
CREATE OR REPLACE VIEW public.vehicles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  owner_id,
  vehicle_type,
  price_per_day,
  is_available,
  is_disabled,
  location_lat,
  location_lng,
  created_at,
  updated_at,
  images,
  description,
  location_address,
  brand,
  model
FROM public.vehicles
WHERE is_available = true AND is_disabled = false;

-- Grant SELECT permission on the view to authenticated and anon users
GRANT SELECT ON public.vehicles_public TO authenticated, anon;