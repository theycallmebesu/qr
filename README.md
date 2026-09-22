# श्री पशुपतिनाथ हार्डवेयर (Shree Pashupatinath Hardware)

A modern, mobile-first web application for **Shree Pashupatinath Hardware**. It provides an instant live rate and price list catalog for customers (Guest view) and a secure Admin Panel with category tag management, item CRUD, and photo upload.

---

## 🎨 Features & Architecture

- **Theme**: Premium Hardware Red & White aesthetic.
- **Guest / Customer Interface (Default)**:
  - Opens directly to the price list without any login required.
  - Search by product name, description, or category.
  - Category / Tag filter chips (*All, Cement, Steel Rod, Pipes, Baluwa, Gitti, Rod, Paint, Sanitary, etc.*).
  - Live rates in NPR (Rs.) with clear unit measurements (*per bag, kg, 10ft piece, Tipper, etc.*).
  - Direct shop hotline call button.
- **Admin Panel (Top-Right Icon)**:
  - Protected with PIN code: **`0000`**
  - **Add Item**:
    - Upload photo directly from phone gallery / camera or paste image URL.
    - Product name, Price (Rs.), Unit selection.
    - Category / Tag dropdown with inline **+ Add New Tag** option.
    - In-stock / Out-of-stock toggle.
  - **Category / Tag Manager**:
    - Create new product categories on the fly.
    - Delete / Remove categories with active usage indicator.
  - **Edit & Delete Items**: Quick inline price updates and full item editing.
- **Database**: MongoDB Atlas connected via Mongoose.

---

## 📁 Repository Structure

```
├── frontend/               # Vite + React + TypeScript + Tailwind CSS (Deploy to Vercel)
│   ├── src/
│   │   ├── components/     # Header, ItemCard, SearchBar, CategoryFilter, Modals
│   │   ├── services/api.ts # API client with Render backend support
│   │   ├── App.tsx         # Main customer price list & admin shell
│   │   └── index.css       # Red & White mobile UI styling
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                # Express + Node.js + MongoDB + TypeScript (Deploy to Render)
│   ├── src/
│   │   ├── config/db.ts    # MongoDB connection
│   │   ├── models/         # Item & Tag Mongoose models
│   │   ├── routes/         # Item, Tag, Auth, & Upload endpoints
│   │   ├── scripts/seed.ts # Initial database seeder
│   │   └── index.ts        # Express server entrypoint
│   ├── .env                # Database URI and PIN configuration
│   └── package.json
│
└── package.json            # Root workspace scripts
```

---

## 🚀 Deployment Guide

### 1. Backend on Render (Web Service)
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New + Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add the following **Environment Variables**:
   - `MONGODB_URI`: `mongodb+srv://bishu1maharjan_db_user:bishu@cluster0.gkmyrme.mongodb.net/hardwareshop_db?retryWrites=true&w=majority&appName=Cluster0`
   - `ADMIN_PASSWORD`: `0000`
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
5. Click **Deploy Web Service**. Copy your backend URL (e.g. `https://shree-hardware-api.onrender.com`).

---

### 2. Frontend on Vercel
1. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New Project**.
2. Select your GitHub repository.
3. In **Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and set to `frontend` (as shown in your screenshot).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add **Environment Variable**:
   - `VITE_API_URL`: Your Render backend URL (e.g. `https://shree-hardware-api.onrender.com`)
5. Click **Deploy**.

---

## 💻 Local Development

1. **Start Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.
