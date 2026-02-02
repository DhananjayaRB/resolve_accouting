#!/bin/bash
# Azure App Service Startup Script for Resolve Accounting

# Navigate to the application directory
cd /home/site/wwwroot/resolve_accouting || cd /home/site/wwwroot

# Start the Node.js application
npm start

