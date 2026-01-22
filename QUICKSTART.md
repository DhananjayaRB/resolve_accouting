# Quick Start Guide

Follow these steps to get the application running locally:

## 1. Prerequisites Check
- ✅ Node.js installed (v16+)
- ✅ PostgreSQL installed and running
- ✅ npm installed

## 2. Install Dependencies
```bash
npm install
```

## 3. Create Environment File
```bash
npm run setup:env
```

Then edit `.env` and update `DB_PASSWORD` if your PostgreSQL password is different from "postgres".

## 4. Setup Database
```bash
npm run db:setup
```

This will:
- Create the `resolve_accounting` database
- Run all migrations to create tables

## 5. Start the Application
```bash
npm run dev
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Troubleshooting

**Database connection error?**
- Make sure PostgreSQL is running
- Check your password in `.env` file
- Verify PostgreSQL is listening on port 5432

**Port already in use?**
- Change `PORT` in `.env` for backend
- Or kill the process using the port

**Migration errors?**
- Make sure the database was created successfully
- Check that all migration files exist

## Need More Help?

See `SETUP.md` for detailed setup instructions.

