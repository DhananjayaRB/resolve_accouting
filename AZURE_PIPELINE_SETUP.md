# Azure Pipeline Setup Guide

This guide will help you set up Azure DevOps Pipeline for deploying the Resolve Accounting application to Azure App Service.

## Prerequisites

1. **Azure Account** with an active subscription
2. **Azure DevOps** organization and project
3. **Azure App Service** created (Linux or Windows)
4. **Service Connection** configured in Azure DevOps

## Files Included

- `azure-pipelines.yml` - Standard pipeline configuration
- `azure-pipelines-full.yml` - Full-featured pipeline with additional stages
- `.github/workflows/azure-pipelines-simple.yml` - Simple minimal pipeline

## Step 1: Create Azure App Service

1. Go to Azure Portal
2. Create a new App Service:
   - **Name**: `resolve-accounting-app` (or your preferred name)
   - **Runtime stack**: Node.js 20 LTS
   - **Operating System**: Linux
   - **App Service Plan**: Choose appropriate plan
   - **Resource Group**: `resolve-accounting-rg` (or your preferred name)

## Step 2: Configure Azure DevOps Service Connection

1. In Azure DevOps, go to **Project Settings** → **Service connections**
2. Click **New service connection** → **Azure Resource Manager**
3. Select **Service principal (automatic)**
4. Select your subscription and resource group
5. Name it: `Azure-Service-Connection`
6. Click **Save**

## Step 3: Set Up Environment Variables in Azure App Service

Go to Azure Portal → Your App Service → **Configuration** → **Application settings** and add:

```
NODE_ENV=production
PORT=8080
DB_HOST=your-database-host
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_PORT=5432
JWT_SECRET=your-jwt-secret-key
```

**Important**: Use **Application settings** for non-sensitive values and **Connection strings** or **Key Vault** for sensitive data like passwords.

## Step 4: Configure Pipeline Variables

1. In Azure DevOps, go to **Pipelines** → **Pipelines**
2. Click **New pipeline** → Select your repository
3. Choose **Existing Azure Pipelines YAML file**
4. Select `azure-pipelines.yml` or `azure-pipelines-full.yml`
5. Go to **Variables** tab and add:
   - `appName`: Your Azure App Service name
   - `resourceGroup`: Your Azure Resource Group name

Or edit the YAML file directly and update:
```yaml
variables:
  appName: 'your-app-service-name'
  resourceGroup: 'your-resource-group-name'
```

## Step 5: Update Service Connection Name

In the pipeline YAML file, update the service connection name:

```yaml
azureSubscription: 'Azure-Service-Connection'  # Change to your service connection name
```

## Step 6: Create Environment (for Full Pipeline)

If using `azure-pipelines-full.yml`:

1. Go to **Pipelines** → **Environments**
2. Click **Create environment**
3. Name it: `production`
4. Add approval gates if needed

## Step 7: Configure Startup Command

The pipeline uses `npm start` which runs:
```json
"start": "node resolve_accouting/server/index.js"
```

Make sure your App Service is configured to:
- **Startup Command**: `npm start`
- **Working Directory**: `/home/site/wwwroot` (or root)

## Step 8: Database Configuration

### Option 1: Using Application Settings (Not Recommended for Production)

Add database credentials in Azure App Service → Configuration → Application settings

### Option 2: Using Azure Key Vault (Recommended)

1. Create Azure Key Vault
2. Store secrets in Key Vault
3. Reference in App Service Configuration:
   ```
   @Microsoft.KeyVault(SecretUri=https://your-keyvault.vault.azure.net/secrets/DB_PASSWORD/)
   ```

## Step 9: Run the Pipeline

1. Commit the pipeline YAML file to your repository
2. Push to `main` or `master` branch
3. The pipeline will trigger automatically
4. Monitor the pipeline in Azure DevOps

## Pipeline Stages

### Build Stage
- Installs Node.js
- Installs dependencies (root and application)
- Builds frontend with Vite
- Publishes artifacts

### Deploy Stage
- Deploys to Azure App Service
- Sets environment variables
- Restarts app service

## Troubleshooting

### Build Fails
- Check Node.js version compatibility
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

### Deployment Fails
- Verify service connection has correct permissions
- Check App Service name and resource group
- Verify startup command is correct
- Check App Service logs in Azure Portal

### Application Not Starting
- Check App Service logs: **Log stream** in Azure Portal
- Verify PORT environment variable (should be 8080 for Azure)
- Check database connection settings
- Verify all required environment variables are set

### Database Connection Issues
- Verify database firewall allows Azure App Service IPs
- Check database credentials
- Verify database server is accessible from Azure

## Customization

### Change Node.js Version
```yaml
variables:
  nodeVersion: '18.x'  # or '20.x', '22.x'
```

### Add Additional Build Steps
```yaml
- script: |
    npm run test
  displayName: 'Run Tests'
```

### Deploy to Staging First
Add a staging stage before production:
```yaml
- stage: DeployStaging
  displayName: 'Deploy to Staging'
  # ... staging configuration
```

## Security Best Practices

1. **Never commit secrets** to repository
2. Use **Azure Key Vault** for sensitive data
3. Use **Service Principal** for service connections
4. Enable **HTTPS only** in App Service
5. Use **Managed Identity** when possible
6. Regularly rotate secrets and keys

## Monitoring

After deployment, monitor:
- **Application Insights** (if configured)
- **App Service logs**
- **Metrics** in Azure Portal
- **Health endpoint**: `https://your-app.azurewebsites.net/health`

## Support

For issues:
1. Check Azure App Service logs
2. Review pipeline logs in Azure DevOps
3. Verify all configuration steps were completed
4. Check Azure service health status

