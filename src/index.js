import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/apiRoutes.js';
import redirectRoutes from './routes/redirectRoutes.js';
import setupDailyCron from './cron/dailyReset.js';
import RedirectController from './controllers/redirectController.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for accurate client IP detection (Behind Cloudflare/Nginx)
app.set('trust proxy', true);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'TripBanyuwangi WA Rotator', timestamp: new Date() });
});

// REST API Endpoints
app.use('/api', apiRoutes);

// Explicit Redirect routes (/r/:slug and /go/:slug)
app.use('/', redirectRoutes);

// Serve Frontend Static Files if built
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Direct root slug redirect (e.g. localhost:3001/kawah-ijen)
app.get('/:slug', (req, res, next) => {
  const slug = req.params.slug;
  // Ignore known static extensions or reserved paths
  if (
    slug === 'api' ||
    slug === 'health' ||
    slug === 'admin' ||
    slug.includes('.')
  ) {
    return next();
  }
  return RedirectController.handleRedirect(req, res);
});

// SPA Fallback for Frontend Dashboard
app.get('*', (req, res) => {
  const indexPath = path.join(frontendDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <title>TripBanyuwangi WA Rotator API</title>
          <style>
            body { font-family: sans-serif; background: #0B0F19; color: #fff; text-align: center; padding: 50px; }
            h1 { color: #FF5E14; }
            a { color: #FF7A30; text-decoration: none; }
          </style>
        </head>
        <body>
          <h1>🌴 TripBanyuwangi WhatsApp Rotator Server</h1>
          <p>Backend API berjalan di port ${PORT}.</p>
          <p>Buka Frontend Dashboard di <a href="http://localhost:5173" target="_blank">http://localhost:5173</a> (Mode Dev) atau jalankan <code>npm run build:frontend</code>.</p>
        </body>
        </html>
      `);
    }
  });
});

// Initialize Cron Jobs
setupDailyCron();

app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 TripBanyuwangi WA Rotator Engine Running!`);
  console.log(`📡 Backend Port : http://localhost:${PORT}`);
  console.log(`🔗 Redirect URLs : http://localhost:${PORT}/r/:slug`);
  console.log(`📊 API Endpoints : http://localhost:${PORT}/api/campaigns`);
  console.log('====================================================');
});
