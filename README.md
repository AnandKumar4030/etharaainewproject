# TaskFlow — Team Task Manager

A full-stack, production-ready collaborative project management application built with React 18, Vite, Tailwind CSS, Express.js, Prisma ORM, and PostgreSQL.

---

## ✨ Features

- **JWT Authentication** — Signup, login, token-based sessions (7-day expiry)
- **Role-Based Access Control** — `superadmin` (global), project `admin`, project `member`
- **Dashboard** — Personalized stats (tasks by status, overdue, projects), recent activity
- **Project Management** — Create, view, edit, delete projects; add/remove members
- **Task Management** — Full CRUD (admins), status-only updates (members), priority, due dates
- **My Tasks** — All tasks assigned to the logged-in user with inline status updates
- **Admin Panel** — User list, role management, system-wide stats (superadmin only)
- **Responsive Dark UI** — Glassmorphism-inspired with smooth animations

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 + React Router v6 |
| Styling | Tailwind CSS v3 |
| HTTP Client | Axios |
| Backend | Node.js + Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | express-validator |
| Deployment | Railway (backend + DB) + Vercel (frontend) |

---

## 📁 Project Structure

```
etharaainewproject/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.js          # Demo data seeder
│   ├── src/
│   │   ├── lib/
│   │   │   └── prisma.js    # Prisma client singleton
│   │   ├── middleware/
│   │   │   ├── auth.js      # JWT verification
│   │   │   └── projectRole.js # RBAC middleware
│   │   ├── routes/
│   │   │   ├── auth.js      # /api/auth
│   │   │   ├── projects.js  # /api/projects
│   │   │   ├── tasks.js     # /api/tasks
│   │   │   ├── dashboard.js # /api/dashboard
│   │   │   └── admin.js     # /api/admin
│   │   └── server.js        # Express entry point
│   ├── .env.example
│   ├── package.json
│   └── railway.json         # Railway deploy config
└── frontend/
    ├── src/
    │   ├── contexts/
    │   │   └── AuthContext.jsx
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── PrivateRoute.jsx
    │   ├── lib/
    │   │   └── api.js        # Axios client + API modules
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── SignupPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── ProjectsPage.jsx
    │   │   ├── ProjectDetailPage.jsx
    │   │   ├── MyTasksPage.jsx
    │   │   └── AdminPage.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── .env
    └── tailwind.config.js
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js v18+
- PostgreSQL database

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd etharaainewproject
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL DATABASE_URL and JWT_SECRET
npm install
npx prisma generate
npx prisma db push        # Creates tables
npm run seed              # (Optional) seeds demo data
npm run dev               # Starts on port 5000
```

### 3. Frontend Setup
```bash
cd frontend
# .env is pre-configured for localhost:5000
npm install
npm run dev               # Starts on port 5173
```

Open **http://localhost:5173**

### Demo Credentials (after seeding)
| Role | Email | Password |
|------|-------|----------|
| Superadmin | admin@example.com | admin123 |
| Member | alice@example.com | password123 |
| Member | bob@example.com | password123 |

---

## 🚂 Deploying to Railway (Backend)

1. Push the `backend/` folder to a GitHub repo
2. Create a new Railway project → **Deploy from GitHub**
3. Add a **PostgreSQL** plugin to the project
4. Set environment variables:
   - `DATABASE_URL` — auto-filled by Railway PostgreSQL plugin
   - `JWT_SECRET` — a long random secret
   - `FRONTEND_URL` — your Vercel frontend URL
   - `NODE_ENV=production`
5. Railway runs `npx prisma migrate deploy && node src/server.js` automatically

---

## ▲ Deploying to Vercel (Frontend)

1. Push the `frontend/` folder to GitHub
2. Import into Vercel
3. Set environment variable:
   - `VITE_API_URL` — your Railway backend URL + `/api`
4. Build command: `npm run build`
5. Output directory: `dist`

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update name |

### Projects
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/projects` | Any user |
| POST | `/api/projects` | Any user |
| GET | `/api/projects/:id` | Project member |
| PUT | `/api/projects/:id` | Project admin |
| DELETE | `/api/projects/:id` | Project admin |
| GET/POST | `/api/projects/:id/members` | Project admin |
| DELETE | `/api/projects/:id/members/:userId` | Project admin |

### Tasks
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/tasks/my` | Any user |
| POST | `/api/tasks/project/:projectId` | Project admin |
| PUT | `/api/tasks/:id` | Admin=full, Member=status only |
| DELETE | `/api/tasks/:id` | Project admin |

### Dashboard
| GET | `/api/dashboard` | Any user (scoped by role) |

### Admin (superadmin only)
| GET | `/api/admin/users` | User list |
| PUT | `/api/admin/users/:id/role` | Change role |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET | `/api/admin/stats` | System stats |

---

## 🔒 RBAC Summary

| Action | Superadmin | Project Admin | Member |
|--------|------------|---------------|--------|
| View all projects | ✅ | — | — |
| Create project | ✅ | ✅ | ✅ |
| Manage any project | ✅ | ✅ | ❌ |
| Create/delete tasks | ✅ | ✅ | ❌ |
| Update task status | ✅ | ✅ | ✅ (own) |
| Manage members | ✅ | ✅ | ❌ |
| Admin panel | ✅ | ❌ | ❌ |
