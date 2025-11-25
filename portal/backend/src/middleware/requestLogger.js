/**
 * Request logging middleware
 * Logs basic information about incoming requests
 */
import logger from '../config/logger.js';

export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip
    };

    // Add LogRocket session URL if available
    const logRocketSession = req.get('X-LogRocket-Session');
    if (logRocketSession) {
      logData.logRocketSession = logRocketSession;
    }

    // Add user information if authenticated
    if (req.user) {
      logData.user = {
        id: req.user.id,
        login: req.user.login,
        name: req.user.name
      };
    }

    logger.info('HTTP Request', logData);
  });

  next();
}
