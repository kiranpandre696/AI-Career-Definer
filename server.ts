import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import authRoutes from './server/routes/authRoutes.ts';
import studentRoutes from './server/routes/studentRoutes.ts';
import jobRoutes from './server/routes/jobRoutes.ts';
import examRoutes from './server/routes/examRoutes.ts';
import adminRoutes from './server/routes/adminRoutes.ts';
import resumeRoutes from './server/routes/resumeRoutes.ts';
import roadmapRoutes from './server/routes/roadmapRoutes.ts';
import mockInterviewRoutes from './server/routes/mockInterviewRoutes.ts';
import examPrepRoutes from './server/routes/examPrepRoutes.ts';
import voiceAssistantRoutes from './server/routes/voiceAssistantRoutes.ts';

const appRoot = process.cwd();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser middleware (supports multi-page camera scanned resumes)
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Request logger for API calls
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'CAREER DEFINER',
      tagline: 'Define Your Career. Discover Your Future.',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/student', studentRoutes);
  app.use('/api', jobRoutes);
  app.use('/api', examRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/resume', resumeRoutes);
  app.use('/api/roadmaps', roadmapRoutes);
  app.use('/api/interview', mockInterviewRoutes);
  app.use('/api/exam-prep', examPrepRoutes);
  app.use('/api/voice-assistant', voiceAssistantRoutes);

  // Global 404 for unmatched API routes
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ success: false, message: 'API route not found' });
  });

  // Serve static assets from public directory
  app.use(express.static(path.join(appRoot, 'public')));

  // Vite integration: Dev middleware or Production static files
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Server] Initializing Vite middleware mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('[Server] Serving production static files from dist...');
    const distPath = path.join(appRoot, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind strictly to 0.0.0.0:3000
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`CAREER DEFINER PLATFORM SERVER ACTIVE`);
    console.log(`Running on: http://0.0.0.0:${PORT}`);
    console.log(`Admin account initialized: saikiransaikiran696@gmail.com`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
