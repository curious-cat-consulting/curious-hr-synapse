/*
===============================================================================
                              CUSTOM TYPES & ENUMS
===============================================================================
*/

-- Create user role enum type
create type public.user_role as enum ('USER', 'MANAGER');



/*
===============================================================================
                              PROFILES TABLE
===============================================================================
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  email text,
  full_name text,
  avatar_url text,
  roles user_role[] DEFAULT ARRAY['USER']::user_role[],
  created_at timestamptz DEFAULT now()
);

-- Create a trigger to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);





/*
===============================================================================
                              UTILITY FUNCTIONS & TRIGGERS
===============================================================================
*/

-- Create function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at timestamp
create trigger handle_updated_at
  before update on public.expenses
  for each row
  execute function public.handle_updated_at();