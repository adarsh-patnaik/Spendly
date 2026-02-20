# 💸 Spendly

**Spendly** is a modern, full-stack personal finance tracking application built for individuals who want a clear picture of their spending habits. Track expenses across multiple currencies, set budgets, analyze trends with rich charts, and get AI-powered category suggestions — all in a clean, responsive UI.

---

## ✨ Features

- 🔐 **Secure Authentication** — JWT-based access/refresh token flow with email verification, password reset, and brute-force lockout protection
- 💰 **Expense Tracking** — Log expenses in any currency with automatic FX conversion to your home currency
- 📂 **Smart Categorization** — Full category management with optional AI-powered auto-categorization (via OpenAI)
- 📊 **Analytics Dashboard** — Visualize spending trends with bar charts, pie charts, and area graphs (Recharts)
- 🎯 **Budget Management** — Set monthly budgets per category and track progress in real time
- 🌍 **Multi-Currency Support** — Live FX rates via Open Exchange Rates, with graceful static fallback
- 📤 **CSV Export** — Export your transaction history with a single click
- ⚙️ **User Settings** — Customize display name, home currency, timezone, and more
- 📱 **Fully Responsive** — Optimized for desktop, tablet, and mobile

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | ~5.9 | Type safety |
| Vite | 7 | Build tool & dev server |
| TailwindCSS | 4 | Styling |
| Recharts | 3 | Data visualization |
| React Query | 5 | Server state management |
| React Hook Form + Zod | Latest | Form validation |
| React Router | 7 | Client-side routing |
| Axios | 1.x | HTTP client |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js + Express | 5 | REST API server |
| MongoDB + Mongoose | 9 | Database & ODM |
| JWT + bcrypt | Latest | Authentication & security |
| Nodemailer | 8 | Transactional emails |
| OpenAI SDK | 4 | AI category suggestions |
| node-cron | 3 | Scheduled tasks (FX refresh) |
| express-rate-limit | 7 | Rate limiting |
| csv-writer | 1.6 | CSV export |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/adarsh-patnaik/Spendly
cd spendly
```

### 2. Set up the Server

```bash
cd server
npm install
cp .env.example .env
# Fill in your .env values (see Environment Variables section below)
npm run dev
```

### 3. Seed Default Categories

```bash
npm run seed
```

### 4. Set up the Client

```bash
cd ../client
npm install
npm run dev
```

The app will be running at `http://localhost:5173` and the API at `http://localhost:5000`.

---

## 🔧 Environment Variables

Create a `.env` file in the `server/` directory based on `.env.example`:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/spendly

# JWT
JWT_ACCESS_SECRET=your_access_secret_here_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_here_min_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Email (Nodemailer / SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@spendly.app

# Frontend URL (for email links)
CLIENT_URL=http://localhost:5173

# OpenAI (optional — falls back gracefully if not set)
OPENAI_API_KEY=sk-...

# Open Exchange Rates (optional — falls back to static rates if not set)
OPEN_EXCHANGE_RATES_APP_ID=your_app_id_here
```

> **Note:** Email and AI/FX integrations are optional. The app will run without them, falling back to manual categorization and static exchange rates.

---

## 📡 API Reference

All API routes are prefixed with `/api`.

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/register` | ❌ | Create a new account |
| `POST` | `/login` | ❌ | Login and receive tokens |
| `POST` | `/refresh` | ❌ | Rotate refresh token |
| `POST` | `/logout` | ❌ | Revoke refresh token |
| `POST` | `/forgot-password` | ❌ | Send password reset email |
| `POST` | `/reset-password` | ❌ | Reset password with token |
| `GET` | `/verify-email/:token` | ❌ | Verify email address |
| `GET` | `/me` | ✅ | Get current user |
| `PATCH` | `/me` | ✅ | Update profile/settings |

### Expenses — `/api/expenses`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | List expenses (filterable by date, category, currency, search) |
| `POST` | `/` | Create a new expense |
| `GET` | `/:id` | Get a single expense |
| `PATCH` | `/:id` | Update an expense |
| `DELETE` | `/:id` | Soft-delete an expense |
| `GET` | `/export/csv` | Export expenses as CSV |

### Categories — `/api/categories`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | List all categories |
| `POST` | `/` | Create a custom category |
| `PATCH` | `/:id` | Update a category |
| `DELETE` | `/:id` | Delete a category |

### Budgets — `/api/budgets`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | List budgets with progress |
| `POST` | `/` | Create or update a budget |
| `DELETE` | `/:id` | Remove a budget |

---

## 📂 Project Structure

```
spendly/
├── client/                  # React + TypeScript frontend
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── contexts/        # React context providers
│       ├── pages/           # Route-level pages
│       │   ├── Dashboard.tsx
│       │   ├── Transactions.tsx
│       │   ├── Analytics.tsx
│       │   ├── Budgets.tsx
│       │   ├── Settings.tsx
│       │   └── ...
│       └── lib/             # API helpers & utilities
│
└── server/                  # Node.js + Express backend
    ├── index.js             # Entry point
    └── src/
        ├── controllers/     # Route handlers
        ├── models/          # Mongoose schemas
        │   ├── User.model.js
        │   ├── Expense.model.js
        │   ├── Category.model.js
        │   ├── Budget.model.js
        │   └── ...
        ├── routes/          # Express routers
        ├── middlewares/     # Auth, error handling
        └── utils/           # Email, FX rates, AI helpers
```

---

## 🔒 Security Highlights

- Password hashing with **bcrypt**
- **Refresh token rotation** — each use issues a new token and revokes the old one
- **Brute-force lockout** — accounts lock for 15 minutes after 5 failed login attempts
- Email enumeration protection on forgot-password endpoint
- `httpOnly` + `Secure` + `SameSite=strict` cookies
- Rate limiting on all API routes

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---



