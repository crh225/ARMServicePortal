{%- if values.app_type == 'static' %}
// Static site entry point
// This file is for development - the built output is served by nginx in production

document.addEventListener('DOMContentLoaded', () => {
  console.log('${{ values.app_name }} loaded');
});
{%- else %}
const http = require('http');

const PORT = process.env.PORT || ${{ values.port }};

const server = http.createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('healthy');
    return;
  }

  // Main response
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    app: '${{ values.app_name }}',
    status: 'running',
    timestamp: new Date().toISOString()
  }));
});

server.listen(PORT, () => {
  console.log(`${{ values.app_name }} listening on port ${PORT}`);
});
{%- endif %}
