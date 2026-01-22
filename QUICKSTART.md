# Quick Start Guide

Follow these steps to get the application running locally:

## 1. Prerequisites Check
- ✅ Node.js installed (v16+)
- ✅ npm installed
- ✅ Network access to production database (20.204.119.48)

**Note:** The application uses the production database by default. No local PostgreSQL installation is required.

## 2. Install Dependencies
```bash
npm install
```

## 3. Create Environment File
```bash
npm run setup:env
```

The `.env` file will be created with production database settings. No changes needed unless you want to use a different database.

## 4. Setup Database (Optional)
```bash
npm run db:migrate
```

This will:
- Run all migrations to create/update tables in the production database
- **Note:** Database already exists, so `db:create` is not needed

## 5. Start the Application
```bash
npm run dev
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Troubleshooting

**Database connection error?**
- Check your network connection to the production database (20.204.119.48)
- Verify the database credentials in `.env` file
- Ensure the database server is accessible from your network

**Port already in use?**
- Change `PORT` in `.env` for backend
- Or kill the process using the port

**Migration errors?**
- Make sure the database was created successfully
- Check that all migration files exist

## Need More Help?

See `SETUP.md` for detailed setup instructions.

