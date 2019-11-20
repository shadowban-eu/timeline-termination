const express = require('express');
const testRoutes = require('./test.route');
const watchRoutes = require('./watch.route');

const statusController = require('../../controllers/status.controller');

const router = express.Router();

/**
 * GET v1/status
 */
router.get('/status', statusController);

router.use('/test', testRoutes);
router.use('/watch', watchRoutes);

module.exports = router;
