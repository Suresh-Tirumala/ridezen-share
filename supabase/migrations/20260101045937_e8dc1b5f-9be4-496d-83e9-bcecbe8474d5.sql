-- Allow users to view vehicles they have booked
CREATE POLICY "Users can view vehicles they have booked" 
ON public.vehicles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.vehicle_id = vehicles.id 
    AND bookings.user_id = auth.uid()
  )
);