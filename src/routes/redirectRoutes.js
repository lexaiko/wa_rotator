import express from 'express';
import RedirectController from '../controllers/redirectController.js';

const router = express.Router();

// Primary Redirect Endpoints
router.get('/r/:slug', RedirectController.handleRedirect);
router.get('/go/:slug', RedirectController.handleRedirect);

export default router;
