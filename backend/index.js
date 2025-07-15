import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import usersRoutes from './routes/users.js';
import informationRoutes from './routes/information.js';
import clientsRoutes from './routes/clients.js';
import absencesRoutes from './routes/absences.js';
import projectsRoutes from './routes/projects.js';
import projectUsersRoutes from './routes/projectUsers.js';
import userRolesRoutes from './routes/userRoles.js';
import userHoursRoutes from './routes/userHours.js';
import projectTotalHoursRoutes from './routes/projectTotalHours.js';
import projectTimelineRoutes from './routes/projectTimeline.js';
import projectCostRoutes from './routes/projectCost.js';
import projectBudgetRoutes from './routes/projectBudget.js';
import projectRiskByMonthRoutes from './routes/projectRiskByMonth.js';
import adminClientsRoutes from './routes/adminClients.js';
import adminProjectsRoutes from './routes/adminProjects.js';
import adminUsersRoutes from './routes/adminUsers.js';
import emailRoutes from './routes/email.js';
import githubRoutes from './routes/github.js';
import { initDb } from './routes/db.js';


const app = express();
const PORT = process.env.PORT || 4000;

// Configure CORS for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:5175',
      'http://localhost:3000',
      'https://pfe-duarte.onrender.com',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json()); // to parse JSON body

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'PerformPass API Server',
    status: 'running',
    endpoints: ['/api/users', '/api/information', '/api/clients', '/api/absences']
  });
});

app.use('/api/users', usersRoutes);
app.use('/api/information', informationRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/absences', absencesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/project-users', projectUsersRoutes);
app.use('/api/user-roles', userRolesRoutes);
app.use('/api/user-hours', userHoursRoutes);
app.use('/api/project-total-hours', projectTotalHoursRoutes);
app.use('/api/project-timeline', projectTimelineRoutes);
app.use('/api/project-cost', projectCostRoutes);
app.use('/api/project-budget', projectBudgetRoutes);
app.use('/api/project-risk-by-month', projectRiskByMonthRoutes);
app.use('/api/admin/clients', adminClientsRoutes);
app.use('/api/admin/projects', adminProjectsRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/github', githubRoutes);

async function forceAdminPasswordReset() {
  if (process.env.NODE_ENV === 'production') {
    console.log('🔧 Force resetting admin password in production...');
    
    try {
      const { getDb } = await import('./routes/db.js');
      const bcrypt = await import('bcrypt');
      
      const db = await getDb();
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await db.run('UPDATE utilizadores SET password = ? WHERE email = ?', 
                   [hashedPassword, 'suporte@grupoerre.pt']);
      
      console.log('✅ Admin password force-updated to: admin123');
      await db.close();
    } catch (error) {
      console.error('❌ Failed to force-update admin password:', error);
    }
  }
}

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    await initDb();
    console.log('✅ Database initialized successfully');
    
    // Force admin password reset if in production
    await forceAdminPasswordReset();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);

export default app;
