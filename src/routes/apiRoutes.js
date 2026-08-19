import express from 'express';
import CampaignController from '../controllers/campaignController.js';
import CSController from '../controllers/csController.js';
import AnalyticsController from '../controllers/analyticsController.js';
import SimulationController from '../controllers/simulationController.js';

const router = express.Router();

// Campaign Routes
router.get('/campaigns', CampaignController.getAll);
router.get('/campaigns/:id', CampaignController.getById);
router.post('/campaigns', CampaignController.create);
router.put('/campaigns/:id', CampaignController.update);
router.patch('/campaigns/:id/toggle', CampaignController.toggle);
router.delete('/campaigns/:id', CampaignController.delete);

// CS Admin Routes
router.get('/cs', CSController.getAll);
router.get('/cs/:id', CSController.getById);
router.post('/cs', CSController.create);
router.put('/cs/:id', CSController.update);
router.patch('/cs/:id/toggle', CSController.toggle);
router.post('/cs/:id/reset-counter', CSController.resetCounter);
router.delete('/cs/:id', CSController.delete);

// Analytics Routes
router.get('/analytics/summary', AnalyticsController.getSummary);
router.get('/analytics/timeseries', AnalyticsController.getTimeSeries);
router.get('/analytics/channels', AnalyticsController.getSocialBreakdown);
router.get('/analytics/geo', AnalyticsController.getGeoBreakdown);
router.get('/analytics/cs-performance', AnalyticsController.getCSPerformance);
router.get('/analytics/logs', AnalyticsController.getClickLogs);
router.get('/analytics/export', AnalyticsController.exportCsv);

// Simulator Routes
router.post('/simulation/run', SimulationController.runSimulation);

export default router;
