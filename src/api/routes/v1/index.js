const express = require('express');
const testRoutes = require('./test.route');
const watchRoutes = require('./watch.route');

const router = express.Router();

/**
 * GET v1/status
 */
router.get('/status', (req, res) => res.send('OK'));

router.use('/test', testRoutes);
router.use('/watch', watchRoutes);

module.exports = router;
