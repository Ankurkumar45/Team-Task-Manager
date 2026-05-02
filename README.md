# ⚡ TaskFlow — Project Management App

A full-stack project management application with role-based access control (Admin/Member), built with Node.js + Express backend and React frontend.

## 🌐 Live Demo

> Deploy to Railway using the steps below

## ✨ Features

### Authentication
- JWT-based signup & login
- First user automatically becomes **Admin**
- Secure password hashing with bcrypt

### Role-Based Access Control
| Feature | Admin | Member |
|---|---|---|
| Create/Delete Projects | ✅ | ❌ |
| Add/Remove Members | ✅ | ❌ |
| Create/Edit/Delete Tasks | ✅ | ❌ |
| View Tasks & Projects | ✅ | ✅ |
| Change Task Status | ✅ | ❌ |
| View Dashboard | ✅ | ✅ |

### Project Management
- Create projects with custom colors
- Invite team members by email
- Assign roles (Admin / Member) per project
- Progress tracking (tasks done vs total)
- Overdue task indicators

### Task Management
- Kanban board view (To Do / In Progress / Review / Done)
- List view with full task details
- Task priority: Low, Medium, High, Urgent
- Due date tracking with overdue highlighting
- Assignee management
- Quick status updates from kanban

### Dashboard
- Stats overview (total tasks, assigned, completed, overdue)
- Status breakdown chart
- Recent activity feed
- Overdue tasks alert list

## 🛠 Tech Stack

**Backend:**
- Node.js + Express.js
- NeDB (embedded NoSQL database — no setup required)
- JWT authentication
- bcryptjs for password hashing
- express-validator for input validation

**Frontend:**
- React 18 + React Router v6
- Axios for API calls
- Vite build tool
- Lucide React icons
- date-fns for date formatting

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── server.js           # Express app entry
│   ├── db/index.js         # NeDB database setup
│   ├── middleware/auth.js  # JWT + RBAC middleware
│   ├── routes/
│   │   ├── auth.js         # Login, signup, /me
│   │   ├── projects.js     # CRUD + member management
│   │   ├── tasks.js        # CRUD + dashboard
│   │   └── users.js        # User search
│   └── data/               # Auto-created DB files
├── frontend/
│   ├── src/
│   │   ├── pages/          # Route-level components
│   │   ├── components/     # Shared UI components
│   │   ├── context/        # Auth context
│   │   └── utils/api.js    # Axios instance
│   └── dist/               # Production build
├── railway.toml            # Railway deployment config
└── README.md
```

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
# Clone repo
git clone <your-repo-url>
cd taskflow

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install

# Create .env
cd ../backend && cp .env.example .env
# Edit JWT_SECRET in .env
```

### Run Development

```bash
# Terminal 1 — Backend
cd backend && node server.js

# Terminal 2 — Frontend
cd frontend && npm run dev
```

App runs at http://localhost:5173 (frontend proxies API to :5000)

## 🚂 Deploy to Railway

### Option 1: One-Click Deploy (Recommended)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo
4. Railway auto-detects config from `railway.toml`
5. Add environment variables:
   - `JWT_SECRET` = any long random string
   - `NODE_ENV` = production
   - `DB_PATH` = /app/data

### Option 2: Railway CLI

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Environment Variables (Railway)

| Variable | Value |
|---|---|
| `JWT_SECRET` | Random 64-char string |
| `NODE_ENV` | `production` |
| `DB_PATH` | `/app/data` |
| `PORT` | Auto-set by Railway |

## 📡 API Reference

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Path | Auth | Role |
|---|---|---|---|
| GET | `/api/projects` | ✅ | Any |
| POST | `/api/projects` | ✅ | Any |
| GET | `/api/projects/:id` | ✅ | Member+ |
| PUT | `/api/projects/:id` | ✅ | Project Admin |
| DELETE | `/api/projects/:id` | ✅ | Project Admin |
| POST | `/api/projects/:id/members` | ✅ | Project Admin |
| DELETE | `/api/projects/:id/members/:uid` | ✅ | Project Admin |

### Tasks
| Method | Path | Auth | Role |
|---|---|---|---|
| GET | `/api/tasks/dashboard` | ✅ | Any |
| GET | `/api/tasks/project/:id` | ✅ | Member+ |
| POST | `/api/tasks` | ✅ | Member+ |
| PUT | `/api/tasks/:id` | ✅ | Member+ |
| DELETE | `/api/tasks/:id` | ✅ | Creator/Admin |

## 🔒 Security Features

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens expire in 7 days
- Input validation on all endpoints
- Role checks on every protected route
- No sensitive data in responses

## 📝 Notes

- **First signup gets Admin** — great for demo setup
- NeDB stores data in flat files — works perfectly for Railway's ephemeral filesystem with a volume mount
- For production with persistence: add a Railway volume at `/app/data`
