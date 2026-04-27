# 🚀 TaskFlow — Kanban Project Management Board

TaskFlow is a modern Kanban-style task management application inspired by tools like Trello. It allows users to create boards, organize tasks into columns, and manage workflows using drag-and-drop interactions.

---

## ✨ Features

* 🔐 Authentication with Google (NextAuth)
* 📋 Create, rename, and delete boards
* 🧱 Dynamic columns (To Do, In Progress, Done, etc.)
* 📝 Create and manage task cards
* 🔄 Drag & drop cards between columns
* 📊 Persistent ordering (state is saved in database)
* 🏷️ Label support for cards
* 📱 Responsive design (works on different screen sizes)

---

## 🧠 Key Design Decisions

### Drag & Drop Library

The project uses **dnd-kit** for drag-and-drop functionality because:

* It is actively maintained
* Lightweight and flexible
* Works well with modern React (including Next.js)

---

### Data Persistence & Ordering

Each card has a `position` field stored in the database.

* When cards are reordered, their positions are recalculated and saved
* This ensures that order is preserved even after page refresh

---

### Architecture

* **Frontend:** Next.js (App Router)
* **Backend:** Next.js Server Actions
* **Database:** PostgreSQL (via Prisma ORM)
* **Authentication:** NextAuth (Google OAuth)

---

## 🗄️ Database Structure

* **User → Board → Column → Card**
* Cards belong to columns
* Columns belong to boards
* Boards belong to users
* Labels can be attached to cards

---

## ⚙️ Tech Stack

* Next.js 16
* React
* TypeScript
* Prisma ORM
* PostgreSQL (Neon)
* NextAuth
* dnd-kit
* Tailwind CSS

---

## 🚀 Getting Started

### 1. Clone the project

```bash
git clone https://github.com/basakaktas/TaskFlow.git
cd taskflow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create a `.env` file:

```env
DATABASE_URL=your_database_url
NEXTAUTH_SECRET=your_secret
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
```

---

### 4. Run database

```bash
npx prisma migrate dev
npx prisma generate
```

---

### 5. Start development server

```bash
npm run dev
```

---

## 📦 Deployment

The project is deployed on **Vercel**.

---

## 🎯 Project Scope (48 Hours)

Due to time constraints, the focus was on:

* Reliable drag-and-drop functionality
* Persistent ordering
* Clean database structure
* Core Kanban features

Instead of implementing many incomplete features, priority was given to stability and usability.

---

## 🔮 Future Improvements

* 👥 Board collaboration (multi-user)
* 🕒 Activity history tracking
* 📅 Due date reminders
* 🔍 Search and filtering
* ⚡ Real-time updates

