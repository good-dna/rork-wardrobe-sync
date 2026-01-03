# Closet App Setup Instructions

This is a Supabase-powered wardrobe management app built with Expo and React Native.

## Features

- ✅ **Authentication**: Supabase Auth with email/password
- ✅ **Profile Management**: Full CRUD on user profiles (name, age, location, favorite category, member since)
- ✅ **Closet Items**: Add, edit, delete clothing items with categories, brands, colors, sizes, conditions, and pricing
- ✅ **Wear Tracking**: Log when you wear items with automatic times_worn and last_worn_at updates via database trigger
- ✅ **Analytics**: View closet statistics including valuation, top brands/colors/categories, and diversity metrics

## Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be ready

### 2. Run SQL Schema

Copy and run the SQL from `supabase-closet-schema.sql` in your Supabase SQL Editor. This will:

- Update the `profiles` table with new fields (age, city, state, country, favorite_category, member_since)
- Create the `items` table for clothing items
- Create the `wear_logs` table for tracking when items are worn
- Set up Row Level Security (RLS) policies
- Create a database trigger that automatically updates `times_worn` and `last_worn_at` when a wear log is inserted
- Create the `get_closet_analytics()` RPC function for analytics

### 3. Configure Environment Variables

Make sure these environment variables are set:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## App Flow

1. **Launch Screen** (`/launch`) - First screen, shows login/signup options
2. **Sign In/Sign Up** (`/auth/sign-in`, `/auth/sign-up`) - Authentication screens
3. **Tab Navigation** (after login):
   - **Home** - Welcome screen with quick stats and actions
   - **Closet** - View all items, search, add new items
   - **Analytics** - View closet statistics and insights
   - **Profile** - Edit profile information, view member since date, logout

## Key Screens

### Home Tab (`app/(tabs)/index.tsx`)
- Displays user welcome message
- Shows item count and member since date
- Quick action buttons to add items or view analytics

### Closet Tab (`app/(tabs)/closet.tsx`)
- Lists all user's clothing items
- Search functionality
- Tap item to view/edit details
- Long press to delete
- FAB button to add new items

### Item Details (`app/closet-item/[id].tsx`)
- View/edit item information
- Shows times worn and last worn date (read-only)
- **"Log Wear" button** - Inserts into wear_logs table (trigger updates item stats automatically)
- Full CRUD operations (create, read, update, delete)

### Analytics Tab (`app/(tabs)/analytics.tsx`)
- Calls `get_closet_analytics()` RPC function
- Displays:
  - Total items and total wears
  - Total purchase value and estimated value
  - Average purchase price and estimated value
  - Top brand, color, and category
  - Unique brands and categories count

### Profile Tab (`app/(tabs)/profile.tsx`)
- Full CRUD on profiles table
- Fields: full_name, age, city, state, country, favorite_category
- **member_since is read-only** (set automatically on signup)
- Edit mode to update profile
- Logout functionality

## Important Notes

### Wear Logging System

The wear logging system uses a **database trigger** to maintain data integrity:

1. User clicks "Log Wear" button
2. App inserts a row into `wear_logs` table with `user_id`, `item_id`, and `worn_at` timestamp
3. Database trigger `on_wear_log_created` automatically:
   - Increments `items.times_worn` by 1
   - Updates `items.last_worn_at` to the wear log timestamp
   - Updates `items.updated_at` to current time

**Do not manually update `times_worn` or `last_worn_at` in the app** - the trigger handles this automatically.

### RLS Security

All tables have Row Level Security enabled:
- Users can only access their own data
- Policies enforce `auth.uid() = user_id` checks
- Trigger functions run with `SECURITY DEFINER` to bypass RLS when updating item stats

### Analytics Function

The `get_closet_analytics(p_user_id UUID)` function:
- Returns JSON object with all statistics
- Runs on the database for optimal performance
- Automatically handles NULL values and edge cases
- Call it from the app using `supabase.rpc('get_closet_analytics', { p_user_id: userId })`

## Development

```bash
# Install dependencies
npm install

# Start the app
npx expo start

# Scan QR code with Expo Go app (iOS/Android)
# Or press 'w' for web
```

## Tech Stack

- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **State Management**: React Query for server state
- **Navigation**: Expo Router (file-based)
- **UI**: Custom components with Lucide icons
