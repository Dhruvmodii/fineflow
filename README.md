# 💰 FinFlow — Smart Personal Finance Tracker

A full-stack personal finance app with budget planning, expense tracking, splitwise-style group expenses, and monthly email reports. Built for Netlify + Neon PostgreSQL.

---

## ✨ Features

- **🔐 Secure Auth** — JWT + bcrypt, token stored in localStorage
- **💰 Budget Planner** — Enter salary/stipend, get AI-style allocations (50/30/20 rule adapted)
- **📊 Dashboard** — Charts, progress bars, monthly overview
- **🧾 Expenses** — Add, edit, delete with category filtering & search
- **📅 Yearly View** — Annual spending chart + track big yearly expenses
- **👥 Split Expenses** — Splitwise-style groups, debt simplification algorithm, settle up
- **📧 Email Reports** — Monthly CSV report sent to your email

---

## 🚀 Deploy to Netlify (Step-by-Step)

### 1. Set Up Neon Database

1. Go to [console.neon.tech](https://console.neon.tech) → Create a project
2. Open the **SQL Editor** and paste the contents of `schema.sql` → Run it
3. Copy your **Connection String** (looks like `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "Initial FinFlow commit"
git remote add origin https://github.com/YOUR_USERNAME/finflow.git
git push -u origin main
```

### 3. Deploy on Netlify

1. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
2. Select your GitHub repo
3. Build settings are auto-detected from `netlify.toml`
4. Go to **Site settings → Environment variables** and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `JWT_SECRET` | A random 32+ character string |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | Your Gmail App Password |

5. Click **Deploy site** ✅

### 4. Gmail App Password (for email reports)

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification (enable if not already)
3. Security → App passwords → Create one named "FinFlow"
4. Use the 16-character password as `SMTP_PASS`

---

## 💻 Local Development

```bash
# Install dependencies
npm install
cd netlify/functions && npm install && cd ../..

# Install Netlify CLI
npm install -g netlify-cli

# Create env file
cp .env.example .env.local
# Edit .env.local with your values

# Run locally (React + Functions together)
netlify dev
```

App will be at `http://localhost:8888`

---

## 📁 Project Structure

```
finflow/
├── src/                        # React frontend
│   ├── pages/
│   │   ├── AuthPage.jsx        # Login + Signup
│   │   ├── Dashboard.jsx       # Main overview
│   │   ├── BudgetPage.jsx      # Budget planner
│   │   ├── ExpensesPage.jsx    # Expense tracking
│   │   ├── YearlyPage.jsx      # Annual view
│   │   └── SplitsPage.jsx      # Splitwise features
│   ├── components/
│   │   └── Sidebar.jsx
│   ├── hooks/
│   │   └── useAuth.js          # Auth context
│   ├── utils/
│   │   └── api.js              # Axios instance
│   └── styles/
│       └── global.css
├── netlify/functions/          # Serverless API
│   ├── _db.js                  # DB + response helpers
│   ├── _auth.js                # JWT helpers
│   ├── auth-signup.js          # POST /auth-signup
│   ├── auth-login.js           # POST /auth-login
│   ├── budget.js               # GET/POST/PUT /budget
│   ├── budget-suggest.js       # GET /budget-suggest
│   ├── expenses.js             # CRUD /expenses
│   ├── groups.js               # CRUD /groups (splitwise)
│   └── send-report.js          # POST /send-report
├── schema.sql                  # Neon DB schema
├── netlify.toml                # Netlify config
└── .env.example                # Environment variables template
```

---

## 🔒 Security

- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens expire in 7 days
- All API endpoints verify JWT
- SQL injection protected via parameterized queries (Neon serverless)
- HTTPS enforced by Netlify

---

## 📧 Auto Monthly Reports

The "Email Report" button on the dashboard sends a formatted HTML email + CSV attachment with all your expenses for the selected month. Set up a reminder on the last day of each month, or integrate with Netlify Scheduled Functions to automate it.
