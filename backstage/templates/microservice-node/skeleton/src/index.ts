import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
{% if values.include_database %}import { Pool } from 'pg';{% endif %}
{% if values.include_redis %}import Redis from 'ioredis';{% endif %}

dotenv.config();

const app = express();
const PORT = process.env.PORT || ${{ values.port }};

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

{% if values.include_database %}
// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
{% endif %}

{% if values.include_redis %}
// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
{% endif %}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: '${{ values.service_name }}',
    timestamp: new Date().toISOString()
  });
});

// Ready check endpoint (for Kubernetes)
app.get('/ready', async (req, res) => {
  try {
    {% if values.include_database %}
    // Check database connection
    await pool.query('SELECT 1');
    {% endif %}
    {% if values.include_redis %}
    // Check Redis connection
    await redis.ping();
    {% endif %}
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: String(error) });
  }
});

// Example API endpoint
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from ${{ values.service_name }}!' });
});

// Start server only if this file is run directly (not imported for testing)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`${{ values.service_name }} listening on port ${PORT}`);
  });
}

export default app;
