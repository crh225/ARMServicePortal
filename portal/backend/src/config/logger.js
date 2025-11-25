/**
 * Winston Logger Configuration
 * Ships logs to Elasticsearch and console
 */
import winston from 'winston';
import Transport from 'winston-transport';
import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables first
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL;
const ELASTICSEARCH_API_KEY = process.env.ELASTICSEARCH_API_KEY;
const APP_NAME = process.env.APP_NAME || 'arm-service-portal';

// Custom Elasticsearch Transport
class ElasticsearchTransport extends Transport {
  constructor(opts) {
    super(opts);
    this.client = opts.client;
    this.index = opts.index;
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // Prepare log entry - spread info first so explicit fields override
    const logEntry = {
      ...info,
      '@timestamp': new Date().toISOString(),
      level: info.level || 'info',
      message: info.message
    };

    // Remove Winston internal fields that shouldn't go to ES
    delete logEntry[Symbol.for('level')];
    delete logEntry[Symbol.for('splat')];
    delete logEntry[Symbol.for('message')];

    // Send immediately to Elasticsearch
    if (!this.client) {
      console.error('✗ Elasticsearch client not initialized!');
      callback();
      return;
    }

    this.client.bulk({
      body: [
        { index: { _index: this.index } },
        logEntry
      ],
      refresh: false
    })
    .then((response) => {
      if (response.errors) {
        console.error('Elasticsearch bulk errors:', JSON.stringify(response.items[0]));
      }
    })
    .catch((error) => {
      console.error('Elasticsearch error:', error.message);
    });

    callback();
  }
}

// Create Elasticsearch client if URL is configured
let elasticsearchTransport;
if (ELASTICSEARCH_URL) {
  try {
    const clientConfig = {
      node: ELASTICSEARCH_URL,
    };

    // Add authentication if API key is provided
    if (ELASTICSEARCH_API_KEY) {
      clientConfig.auth = {
        apiKey: ELASTICSEARCH_API_KEY
      };
    }

    const esClient = new Client(clientConfig);

    // Test connection to Elasticsearch
    esClient.ping()
      .then(() => {
        console.log('✓ Successfully connected to Elasticsearch');
      })
      .catch((error) => {
        console.error('✗ Failed to connect to Elasticsearch:', error.message);
        console.error('  URL:', ELASTICSEARCH_URL);
        console.error('  Has API Key:', !!ELASTICSEARCH_API_KEY);
      });

    elasticsearchTransport = new ElasticsearchTransport({
      level: 'info',
      client: esClient,
      index: `${APP_NAME}-logs`
    });
  } catch (error) {
    console.warn('✗ Failed to initialize Elasticsearch transport:', error.message);
  }
}

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `[${timestamp}] ${level}: ${message} ${metaStr}`;
  })
);

// Create transports array
const transports = [
  new winston.transports.Console({
    format: consoleFormat,
    level: NODE_ENV === 'production' ? 'info' : 'debug'
  })
];

// Add Elasticsearch transport if available
if (elasticsearchTransport) {
  transports.push(elasticsearchTransport);
}

// Create logger instance
const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: APP_NAME,
    environment: NODE_ENV
  },
  transports
});

// Create a stream object for Morgan or other logging middleware
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Intercept console methods to also send to Winston/Elasticsearch
// Save original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

// Override console.log to also log to Winston
console.log = (...args) => {
  originalConsole.log(...args);
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  logger.info(message);
};

// Override console.info
console.info = (...args) => {
  originalConsole.info(...args);
  logger.info(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
};

// Override console.warn
console.warn = (...args) => {
  originalConsole.warn(...args);
  logger.warn(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
};

// Override console.error
console.error = (...args) => {
  originalConsole.error(...args);
  logger.error(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
};

// Override console.debug
console.debug = (...args) => {
  originalConsole.debug(...args);
  logger.debug(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
};

// Test that console interception is working
originalConsole.log('→ Console interception is active');

export default logger;
