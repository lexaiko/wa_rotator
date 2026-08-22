import express from 'express';
import CampaignController from '../controllers/campaignController.js';
import CSController from '../controllers/csController.js';
import AnalyticsController from '../controllers/analyticsController.js';
import SimulationController from '../controllers/simulationController.js';
import AuthController from '../controllers/authController.js';
import BackupController from '../controllers/backupController.js';
import GreetingController from '../controllers/greetingController.js';
import SourceCategoryController from '../controllers/sourceCategoryController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// ==========================================
// 1. Authentication Routes
// ==========================================
router.post('/auth/login', AuthController.login);
router.post('/auth/logout', AuthController.logout);
router.get('/auth/me', authMiddleware, AuthController.getMe);
router.put('/auth/profile', authMiddleware, AuthController.updateProfile);
router.get('/auth/users', authMiddleware, AuthController.getAllUsers);

// ==========================================
// 2. Campaign Routes (Protected)
// ==========================================
router.get('/campaigns', authMiddleware, CampaignController.getAll);
router.get('/campaigns/:id', authMiddleware, CampaignController.getById);
router.post('/campaigns', authMiddleware, CampaignController.create);
router.put('/campaigns/:id', authMiddleware, CampaignController.update);
router.patch('/campaigns/:id/toggle', authMiddleware, CampaignController.toggle);
router.delete('/campaigns/:id', authMiddleware, CampaignController.delete);

// ==========================================
// 3. CS Admin Routes (Protected)
// ==========================================
router.get('/cs', authMiddleware, CSController.getAll);
router.get('/cs/:id', authMiddleware, CSController.getById);
router.post('/cs', authMiddleware, CSController.create);
router.put('/cs/:id', authMiddleware, CSController.update);
router.patch('/cs/:id/toggle', authMiddleware, CSController.toggle);
router.post('/cs/:id/reset-counter', authMiddleware, CSController.resetCounter);
router.delete('/cs/:id', authMiddleware, CSController.delete);

// ==========================================
// 4. Source Categories CRUD (Sosmed / Sumber Klik, Protected)
// ==========================================
router.get('/source-categories', authMiddleware, SourceCategoryController.getAll);
router.get('/source-categories/:id', authMiddleware, SourceCategoryController.getById);
router.post('/source-categories', authMiddleware, SourceCategoryController.create);
router.put('/source-categories/:id', authMiddleware, SourceCategoryController.update);
router.patch('/source-categories/:id/toggle', authMiddleware, SourceCategoryController.toggle);
router.delete('/source-categories/:id', authMiddleware, SourceCategoryController.delete);

// ==========================================
// 5. Greeting Rules Routes (Protected)
// ==========================================
router.get('/greeting-rules', authMiddleware, GreetingController.getAll);
router.post('/greeting-rules', authMiddleware, GreetingController.create);
router.put('/greeting-rules/:id', authMiddleware, GreetingController.update);
router.delete('/greeting-rules/:id', authMiddleware, GreetingController.delete);
router.post('/greeting-rules/sync-crm', authMiddleware, GreetingController.syncCrm);

// ==========================================
// 5. Analytics Routes (Protected)
// ==========================================
router.get('/analytics/summary', authMiddleware, AnalyticsController.getSummary);
router.get('/analytics/timeseries', authMiddleware, AnalyticsController.getTimeSeries);
router.get('/analytics/channels', authMiddleware, AnalyticsController.getSocialBreakdown);
router.get('/analytics/geo', authMiddleware, AnalyticsController.getGeoBreakdown);
router.get('/analytics/cs-performance', authMiddleware, AnalyticsController.getCSPerformance);
router.get('/analytics/logs', authMiddleware, AnalyticsController.getClickLogs);
router.get('/analytics/export', authMiddleware, AnalyticsController.exportCsv);

// ==========================================
// 6. Simulator Routes (Protected)
// ==========================================
router.post('/simulation/run', authMiddleware, SimulationController.runSimulation);

// ==========================================
// 7. Data Backup & Restore Routes (Protected)
// ==========================================
router.get('/backup/export', authMiddleware, BackupController.exportData);
router.post('/backup/import', authMiddleware, BackupController.importData);
router.get('/backup/stats', authMiddleware, BackupController.getStats);
router.post('/backup/reset', authMiddleware, BackupController.resetData);

export default router;
