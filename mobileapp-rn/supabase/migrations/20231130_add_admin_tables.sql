-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Add is_admin column to user_profiles if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  user_agent TEXT,
  ip_address TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Create a function to log user actions
CREATE OR REPLACE FUNCTION log_user_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, metadata)
  VALUES (
    auth.uid(),
    TG_OP || ' on ' || TG_TABLE_NAME,
    jsonb_build_object(
      'old', row_to_json(OLD),
      'new', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to log user sign-ins
CREATE OR REPLACE FUNCTION log_sign_in()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, metadata)
  VALUES (
    NEW.id,
    'USER_SIGNED_IN',
    jsonb_build_object(
      'email', NEW.email,
      'last_sign_in_at', NEW.last_sign_in_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger for user sign-ins
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
AFTER UPDATE OF last_sign_in_at ON auth.users
FOR EACH ROW
WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
EXECUTE FUNCTION log_sign_in();

-- Create a policy to allow admins to view all user profiles
CREATE POLICY "Admins can view all user profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT id FROM user_profiles WHERE is_admin = true));

-- Create a policy to allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create a policy to allow admins to view audit logs
CREATE POLICY "Admins can view all audit logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT id FROM user_profiles WHERE is_admin = true));

-- Create a policy to allow users to view their own audit logs
CREATE POLICY "Users can view their own audit logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create a policy to allow users to view their own sessions
CREATE POLICY "Users can view their own sessions"
ON sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create a function to create a user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, is_admin)
  VALUES (NEW.id, NEW.email, false);
  
  -- Log the user creation
  INSERT INTO audit_logs (user_id, action, metadata)
  VALUES (
    NEW.id,
    'USER_CREATED',
    jsonb_build_object('email', NEW.email)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to create a user profile when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to track user sessions
CREATE OR REPLACE FUNCTION public.track_user_session()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete expired sessions
  DELETE FROM sessions WHERE expires_at < NOW();
  
  -- Insert new session
  INSERT INTO sessions (user_id, expires_at, user_agent, ip_address)
  VALUES (
    auth.uid(),
    NOW() + INTERVAL '30 days',
    current_setting('request.headers', true)::json->>'user-agent',
    current_setting('request.headers', true)::json->>'x-forwarded-for'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to track user sessions
DROP TRIGGER IF EXISTS on_auth_user_login_track_session ON auth.users;
CREATE TRIGGER on_auth_user_login_track_session
AFTER UPDATE OF last_sign_in_at ON auth.users
FOR EACH ROW
WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
EXECUTE FUNCTION public.track_user_session();
