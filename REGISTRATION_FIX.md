# Fix for Registration RLS Error

## Problem

When users try to register, they get an error: "new row violates row-level security policy for table 'profiles'"

## Solution

The issue is with the Row Level Security (RLS) policies. We need to update the database and the application code to handle profile creation properly.

### Step 1: Update Database (Run in Supabase SQL Editor)

```sql
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Allow service role to create profiles" ON public.profiles;

-- Create a better policy for profile creation
CREATE POLICY "Users can create own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a function to handle new user profile creation automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'landlord')
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger that calls the function whenever a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Step 2: How It Works

1. **Database Trigger**: When a user signs up via Supabase Auth, a trigger automatically creates their profile
2. **Fallback in App**: If the trigger fails or profile is missing, the app creates it on login
3. **RLS Policy**: Updated to allow users to create their own profiles when authenticated

### Step 3: Test Registration

1. Go to `/signup`
2. Create a new user account
3. The profile should be created automatically
4. Login should work without errors

### What Changed

1. **AuthService**: Removed profile creation from signup, added fallback method
2. **AuthProvider**: Added automatic profile creation on login if missing
3. **Database**: Added trigger for automatic profile creation
4. **RLS Policies**: Fixed to allow proper profile creation

### Alternative Manual Fix

If you prefer not to use the database trigger, you can also:

1. Run only the policy update:

```sql
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;
CREATE POLICY "Users can create own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
```

2. The app will handle profile creation on first login automatically.

## Testing

After applying these changes:

1. Try registering a new user
2. Check that login works
3. Verify the profile is created in the `profiles` table
4. Test both landlord and contractor role registration
