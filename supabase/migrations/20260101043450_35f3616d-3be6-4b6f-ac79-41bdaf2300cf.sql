-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('owner', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table (CRITICAL: roles stored separately for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create vehicle types enum
CREATE TYPE public.vehicle_type AS ENUM ('car', 'bike', 'auto', 'bus');

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_type vehicle_type NOT NULL,
  registration_number TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  price_per_day DECIMAL(10, 2) NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  is_disabled BOOLEAN DEFAULT FALSE,
  images TEXT[] DEFAULT '{}',
  description TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table for chat
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, owner_id, vehicle_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tourism packages table
CREATE TABLE public.tourism_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  vehicle_type vehicle_type NOT NULL,
  duration_days INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  highlights TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourism_packages ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email
  );
  
  -- Insert user role based on metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'user')
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable" ON public.profiles
  FOR SELECT USING (true);

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Vehicles policies
CREATE POLICY "Anyone can view available vehicles" ON public.vehicles
  FOR SELECT USING (is_available = TRUE AND is_disabled = FALSE);

CREATE POLICY "Owners can view their own vehicles" ON public.vehicles
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert vehicles" ON public.vehicles
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id AND 
    public.has_role(auth.uid(), 'owner')
  );

CREATE POLICY "Owners can update their vehicles" ON public.vehicles
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their vehicles" ON public.vehicles
  FOR DELETE USING (auth.uid() = owner_id);

-- Bookings policies
CREATE POLICY "Users can view their bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = owner_id);

CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = owner_id);

-- Conversations policies
CREATE POLICY "Users can view their conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = owner_id);

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = owner_id);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.user_id = auth.uid() OR c.owner_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.user_id = auth.uid() OR c.owner_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their messages read status" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.user_id = auth.uid() OR c.owner_id = auth.uid())
    )
  );

-- Tourism packages are public
CREATE POLICY "Anyone can view tourism packages" ON public.tourism_packages
  FOR SELECT USING (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Create storage bucket for vehicle images
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-images', 'vehicle-images', true);

-- Storage policies for vehicle images
CREATE POLICY "Anyone can view vehicle images" ON storage.objects
  FOR SELECT USING (bucket_id = 'vehicle-images');

CREATE POLICY "Authenticated users can upload vehicle images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'vehicle-images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their vehicle images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'vehicle-images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their vehicle images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'vehicle-images' AND
    auth.role() = 'authenticated'
  );

-- Insert sample tourism packages
INSERT INTO public.tourism_packages (title, description, vehicle_type, duration_days, price, image_url, highlights) VALUES
('Hill Station Adventure', 'Explore beautiful hill stations with our premium car package', 'car', 3, 299.99, NULL, ARRAY['Mountain views', 'Scenic routes', 'Comfortable travel', 'Guided tours']),
('City Tour Express', 'Quick city exploration on comfortable bikes', 'bike', 1, 49.99, NULL, ARRAY['City landmarks', 'Flexible timing', 'Local experience']),
('Coastal Highway Trip', 'Drive along scenic coastal highways', 'car', 2, 199.99, NULL, ARRAY['Beach stops', 'Sunset views', 'Photo opportunities']),
('Local Discovery Ride', 'Explore local areas with an auto rickshaw', 'auto', 1, 29.99, NULL, ARRAY['Authentic experience', 'Local guide', 'Hidden gems']);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();