const express = require('express');
const next = require('next');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const bodyParser = require('body-parser');

// Get environment from ENV var, default to production
const dev = process.env.NODE_ENV !== 'production';
console.log('Running in development mode:', dev);

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // Parse JSON request bodies
  server.use(bodyParser.json());
  server.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Security-Policy', 'frame-ancestors localhost:80');
    res.setHeader('X-Frame-Options', 'allow-from localhost:80');
    next();
  });

  // POST endpoint for file updates
  server.post('/update', async (req, res) => {
    try {
      const { file_path, content } = req.body;

      // Basic validation
      if (!file_path || typeof content !== 'string') {
        return res.status(400).json({ error: 'Invalid request parameters. Requires file_path and content.' });
      }

      // Security check - prevent directory traversal
      const normalizedPath = path.normalize(file_path);
      if (normalizedPath.includes('..')) {
        return res.status(403).json({ error: 'Invalid file path. Directory traversal not allowed.' });
      }

      // Make path absolute from project root
      const absolutePath = path.join(process.cwd(), normalizedPath);
      console.log('Updating file at:', absolutePath);

      // Check if directory exists, create it if it doesn't
      const directory = path.dirname(absolutePath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }

      // Write content to file
      fs.writeFileSync(absolutePath, content, 'utf8');
      console.log('File updated successfully');

      // If we're in production mode, we need to rebuild
      if (!dev && process.env.ENABLE_REBUILD === 'true') {
        console.log('Starting rebuild process...');

        // Send initial response before starting rebuild
        res.status(202).json({
          success: true,
          message: `File updated successfully. Rebuild started.`,
          rebuilding: true
        });

        // Execute rebuild command
        exec('npm run build', (error, stdout, stderr) => {
          if (error) {
            console.error(`Rebuild error: ${error.message}`);
            return;
          }

          if (stderr) {
            console.error(`Rebuild stderr: ${stderr}`);
          }

          console.log(`Rebuild completed: ${stdout}`);

          // Optionally restart the server
          if (process.env.RESTART_AFTER_REBUILD === 'true') {
            console.log('Restarting server...');
            process.exit(0); // Railway will automatically restart the service
          }
        });

        // We've already sent the response, so return to end this function
        return;
      }

      // If we're in dev mode or rebuild is disabled, just send a success response
      return res.status(200).json({
        success: true,
        message: `File updated successfully: ${file_path}`,
        rebuilt: false,
        dev_mode: dev
      });

    } catch (error) {
      console.error('Error updating file:', error);
      return res.status(500).json({
        error: 'Failed to update file',
        details: error.message,
        code: error?.code
      });
    }
  });

  // Make the build status available
  server.get('/build-status', (req, res) => {
    res.status(200).json({
      dev_mode: dev,
      rebuild_enabled: process.env.ENABLE_REBUILD === 'true',
      restart_enabled: process.env.RESTART_AFTER_REBUILD === 'true'
    });
  });

  // Let Next.js handle all other routes
  server.use((req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
    console.log(`> Development mode: ${dev}`);
    console.log(`> Rebuild enabled: ${process.env.ENABLE_REBUILD === 'true'}`);
  });
});