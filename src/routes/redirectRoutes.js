import express from 'express';
import RedirectController from '../controllers/redirectController.js';

const router = express.Router();

// Primary Redirect Endpoints
router.get('/r/:slug', RedirectController.handleRedirect);
router.get('/go/:slug', RedirectController.handleRedirect);

// Combined Source + Slug Redirect Endpoints (e.g. /r/tiktok/kawah-ijen or /go/ig/kawah-ijen)
router.get('/r/:source/:slug', RedirectController.handleRedirect);
router.get('/go/:source/:slug', RedirectController.handleRedirect);

export default router;
