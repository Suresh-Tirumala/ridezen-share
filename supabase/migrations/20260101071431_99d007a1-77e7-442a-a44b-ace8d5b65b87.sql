-- Enable realtime for vehicles table so users see new listings instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;