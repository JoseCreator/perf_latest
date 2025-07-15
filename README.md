# PerformPass - Time Tracking Application

A full-stack time tracking application built with React/TypeScript frontend and Express.js backend.

## 🌐 Live Application

- **Frontend**: https://pfe-duarte.onrender.com
- **Backend API**: https://pbe-duarte.onrender.com

## 🔑 Login Credentials

Contact your administrator for login credentials.

## 🚀 Features

- User authentication with JWT
- Time tracking and timesheet management
- Client and project management
- Absence registration
- Dashboard with analytics
- Multi-user support with role-based access

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js, SQLite
- **Authentication**: JWT tokens with bcrypt password hashing
- **Deployment**: Render.com

## 📦 Project Structure

```
├── src/                    # Frontend React application
│   ├── assets/            # React components and pages
│   ├── utils/             # API configuration and utilities
│   └── ...
├── backend/               # Express.js backend
│   ├── routes/           # API routes
│   ├── timetracker.db    # SQLite database
│   └── ...
├── render.yaml           # Render deployment configuration
└── README.md
```

## 🏃‍♂️ Local Development

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd perform_pass-main

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Start development servers
npm run dev          # Frontend (http://localhost:5173)
cd backend && npm start   # Backend (http://localhost:4000)
```

### Environment Variables

Create `.env` file in root:
```env
VITE_API_URL=http://localhost:4000
```

Create `.env` file in backend:
```env
NODE_ENV=development
PORT=4000
JWT_SECRET=your-local-jwt-secret
```

## 🚀 Production Deployment

The application is deployed on Render.com using the included `render.yaml` configuration.

### Deployment Process
1. Push changes to GitHub repository
2. Render automatically deploys both frontend and backend services
3. Database is automatically initialized with existing data

### Production Configuration
- **Database**: SQLite with persistent storage
- **Authentication**: Secure JWT tokens
- **CORS**: Configured for production frontend domain
- **SSL**: Automatic HTTPS via Render

## 📊 Database

The application uses SQLite with the following main tables:
- `utilizadores` - User accounts and authentication
- `timesheet` - Time tracking records
- `clients` - Client management
- `projects` - Project management
- `absences` - Employee absence records

**Data Status**: All production data preserved (53 users, 2,503+ timesheet records)

## 🔧 API Endpoints

- `POST /api/users/login` - User authentication
- `GET /api/users` - Get user list
- `GET /api/timesheet` - Get timesheet records
- `POST /api/timesheet` - Create timesheet entry
- `GET /api/clients` - Get clients
- `GET /api/absences` - Get absences
- `GET /health` - Health check endpoint

## 📝 Documentation

- `DEPLOYMENT.md` - Detailed deployment guide
- `LOGIN_CREDENTIALS.md` - Available login credentials
- `QUICK_REFERENCE.md` - Quick access reference

## 🐛 Troubleshooting

### Common Issues
1. **Login Issues**: Verify credentials and check network connectivity
2. **API Connection**: Ensure backend is running and URLs are correct
3. **Build Errors**: Check Node.js version and dependencies

### Support
- Check browser console for frontend errors
- Check server logs for backend issues
- Verify environment variables are set correctly

## 📄 License

This project is proprietary software developed for internal use.

---

**Status**: ✅ Production Ready  
**Last Updated**: June 2025
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
