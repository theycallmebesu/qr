# 🔴 Hardware Shop Live Price List & Admin Management (Mobile Web App)

A mobile-first, high-performance web app designed for hardware shops to display a live, real-time price list in **Nepali Rupees (NPR)** for customers, paired with a password-protected admin panel with camera-first item creation, instant inline price edits, inventory stock toggles, and priority reordering.

---

## 🚀 Key Features

### 🛒 Customer Side (Public)
- **Instant Load & No Login Required**: Direct access to the live shop inventory.
- **Nepali Rupee (NPR) Currency Formatting**: Formatted with South Asian lakh/thousand grouping (e.g. `Rs. 1,25,000 / BAG`).
- **Priority-Driven Catalog**: Sorted by `priority ASC, name ASC` so the shop decides what customers see first.
- **Sticky Real-Time Search & Category Filters**: Search by item name instantly; horizontal scrollable category pills (PAINT, PIPE, TOOLS, CEMENT, ELECTRICAL, etc.).
- **2-Column Mobile Grid**: Square lazy-loaded images, bold red prices readable from a distance, uppercase names.
- **Out of Stock Badges**: Unavailable items are clearly dimmed with an "OUT OF STOCK" banner while preserving the reference price.
- **Item Details Sheet**: Tapping an item opens a bottom sheet with high-resolution photo, unit, category, and verified date.
- **Tap-to-Call**: Direct dial button in the header and details sheet to phone the shop for instant inquiries.
- **PWA Ready**: Add to Home Screen support with web manifest and mobile viewport safe-area handling.

### 🔐 Admin Panel (Protected)
- **Direct Access**: Fixed top-right lock button on all screens leading to `/admin`.
- **Single Password Authentication**: Secure bcrypt password hash comparison, rate limiting (5 attempts per 15 minutes per IP), and 7-day secure `httpOnly` JWT cookies.
- **Camera-First Item Creation Flow**:
  1. **Camera First**: Floating `+` button opens rear device camera (`capture="environment"`) with gallery fallback.
  2. **Confirm Photo**: Instant preview with "Retake" or "Use this photo".
  3. **Uppercase Name**: Forced real-time capital text entry.
  4. **Price & Specs**: Numeric keypad input for NPR price, pricing unit dropdown (PIECE, KG, FT, BAG, BUNDLE, etc.), and category.
  5. **Client-Side Compression**: Automatically resizes and compresses photos (<400KB) before uploading to Cloudinary.
- **Admin Management Operations**:
  - **Quick Inline Price Edit**: One-tap numeric edit directly in the product row for daily price updates.
  - **In-Stock Toggle Switch**: Instant single-click availability toggle.
  - **Priority Reordering**: Simple Up/Down arrows and "Move to Top" buttons for easy touch reordering.
  - **Edit & Delete**: Full edit modal with photo replacement and delete confirmation with Cloudinary image cleanup.
  - **Shop Configuration**: Update shop title and tap-to-call phone number on the fly.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14+ (App Router) + TypeScript
- **Styling**: Tailwind CSS (Custom Red & White Mobile Theme: `#D32F2F`, `#FFFFFF`, `#1A1A1A`)
- **Database**: MongoDB Atlas (`hardwareshop_db`) with Mongoose
- **Image Storage**: Cloudinary (Free Tier)
- **Auth & Security**: Bcrypt.js, JsonWebToken, Zod validation, IP-based sliding rate limiter
- **Deployment**: Vercel (Auto-deploy from GitHub repository)

---

## 📦 Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/hardwareshop_db?retryWrites=true&w=majority

# JWT Secret for signing session cookies (minimum 32 characters)
JWT_SECRET=your_super_secret_jwt_key_here_min_32_characters

# Bcrypt hash of your admin password
ADMIN_PASSWORD_HASH=$2a$10$Iity33byXju3qIP84I7NYO/zdq1MR704allreJWm2RuZpXBSDA5hm

# Cloudinary credentials for image storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

---

## 🔑 Step-by-Step Setup Guide

### Step 1: Fresh MongoDB Atlas Database Setup (Manual Step)
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. If you had an old database, go to **Browse Collections** → Click **Drop Database** to start fresh.
3. Under **Database Access**, create a new database user (or rotate the password of your existing user).
4. Under **Network Access**, ensure your IP address (or `0.0.0.0/0` for cloud deployment) is allowed.
5. Click **Connect** → **Drivers** (Node.js) and copy your connection string.
6. Set the database name to `hardwareshop_db` at the end of the URI:
   ```
   mongodb+srv://<user>:<password>@cluster0.mongodb.net/hardwareshop_db?retryWrites=true&w=majority
   ```

### Step 2: Generate Admin Password Hash
Run the included password hashing script to generate a bcrypt hash from any plain password:

```bash
npm run hash-password your_desired_password
```
Copy the generated `ADMIN_PASSWORD_HASH=...` line into your `.env.local` file.

### Step 3: Cloudinary Setup
1. Create a free account at [Cloudinary](https://cloudinary.com/).
2. From your Cloudinary Dashboard, copy your:
   - `Cloud Name`
   - `API Key`
   - `API Secret`
3. Paste them into `.env.local`.

### Step 4: Seed Sample Data
Run the seed script to populate 10 sample hardware products (Pipes, Paints, Cement, Hammers, Wire, etc.) and shop settings:

```bash
npm run seed
```

### Step 5: Start Local Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser (or open Chrome DevTools mobile view 390px).

---

## 🌐 Deploy to Vercel

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete hardware shop price list web app"
   git push origin main
   ```
2. Go to [Vercel](https://vercel.com) → **Add New Project** → Import your GitHub repository.
3. In **Environment Variables**, add the 6 variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `ADMIN_PASSWORD_HASH`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. Click **Deploy**. Vercel will automatically build and deploy the Next.js app with serverless API routes.

---

## 🧪 Testing the Application

1. **Customer View (`/`)**:
   - Verify 2-column mobile layout.
   - Search for "Hammer" or "Paint" in the search bar.
   - Click category chips like "PIPE" or "TOOLS".
   - Tap any card to open the bottom sheet modal.
   - Tap "Call Shop".
2. **Admin View (`/admin`)**:
   - Click the "Admin" button in the top-right header.
   - Enter your password (`spnh`).
   - Tap any item's price to edit it inline and save with one tap.
   - Toggle the in-stock switch.
   - Use Up/Down arrows or "Top" to reorder priority.
   - Tap the red floating `+` button to add a new item using the camera flow.
