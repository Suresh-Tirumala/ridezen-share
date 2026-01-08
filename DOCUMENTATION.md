# RideRent - Complete Platform Documentation

> **Version:** 1.0.0  
> **Last Updated:** January 2026  
> **Platform Type:** Vehicle Rental Marketplace

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [Database Schema](#4-database-schema)
5. [Authentication System](#5-authentication-system)
6. [User Roles & Permissions](#6-user-roles--permissions)
7. [Features by Role](#7-features-by-role)
8. [Component Structure](#8-component-structure)
9. [Workflows](#9-workflows)
10. [Security Implementation](#10-security-implementation)
11. [Real-time Features](#11-real-time-features)
12. [File Storage](#12-file-storage)
13. [Styling & Design System](#13-styling--design-system)
14. [Environment Configuration](#14-environment-configuration)

---

## 1. Project Overview

### 1.1 Purpose Statement

RideRent is a **peer-to-peer vehicle rental marketplace** that connects vehicle owners with customers seeking short-term vehicle rentals. The platform facilitates:

- **Vehicle Discovery**: Customers can browse, search, and filter available vehicles
- **Direct Communication**: Real-time chat between owners and potential renters
- **Booking Management**: End-to-end rental booking workflow
- **Fleet Management**: Owners can manage multiple vehicle listings

### 1.2 Problem Statement

Traditional vehicle rental services are often:
- Expensive with high overhead costs
- Limited in vehicle variety
- Impersonal with no direct owner communication
- Geographically restricted to commercial locations

### 1.3 Solution

RideRent provides a decentralized marketplace where:
- Individual vehicle owners can monetize idle vehicles
- Customers get access to diverse vehicle options at competitive prices
- Direct communication builds trust between parties
- Location-based discovery enables convenient local rentals

### 1.4 Target Users

| User Type | Description |
|-----------|-------------|
| **Vehicle Owners** | Individuals with cars, bikes, autos, or buses who want to earn rental income |
| **Customers** | Travelers, commuters, or anyone needing temporary vehicle access |

---

## 2. Technology Stack

### 2.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI library for component-based architecture |
| **TypeScript** | Latest | Type-safe JavaScript for better DX |
| **Vite** | Latest | Fast build tool and dev server |
| **React Router DOM** | 6.30.1 | Client-side routing |
| **TanStack Query** | 5.83.0 | Server state management & caching |
| **Tailwind CSS** | Latest | Utility-first CSS framework |
| **Shadcn/UI** | Latest | Accessible component library |
| **Lucide React** | 0.462.0 | Icon library |

### 2.2 Backend (Lovable Cloud / Supabase)

| Technology | Purpose |
|------------|---------|
| **Supabase Auth** | JWT-based authentication |
| **PostgreSQL** | Relational database |
| **Row Level Security (RLS)** | Database-level access control |
| **Supabase Realtime** | WebSocket-based live updates |
| **Supabase Storage** | File/image storage |
| **Edge Functions** | Serverless compute (if needed) |

### 2.3 Key Libraries

```json
{
  "form-handling": "react-hook-form + @hookform/resolvers",
  "validation": "zod",
  "notifications": "sonner",
  "date-handling": "date-fns",
  "styling": "tailwind-merge + class-variance-authority",
  "animations": "tailwindcss-animate"
}
```

---

## 3. Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   React     │  │  TanStack   │  │  Supabase Client    │  │
│  │   Router    │  │   Query     │  │  (Auth + DB + RT)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   LOVABLE CLOUD (Supabase)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Auth API   │  │  REST API   │  │  Realtime WebSocket │  │
│  │  (JWT)      │  │  (PostgREST)│  │  (Presence + DB)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                              │                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ PostgreSQL  │  │   Storage   │  │  Edge Functions     │  │
│  │ + RLS       │  │  (Buckets)  │  │  (Serverless)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

```
User Action → React Component → Supabase Client → PostgreSQL
                                      ↓
                              RLS Policy Check
                                      ↓
                              Data Response
                                      ↓
                              TanStack Query Cache
                                      ↓
                              UI Update
```

### 3.3 File Structure

```
src/
├── components/
│   ├── ui/                    # Shadcn/UI components
│   ├── user/                  # Customer-specific components
│   │   ├── UserHome.tsx
│   │   ├── OwnerProfileSheet.tsx
│   │   └── tabs/
│   │       ├── HomeTab.tsx
│   │       ├── NearbyTab.tsx
│   │       ├── SearchTab.tsx
│   │       └── ProfileTab.tsx
│   ├── owner/                 # Owner-specific components
│   │   ├── OwnerDashboard.tsx
│   │   ├── OwnerProfileSheet.tsx
│   │   ├── OwnerSettingsSheet.tsx
│   │   └── VehicleImageUpload.tsx
│   └── chat/
│       └── ChatScreen.tsx
├── contexts/
│   └── AuthContext.tsx        # Global auth state
├── hooks/
│   ├── use-toast.ts
│   └── use-mobile.tsx
├── integrations/
│   └── supabase/
│       ├── client.ts          # Supabase client instance
│       └── types.ts           # Auto-generated types
├── pages/
│   ├── Index.tsx              # Main dashboard router
│   ├── Auth.tsx               # Login/Signup page
│   └── NotFound.tsx
├── lib/
│   └── utils.ts               # Utility functions
├── App.tsx                    # Root component
├── main.tsx                   # Entry point
└── index.css                  # Global styles + design tokens
```

---

## 4. Database Schema

### 4.1 Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  auth.users  │       │   profiles   │       │  user_roles  │
│──────────────│       │──────────────│       │──────────────│
│ id (PK)      │◄──────│ id (FK)      │       │ id (PK)      │
│ email        │       │ full_name    │       │ user_id (FK) │──►│
│ ...          │       │ email        │       │ role (enum)  │
└──────────────┘       │ phone        │       └──────────────┘
       │               │ avatar_url   │
       │               └──────────────┘
       │
       ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   vehicles   │       │   bookings   │       │conversations │
│──────────────│       │──────────────│       │──────────────│
│ id (PK)      │◄──────│ vehicle_id   │       │ id (PK)      │
│ owner_id(FK) │       │ user_id (FK) │       │ user_id (FK) │
│ vehicle_type │       │ owner_id(FK) │       │ owner_id(FK) │
│ brand        │       │ start_date   │       │ vehicle_id   │
│ model        │       │ end_date     │       └──────────────┘
│ price_per_day│       │ total_price  │              │
│ images[]     │       │ status       │              │
│ is_available │       └──────────────┘              ▼
│ is_disabled  │                              ┌──────────────┐
│ location_*   │                              │   messages   │
└──────────────┘                              │──────────────│
                                              │ id (PK)      │
┌──────────────┐                              │ conversation │
│tourism_packs │                              │ sender_id    │
│──────────────│                              │ content      │
│ id (PK)      │                              │ is_read      │
│ title        │                              └──────────────┘
│ description  │
│ vehicle_type │
│ duration_days│
│ price        │
│ highlights[] │
└──────────────┘
```

### 4.2 Table Definitions

#### `profiles`
Stores user profile information, created automatically on signup.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | References auth.users(id) |
| full_name | text | Yes | User's display name |
| email | text | Yes | Contact email |
| phone | text | Yes | Contact phone |
| avatar_url | text | Yes | Profile picture URL |
| created_at | timestamptz | Yes | Account creation time |
| updated_at | timestamptz | Yes | Last update time |

#### `user_roles`
Stores user role assignments (owner/user).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| user_id | uuid | No | References auth.users |
| role | app_role | No | Enum: 'owner' or 'user' |

#### `vehicles`
Vehicle listings created by owners.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| owner_id | uuid | No | Owner's user ID |
| vehicle_type | vehicle_type | No | Enum: car/bike/auto/bus |
| registration_number | text | No | Vehicle registration |
| brand | text | Yes | Vehicle brand (Toyota, etc.) |
| model | text | Yes | Vehicle model |
| price_per_day | numeric | No | Daily rental price |
| description | text | Yes | Vehicle description |
| images | text[] | Yes | Array of image URLs |
| location_address | text | Yes | Pickup location |
| location_lat | numeric | Yes | Latitude coordinate |
| location_lng | numeric | Yes | Longitude coordinate |
| is_available | boolean | Yes | Currently available |
| is_disabled | boolean | Yes | Hidden by owner |
| created_at | timestamptz | Yes | Listing creation time |
| updated_at | timestamptz | Yes | Last update time |

#### `bookings`
Rental bookings between users and vehicles.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| vehicle_id | uuid | No | Booked vehicle |
| user_id | uuid | No | Customer who booked |
| owner_id | uuid | No | Vehicle owner |
| start_date | date | No | Rental start date |
| end_date | date | No | Rental end date |
| total_price | numeric | No | Total booking cost |
| status | text | Yes | pending/confirmed/cancelled/completed |
| created_at | timestamptz | Yes | Booking creation time |
| updated_at | timestamptz | Yes | Last update time |

#### `conversations`
Chat threads between users and owners.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| user_id | uuid | No | Customer in chat |
| owner_id | uuid | No | Owner in chat |
| vehicle_id | uuid | Yes | Related vehicle (optional) |
| created_at | timestamptz | Yes | Conversation start |
| updated_at | timestamptz | Yes | Last activity |

#### `messages`
Individual messages within conversations.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| conversation_id | uuid | No | Parent conversation |
| sender_id | uuid | No | Message sender |
| content | text | No | Message text |
| is_read | boolean | Yes | Read status |
| created_at | timestamptz | Yes | Message timestamp |

#### `tourism_packages`
Pre-built travel packages (read-only for users).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| title | text | No | Package name |
| description | text | Yes | Package details |
| vehicle_type | vehicle_type | No | Required vehicle type |
| duration_days | integer | No | Trip duration |
| price | numeric | No | Package price |
| highlights | text[] | Yes | Package features |
| image_url | text | Yes | Package image |
| created_at | timestamptz | Yes | Creation time |

### 4.3 Enums

```sql
-- User roles
CREATE TYPE app_role AS ENUM ('owner', 'user');

-- Vehicle types
CREATE TYPE vehicle_type AS ENUM ('car', 'bike', 'auto', 'bus');
```

---

## 5. Authentication System

### 5.1 Auth Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  /auth page │────►│  Supabase   │────►│  Database   │
│             │     │    Auth     │     │  Triggers   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   ▼                   ▼
       │            ┌─────────────┐     ┌─────────────┐
       │            │    JWT      │     │  profiles   │
       │            │   Token     │     │  user_roles │
       │            └─────────────┘     └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────────────────────────────┐
│         AuthContext Provider         │
│  - user, session, role, viewMode     │
│  - signIn(), signUp(), signOut()     │
│  - updateProfile()                   │
└─────────────────────────────────────┘
```

### 5.2 Sign Up Process

1. User selects role (Owner or Customer)
2. Enters email, password, full name
3. Supabase Auth creates user in `auth.users`
4. Database trigger `handle_new_user()` fires:
   - Creates row in `profiles` table
   - Creates row in `user_roles` table with selected role
5. JWT token returned to client
6. User redirected to dashboard

### 5.3 Sign In Process

1. User selects view mode (Owner or Customer)
2. Enters email and password
3. Supabase validates credentials
4. JWT token returned
5. `AuthContext` stores:
   - `user`: Supabase user object
   - `session`: JWT session
   - `role`: From `user_roles` table
   - `viewMode`: Selected at login (can override role)
   - `profile`: From `profiles` table
6. User redirected to appropriate dashboard

### 5.4 AuthContext API

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: 'owner' | 'user' | null;
  viewMode: 'owner' | 'user' | null;
  setViewMode: (mode: AppRole) => void;
  profile: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  loading: boolean;
  signUp: (email, password, fullName, role) => Promise<{ error }>;
  signIn: (email, password, viewAs?) => Promise<{ error }>;
  signOut: () => Promise<void>;
  updateProfile: (data) => Promise<{ error }>;
}
```

---

## 6. User Roles & Permissions

### 6.1 Role Definitions

| Role | Description | Dashboard |
|------|-------------|-----------|
| **owner** | Vehicle owners who list and manage vehicles | OwnerDashboard |
| **user** | Customers who browse and rent vehicles | UserHome |

### 6.2 View Mode

Users can select their preferred dashboard view during login, regardless of their actual role. This is stored in `viewMode` state.

```
Actual Role: owner
View Mode: user
Result: Shows UserHome (customer view)
```

### 6.3 Permission Matrix

| Action | Owner | User | Guest |
|--------|-------|------|-------|
| View available vehicles | ✅ | ✅ | ❌ |
| View tourism packages | ✅ | ✅ | ❌ |
| Create vehicle listing | ✅ | ❌ | ❌ |
| Edit own vehicles | ✅ | ❌ | ❌ |
| Delete own vehicles | ✅ | ❌ | ❌ |
| Create booking | ✅ | ✅ | ❌ |
| View own bookings | ✅ | ✅ | ❌ |
| Start conversation | ✅ | ✅ | ❌ |
| Send messages | ✅ | ✅ | ❌ |
| View own profile | ✅ | ✅ | ❌ |
| Update own profile | ✅ | ✅ | ❌ |

---

## 7. Features by Role

### 7.1 Customer Features

#### Home Tab
- **Vehicle Categories**: Filter by Car, Bike, Auto
- **Tourism Packages**: Pre-built travel packages with pricing
- **Vehicle Cards**: Browse available rentals with:
  - Vehicle image
  - Brand and model
  - Price per day
  - Location
  - Chat with owner button
  - View owner profile button

#### Nearby Tab
- Location-based vehicle discovery
- Geolocation integration
- Distance-based filtering

#### Search Tab
- Text-based vehicle search
- Filter by vehicle type
- Location search

#### Profile Tab
- Personal information display
- Edit name and phone
- Rental history with status
- Payment methods (placeholder)
- Sign out option

### 7.2 Owner Features

#### Dashboard
- **Header Stats**: Unread message count
- **Add Vehicle Dialog**:
  - Vehicle type selection
  - Registration number
  - Brand and model
  - Price per day
  - Location
  - Image upload (up to 5)
- **Vehicle List**:
  - Status badges (Available/Booked/Disabled)
  - Toggle availability
  - Delete vehicle

#### Profile Sheet
- Personal details
- Vehicle statistics:
  - Total vehicles
  - Available vehicles
  - Rented vehicles
  - Disabled vehicles
- Recent bookings
- Recent conversations with unread counts
- Quick chat access

#### Settings Sheet
- **Profile Section**: Edit name, phone, avatar
- **Notifications**: Toggle preferences
- **Business Settings**: Business hours, policies
- **Payment Settings**: Payout preferences
- **Security**: Password change, 2FA
- **Help & Support**: Contact options
- **Legal**: Terms, Privacy, About
- **Dark Mode**: Theme toggle

---

## 8. Component Structure

### 8.1 Core Components

```
App.tsx
├── QueryClientProvider (TanStack Query)
├── AuthProvider (Auth State)
├── TooltipProvider
├── Toaster (Notifications)
├── BrowserRouter
│   └── Routes
│       ├── "/" → Index.tsx
│       │   ├── OwnerDashboard (if owner view)
│       │   └── UserHome (if user view)
│       ├── "/auth" → Auth.tsx
│       └── "*" → NotFound.tsx
```

### 8.2 UserHome Component Tree

```
UserHome
├── Header (Sticky)
├── TabContent (Animated)
│   ├── HomeTab
│   │   ├── VehicleCategories
│   │   ├── TourismPackages (Horizontal scroll)
│   │   └── VehicleCards
│   ├── NearbyTab
│   │   └── LocationBasedVehicles
│   ├── SearchTab
│   │   ├── SearchInput
│   │   └── SearchResults
│   └── ProfileTab
│       ├── ProfileCard
│       ├── RentalHistory
│       └── PaymentMethods
├── BottomNavigation (Fixed)
├── OwnerProfileSheet (Overlay)
└── ChatScreen (Overlay)
```

### 8.3 OwnerDashboard Component Tree

```
OwnerDashboard
├── Header (Sticky)
│   ├── Logo
│   ├── ProfileButton (with badge)
│   └── SettingsButton
├── AddVehicleDialog
│   ├── VehicleForm
│   └── VehicleImageUpload
├── VehicleList
│   └── VehicleCard (for each)
│       ├── VehicleInfo
│       ├── StatusBadge
│       └── ActionButtons
├── OwnerProfileSheet (Overlay)
├── OwnerSettingsSheet (Overlay)
└── ChatScreen (Overlay)
```

---

## 9. Workflows

### 9.1 Vehicle Listing Workflow (Owner)

```
┌─────────────────┐
│  Click "Add     │
│  New Vehicle"   │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Fill Form:     │
│  - Type         │
│  - Registration │
│  - Brand/Model  │
│  - Price        │
│  - Location     │
│  - Images       │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Submit Form    │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Supabase:      │
│  INSERT vehicle │
│  + RLS check    │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Invalidate     │
│  Query Cache    │
└────────┬────────┘
         ▼
┌─────────────────┐
│  UI Updates     │
│  Toast Success  │
└─────────────────┘
```

### 9.2 Chat Initiation Workflow (Customer)

```
┌─────────────────┐
│  Click "Chat"   │
│  on Vehicle     │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Check existing │
│  conversation   │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│ EXISTS │ │  NEW   │
└───┬────┘ └───┬────┘
    │          │
    │          ▼
    │    ┌─────────────┐
    │    │ INSERT new  │
    │    │ conversation│
    │    └──────┬──────┘
    │           │
    └─────┬─────┘
          ▼
┌─────────────────┐
│  Open ChatScreen│
│  with convo ID  │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Fetch messages │
│  Subscribe RT   │
└─────────────────┘
```

### 9.3 Message Flow (Real-time)

```
┌─────────────────┐
│  User types     │
│  message        │
└────────┬────────┘
         ▼
┌─────────────────┐
│  INSERT into    │
│  messages table │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Supabase       │
│  Realtime       │
│  broadcasts     │
└────────┬────────┘
         ▼
┌─────────────────────────────────┐
│  All subscribed clients         │
│  receive postgres_changes event │
└────────┬────────────────────────┘
         ▼
┌─────────────────┐
│  UI updates     │
│  with new msg   │
└─────────────────┘
```

---

## 10. Security Implementation

### 10.1 Row Level Security (RLS) Policies

#### Vehicles Table
```sql
-- Anyone can view available, non-disabled vehicles
CREATE POLICY "Anyone can view available vehicles" 
ON vehicles FOR SELECT 
USING ((is_available = true) AND (is_disabled = false));

-- Owners can view all their own vehicles
CREATE POLICY "Owners can view their own vehicles" 
ON vehicles FOR SELECT 
USING (auth.uid() = owner_id);

-- Only owners with 'owner' role can insert vehicles
CREATE POLICY "Owners can insert vehicles" 
ON vehicles FOR INSERT 
WITH CHECK ((auth.uid() = owner_id) AND has_role(auth.uid(), 'owner'));

-- Owners can update their own vehicles
CREATE POLICY "Owners can update their vehicles" 
ON vehicles FOR UPDATE 
USING (auth.uid() = owner_id);

-- Owners can delete their own vehicles
CREATE POLICY "Owners can delete their vehicles" 
ON vehicles FOR DELETE 
USING (auth.uid() = owner_id);
```

#### Messages Table
```sql
-- Users can only view messages in their conversations
CREATE POLICY "Users can view messages in their conversations" 
ON messages FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM conversations c
  WHERE c.id = messages.conversation_id 
  AND (c.user_id = auth.uid() OR c.owner_id = auth.uid())
));

-- Users can only send messages in their conversations
CREATE POLICY "Users can send messages in their conversations" 
ON messages FOR INSERT 
WITH CHECK (
  (auth.uid() = sender_id) AND 
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id 
    AND (c.user_id = auth.uid() OR c.owner_id = auth.uid())
  )
);
```

### 10.2 Security Functions

```sql
-- Check if user has a specific role (prevents privilege escalation)
CREATE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### 10.3 Client-Side Validation

```typescript
// Zod schema for signup validation
const signUpSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["owner", "user"]),
});
```

---

## 11. Real-time Features

### 11.1 Message Subscriptions

```typescript
// Subscribe to new messages in a conversation
const channel = supabase
  .channel(`messages:${conversationId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    },
    (payload) => {
      // Add new message to UI
      setMessages(prev => [...prev, payload.new]);
    }
  )
  .subscribe();
```

### 11.2 Unread Count Polling

```typescript
// Poll for unread messages every 30 seconds
const { data: unreadCount } = useQuery({
  queryKey: ["owner-unread-messages", user?.id],
  queryFn: async () => {
    // Count unread messages in owner's conversations
  },
  refetchInterval: 30000,
});
```

---

## 12. File Storage

### 12.1 Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `vehicle-images` | Yes | Vehicle listing photos |

### 12.2 Image Upload Flow

```typescript
// 1. Select files
// 2. Validate (type, size)
// 3. Generate unique filename
const fileName = `${ownerId}/${Date.now()}-${file.name}`;

// 4. Upload to storage
const { data, error } = await supabase.storage
  .from('vehicle-images')
  .upload(fileName, file);

// 5. Get public URL
const { data: urlData } = supabase.storage
  .from('vehicle-images')
  .getPublicUrl(fileName);

// 6. Store URL in vehicle record
```

---

## 13. Styling & Design System

### 13.1 Design Tokens (CSS Variables)

```css
:root {
  /* Primary Colors */
  --primary: 243 75% 59%;          /* Deep indigo */
  --primary-foreground: 0 0% 100%;
  
  /* Accent Colors */
  --accent: 16 85% 60%;            /* Coral */
  --accent-foreground: 0 0% 100%;
  
  /* Semantic Colors */
  --success: 142 76% 36%;
  --warning: 38 92% 50%;
  --destructive: 0 84% 60%;
  
  /* Backgrounds */
  --background: 240 20% 98%;
  --card: 0 0% 100%;
  --muted: 240 5% 96%;
  
  /* Borders */
  --border: 240 6% 90%;
  --ring: 243 75% 59%;
}
```

### 13.2 Component Variants

```typescript
// Button variants
const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        accent: "bg-accent text-accent-foreground",
        outline: "border border-input bg-background",
        ghost: "hover:bg-accent/10",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-12 px-6",
        icon: "h-10 w-10",
      },
    },
  }
);
```

### 13.3 Animation Classes

```css
/* Fade animations */
.animate-fade-in { animation: fade-in 0.3s ease-out; }

/* Scale animations */
.animate-scale-in { animation: scale-in 0.2s ease-out; }

/* Hover effects */
.hover-scale { transition: transform 0.2s; }
.hover-scale:hover { transform: scale(1.05); }
```

### 13.4 Glass Effect

```css
.glass {
  background: hsl(var(--background) / 0.8);
  backdrop-filter: blur(10px);
}
```

### 13.5 Theme Behavior

| Page/Interface | Theme Support | Notes |
|----------------|---------------|-------|
| **Auth Page** (Login/Signup) | Light only | Locked to light theme for brand consistency |
| **Customer Dashboard** | Light + Dark | Respects user theme preference |
| **Owner Dashboard** | Light + Dark | Respects user theme preference |

The auth page forces light theme regardless of user preference. When navigating away from auth, the previous theme is restored.

### 13.6 Splash Screen

A responsive animated splash screen (`RideRentLOGO_Animated.mp4`) plays upon successful login or signup:

| Device | Sizing | Behavior |
|--------|--------|----------|
| Mobile | `max-w-[90vw] max-h-[80vh]` | Centered, contained |
| Tablet | `max-w-[75vw] max-h-[75vh]` | Responsive scaling |
| Desktop/Laptop | `max-w-[70vw] max-h-[70vh]` | Large display with object-cover |

**Video Controls:**
- Native controls disabled (`controls={false}`)
- Picture-in-Picture disabled (`disablePictureInPicture`)
- Context menu disabled (no right-click options)
- Pointer events disabled (no interaction)
- `controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"`

---

## 14. Environment Configuration

### 14.1 Environment Variables

```env
# Auto-configured by Lovable Cloud
VITE_SUPABASE_URL=https://xmohbcwylcamcsffobec.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
VITE_SUPABASE_PROJECT_ID=xmohbcwylcamcsffobec
```

### 14.2 Supabase Client Configuration

```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

---

## 15. Future Enhancements

### Planned Features
- [ ] Booking approval workflow
- [ ] Push notifications
- [ ] Payment integration (Stripe/Razorpay)
- [ ] Vehicle reviews and ratings
- [ ] Advanced search filters
- [ ] Map-based vehicle discovery
- [ ] Booking calendar
- [ ] Invoice generation
- [ ] Admin dashboard

---

## 16. Support

For technical issues or questions:
- Check the [Lovable Documentation](https://docs.lovable.dev)
- Review error logs in browser console
- Contact support via the Lovable platform

---

*This documentation is auto-generated and should be updated as the application evolves.*
