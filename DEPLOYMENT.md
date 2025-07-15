# Deployment Guide - React/TypeScript Frontend + Express.js Backend to Render

This guide provides step-by-step instructions for deploying your full-stack application to Render.com.

## Prerequisites

- Git repository hosted on GitHub, GitLab, or Bitbucket
- Render.com account (free tier available)
- Domain name (optional, for custom domain)

## Application Architecture

- **Frontend**: React with TypeScript, built with Vite
- **Backend**: Express.js with Node.js
- **Database**: SQLite (file-based)
- **Authentication**: JWT tokens

## Pre-Deployment Checklist

### ✅ Completed Tasks
- [x] Added environment variable support for API URLs
- [x] Created centralized API configuration (`src/utils/apiConfig.ts`)
- [x] Updated all hardcoded localhost URLs to use `createApiUrl()`
- [x] Configured CORS for production environment
- [x] Added production build scripts
- [x] Created `render.yaml` for automated deployment
- [x] Fixed all TypeScript compilation errors
- [x] Added environment variables for JWT_SECRET and PORT

## Step 1: Prepare Your Repository

### 1.1 Commit All Changes
```bash
git add .
git commit -m "feat: prepare for production deployment"
git push origin main
```

### 1.2 Verify Build
```bash
# Test frontend build
npm run build

# Test backend startup
cd backend && npm start
```

## Step 2: Create Render Services

### 2.1 Backend Service (Web Service)

1. **Login to Render.com** and click "New +"
2. **Select "Web Service"**
3. **Connect your repository**
4. **Configure the service:**
   - **Name**: `perform-pass-backend`
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or `Starter` for better performance)

5. **Environment Variables** (Add these in the Environment tab):
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production   FRONTEND_URL=https://pfe-duarte.onrender.com
   ```
   
   > ✅ **Completed**: URLs have been configured and deployment is successful!

6. **Deploy** - Click "Create Web Service"

### 2.2 Frontend Service (Static Site)

1. **Click "New +" → "Static Site"**
2. **Connect the same repository**
3. **Configure the service:**
   - **Name**: `perform-pass-frontend`
   - **Branch**: `main`
   - **Root Directory**: `/` (leave empty or use root)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-app-name.onrender.com
   ```
   
   > ⚠️ **Important**: Replace `your-backend-app-name` with your actual backend service name.

5. **Deploy** - Click "Create Static Site"

## Step 3: Update Environment Variables

After both services are created, you'll have their URLs. Update the environment variables:

### 3.1 Update Backend Environment Variables
```
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=https://perform-pass-frontend.onrender.com
```

### 3.2 Update Frontend Environment Variables
```
VITE_API_URL=https://perform-pass-backend.onrender.com
```

> ⚠️ **Critical**: Ensure URL format is correct - Render uses hyphens (-) not underscores (_) in service URLs.

## Step 4: Alternative - Automated Deployment with render.yaml

If you prefer automated deployment, use the included `render.yaml` file:

1. **Place `render.yaml` in your repository root** (already done)
2. **Create a new "Blueprint"** in Render:
   - Click "New +" → "Blueprint"
   - Connect your repository
   - Render will automatically detect the `render.yaml` file
   - Review the services and click "Apply"

3. **Update environment variables** as described in Step 3

## Step 5: Database Setup

The application uses SQLite, which will automatically create the database file on first run. However, you may need to:

1. **Ensure database directory exists** in your backend
2. **Run database migrations** if you have any
3. **Seed initial data** if required

## Step 6: Custom Domain (Optional)

### 6.1 Frontend Custom Domain
1. Go to your frontend service settings
2. Click "Custom Domains"
3. Add your domain (e.g., `app.yourdomain.com`)
4. Update DNS records as instructed by Render

### 6.2 Backend Custom Domain
1. Go to your backend service settings
2. Click "Custom Domains"
3. Add your API subdomain (e.g., `api.yourdomain.com`)
4. Update your frontend environment variable to use the custom domain

## Step 7: Monitoring and Maintenance

### 7.1 Monitor Deployments
- Check deployment logs in Render dashboard
- Monitor service health and performance
- Set up error tracking (optional)

### 7.2 Database Backups
Since using SQLite, consider:
- Implementing regular database exports
- Using Render's disk persistence features
- Consider upgrading to PostgreSQL for production

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify `FRONTEND_URL` environment variable in backend
   - Check CORS configuration in `backend/index.js`

2. **API Connection Issues**
   - Verify `VITE_API_URL` environment variable in frontend
   - Check network requests in browser dev tools

3. **Build Failures**
   - Check build logs in Render dashboard
   - Verify all dependencies are in `package.json`
   - Ensure build commands are correct

4. **Database Issues**
   - Check file permissions for SQLite
   - Verify database directory exists
   - Consider upgrading to PostgreSQL for production

### Environment Variables Reference

**Backend (.env.production):**
```env
NODE_ENV=production
PORT=4000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=https://your-frontend-app-name.onrender.com
```

**Frontend (.env.production):**
```env
VITE_API_URL=https://your-backend-app-name.onrender.com
```

## Security Considerations

1. **JWT Secret**: Use a strong, unique secret for production
2. **CORS**: Ensure only your frontend domain is allowed
3. **HTTPS**: Render provides HTTPS by default
4. **Environment Variables**: Never commit secrets to git
5. **Database**: Consider using PostgreSQL for production

## Performance Optimization

1. **Frontend**:
   - Enable gzip compression (Render does this automatically)
   - Optimize bundle size (consider code splitting)
   - Use CDN for static assets if needed

2. **Backend**:
   - Use appropriate instance type for your needs
   - Implement caching strategies
   - Monitor response times

## Support

- **Render Documentation**: https://render.com/docs
- **Application Issues**: Check the application logs in Render dashboard
- **Database Issues**: Consider migrating to PostgreSQL for better production support

---

## Quick Reference Commands

```bash
# Local development
npm run dev                 # Start frontend dev server
cd backend && npm start     # Start backend server

# Production build test
npm run build              # Build frontend for production
cd backend && npm start    # Test backend in production mode

# Deployment via git
git add .
git commit -m "deploy: your message"
git push origin main       # Triggers automatic deployment on Render
```

This deployment guide should get your application running on Render successfully. Remember to update the environment variables with your actual service URLs once the services are created.
