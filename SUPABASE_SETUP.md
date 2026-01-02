# Supabase Setup Guide

This guide will help you connect your app to Supabase for authentication and database features.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created

## Setup Instructions

### 1. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on the "Settings" icon in the sidebar
3. Navigate to "API" settings
4. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)
   - **Service Role Key** (starts with `eyJ...`) - **Keep this secret!**

### 2. Configure Environment Variables

1. Open the `.env` file in the root of your project
2. Replace the placeholder values with your actual Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important:** 
- Variables starting with `EXPO_PUBLIC_` are exposed to the client
- The `SUPABASE_SERVICE_ROLE_KEY` is only used on the backend and should never be exposed to clients
- Never commit your `.env` file to version control

### 3. Set Up Database Tables

Run the SQL migrations in your Supabase SQL Editor to create the necessary tables:

1. Go to the "SQL Editor" in your Supabase dashboard
2. Create a new query
3. Copy and paste the contents of `supabase-sneaker-tables.sql` (or create your own migrations)
4. Run the query to create tables

### 4. Enable Row Level Security (RLS)

For security, enable RLS on your tables:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wardrobe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sneakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sneaker_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sneaker_wishlist ENABLE ROW LEVEL SECURITY;

-- Example: Allow users to read/write their own data
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Add similar policies for other tables
CREATE POLICY "Users can view their own items"
  ON wardrobe_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items"
  ON wardrobe_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
  ON wardrobe_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
  ON wardrobe_items FOR DELETE
  USING (auth.uid() = user_id);
```

### 5. Configure Authentication

1. Go to "Authentication" → "Providers" in your Supabase dashboard
2. Enable "Email" provider
3. Configure email templates (optional)
4. Set up redirect URLs for email confirmation:
   - Add your app's URL scheme (e.g., `myapp://`)
   - For web: Add your domain

### 6. Test the Connection

1. Restart your development server
2. The app should now connect to Supabase
3. Try signing up a new user
4. Check the "Authentication" → "Users" section in Supabase to see the new user

## Features Enabled

Once Supabase is connected, the following features will work:

- ✅ User authentication (sign up, sign in, sign out)
- ✅ User profile management
- ✅ Wardrobe items stored in cloud
- ✅ Outfit management
- ✅ Calendar/plans synchronization
- ✅ Multi-device sync
- ✅ Real-time updates (if enabled)

## Demo Mode

If Supabase is not configured, the app will run in **demo mode**:
- All data is stored locally using AsyncStorage
- No authentication required
- Data is not synced across devices
- Perfect for testing and development

## Troubleshooting

### "Supabase not configured" message
- Check that your `.env` file has the correct values
- Make sure to restart your development server after changing `.env`
- Verify the environment variables are being loaded

### Authentication errors
- Check that email auth is enabled in Supabase
- Verify RLS policies are set up correctly
- Check Supabase logs for detailed error messages

### Connection errors
- Verify your Supabase project URL is correct
- Check your internet connection
- Make sure Supabase project is not paused (free tier projects pause after inactivity)

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth with React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## Security Best Practices

1. **Never commit `.env` to version control**
   - Add `.env` to `.gitignore`
   - Use separate credentials for development and production

2. **Use RLS policies**
   - Always enable RLS on tables with user data
   - Test your policies thoroughly

3. **Keep service role key secret**
   - Only use it on the backend
   - Never expose it to the client

4. **Use HTTPS**
   - Always use secure connections
   - Enable HTTPS for your production domain

5. **Validate user input**
   - Always validate and sanitize user input
   - Use Supabase's built-in validation features
