# 🤖 RoboRush 2026 - Real-Time Leaderboard

<div align="center">

![RoboRush Banner](https://img.shields.io/badge/ROBO_RUSH-2026-FFFF00?style=for-the-badge&labelColor=000000)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=for-the-badge&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)

**Production-ready, real-time leaderboard system for robotics competitions**

[Features](#-features) • [Quick Start](#-quick-start) • [Deployment](#-deployment) • [Architecture](#-architecture)

</div>

---

## ✨ Features

### 🎯 Real-Time Performance
- **Zero-lag updates**: Supabase Realtime broadcasts score changes instantly
- **1000+ concurrent viewers**: Edge-cached with Vercel CDN distribution
- **Multiple admins**: Atomic score updates prevent race conditions
- **Sub-second latency**: Optimized database queries with proper indexing

### 🎨 Futuristic UI/UX
- **ERS Club Branding**: Dark theme with neon yellow accents
- **Circuit board aesthetics**: PCB patterns and angular panel design
- **Smooth animations**: Framer Motion powered transitions
- **Esports-style layout**: Rank badges, live status indicators, scan effects
- **Fully responsive**: Mobile-optimized for all screen sizes

### 🔐 Admin Panel
- **Secure authentication**: httpOnly session cookies
- **Score management**: Update scores with audit trail
- **Team CRUD**: Create, update, delete teams
- **Status control**: Active/Inactive/Disqualified team states
- **Real-time sync**: Changes instantly visible to all viewers

### 🚀 Production-Ready
- **Edge Runtime**: Global distribution via Vercel Edge Network
- **Database RLS**: Row-Level Security for read-only public access
- **Connection pooling**: Handles high concurrent database connections
- **Type-safe**: Full TypeScript with Zod validation
- **Scalable**: Ready for live competition deployment

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Supabase account ([create one free](https://supabase.com))
- Vercel account (optional, for deployment)

### 1. Clone & Install

```bash
git clone https://github.com/ShirshenduR/RoboRush-Leaderboard.git
cd RoboRush-Leaderboard
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **Project Settings** → **API**
3. Copy your **Project URL** and **anon public key**
4. Go to **SQL Editor** and run the migration files:
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Execute in SQL Editor
   - Copy contents of `supabase/migrations/002_performance_optimizations.sql`
   - Execute in SQL Editor

5. Enable Realtime:
   - Go to **Database** → **Replication**
   - Enable replication for the `teams` table

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:

```bash
# From Supabase Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# From Supabase Project Settings > API > Service Role (keep secret!)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Set a secure admin password
ADMIN_PASSWORD=your_secure_password_here
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the leaderboard.

Access admin panel at [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 📦 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Add environment variables from `.env.local`
   - Click "Deploy"

3. **Configure Vercel Settings**
   - Go to Project Settings → Environment Variables
   - Add all variables from your `.env.local`
   - Redeploy if needed

4. **Enable Edge Runtime** (Already configured in code)
   - The app automatically uses Vercel Edge Network
   - No additional configuration needed

### Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

---

## 🏗️ Architecture

### Tech Stack

```
Frontend:
├── Next.js 14 (App Router)
├── React 18
├── TypeScript
├── Tailwind CSS
└── Framer Motion

Backend:
├── Next.js Server Actions
├── Supabase PostgreSQL
├── Supabase Realtime
└── Row-Level Security (RLS)

Deployment:
├── Vercel Edge Network
├── Vercel CDN Caching
└── Supabase Cloud Database
```

### Project Structure

```
roborush-leaderboard/
├── app/
│   ├── actions.ts              # Server actions (score updates, auth)
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Public leaderboard (Edge Runtime)
│   ├── globals.css             # Global styles
│   ├── admin/
│   │   ├── layout.tsx          # Admin auth wrapper
│   │   ├── page.tsx            # Admin dashboard
│   │   └── login/
│   │       └── page.tsx        # Admin login
│   └── api/
│       └── teams/
│           └── route.ts        # Cached API endpoint
├── components/
│   └── Leaderboard.tsx         # Real-time leaderboard component
├── lib/
│   └── supabase.ts             # Supabase client config
├── types/
│   └── database.types.ts       # TypeScript types for DB
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_performance_optimizations.sql
├── docs/
│   └── PERFORMANCE.md          # Performance tuning guide
└── package.json
```

### Data Flow

```
┌─────────────┐
│   Viewers   │ ◄──── Real-time updates via Supabase Realtime
└─────────────┘
      │
      │ Read-only access (RLS enforced)
      ▼
┌─────────────────────────────────────────────────────┐
│                  Supabase Database                   │
│  ┌─────────┐  ┌──────────────┐  ┌─────────────┐   │
│  │  Teams  │  │ Score History│  │   Admins    │   │
│  │  Table  │  │    Table     │  │    Table    │   │
│  └─────────┘  └──────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────┘
      ▲
      │ Write access (authenticated)
      │
┌─────────────┐
│   Admins    │ ──── Update scores via Server Actions
└─────────────┘
```

---

## 🎮 Usage

### For Viewers

1. Visit the leaderboard URL
2. View real-time team rankings
3. See live status indicators (connected/updating)
4. Rankings update automatically without refresh

### For Admins

1. Navigate to `/admin/login`
2. Enter admin password
3. View all teams in admin dashboard
4. Update scores with optional reason
5. Change team status (active/inactive/disqualified)
6. Create new teams
7. Delete teams
8. Changes broadcast instantly to all viewers

---

## ⚙️ Configuration

### Performance Tuning

See [docs/PERFORMANCE.md](docs/PERFORMANCE.md) for detailed performance optimization guide.

Key configurations:
- **Connection pooling**: Handles 1000+ concurrent connections
- **Edge caching**: 5-second cache with stale-while-revalidate
- **Database indexes**: Optimized for fast leaderboard queries
- **Realtime rate limiting**: 10 events/second per client

### Customization

#### Change Theme Colors

Edit `tailwind.config.ts`:

```typescript
colors: {
  'neon-yellow': '#FFFF00',     // Primary accent
  'dark-bg': '#0a0a0a',          // Background
  'dark-panel': '#111111',       // Panel background
  'dark-border': '#1a1a1a',      // Border color
}
```

#### Modify Sample Teams

Edit `supabase/migrations/001_initial_schema.sql` before running migrations.

#### Adjust Cache Duration

Edit `app/api/teams/route.ts`:

```typescript
export const revalidate = 5 // Change from 5 seconds
```

---

## 🔒 Security

- **Admin authentication**: Simple password-based with httpOnly cookies
- **Row-Level Security**: Public can only read, admins can write
- **Service Role Key**: Used server-side only, never exposed to client
- **Input validation**: Zod schemas validate all user input
- **Audit trail**: All score changes logged in `score_history` table

### Production Security Checklist

- [ ] Change `ADMIN_PASSWORD` to a strong password
- [ ] Never commit `.env.local` to version control
- [ ] Rotate `SUPABASE_SERVICE_ROLE_KEY` periodically
- [ ] Enable 2FA on Supabase account
- [ ] Monitor database logs for suspicious activity
- [ ] Use Vercel's security features (DDoS protection, etc.)

---

## 🐛 Troubleshooting

### Realtime not working
- Verify Realtime is enabled in Supabase for `teams` table
- Check browser console for WebSocket errors
- Ensure `NEXT_PUBLIC_SUPABASE_URL` is correct

### Admin login fails
- Verify `ADMIN_PASSWORD` matches in `.env.local`
- Clear browser cookies and try again
- Check server logs for errors

### Scores not updating
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check Supabase logs for RLS policy violations
- Ensure admin is authenticated

### Build errors
- Run `npm install` to ensure dependencies are installed
- Clear `.next` folder: `rm -rf .next`
- Check Node.js version (requires 18+)

---

## 📊 Load Testing

Test your deployment with Artillery:

```bash
npm install -g artillery

# Test viewer load
artillery quick --count 1000 --num 10 https://your-domain.vercel.app

# Test admin operations
artillery quick --count 10 --num 100 https://your-domain.vercel.app/admin
```

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License - feel free to use for your robotics competitions!

---

## 🙏 Credits

Built with ❤️ for **ERS Club** and the **RoboRush 2026** competition by Shirshendu R Tripathi

**Tech Stack:**
- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend & Realtime
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Vercel](https://vercel.com/) - Hosting

---

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check [docs/PERFORMANCE.md](docs/PERFORMANCE.md) for performance tips
- Review Supabase docs for database questions

---

<div align="center">

**⚡ Built for speed. Designed for competition. Ready for 1000+ viewers. ⚡**

Made with 🤖 for robotics enthusiasts

</div>