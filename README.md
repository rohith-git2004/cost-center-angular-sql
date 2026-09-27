# Cost Center - Angular + SQL

A functional Cost Center page recreated from the supplied screenshots.

## Stack
- Angular standalone frontend
- Node.js + Express REST API
- MySQL SQL database

## Features extracted from screenshots
- Dark top navigation bar
- Global search box
- Company selector/label
- Cost Center page title
- Add and List actions
- Cost Center SysID, Code and Name fields
- Activation & Deactivation section
- Y/N checkbox
- Activation & Deactivation Code lookup button (...)
- Activation & Deactivation Name
- Applicable Company Details editable grid
- Add Row and delete-row actions
- Save and Cancel
- List view with edit/delete actions
- Lookup dialogs for activation/deactivation and companies
- SQL persistence through REST API
- Validation and duplicate-code protection

## Run

### 1. Database
Create a MySQL database and run:

`database/schema.sql`

Default database name: `cost_center_db`

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The API runs on `http://localhost:5000`.

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Open `http://localhost:4200`.

The frontend expects the API at `http://localhost:5000/api`.
