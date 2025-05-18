const express = require('express');
const next = require('next');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');

// Get environment from ENV var, default to production
const dev = process.env.NODE_ENV !== 'production';
console.log('Running in development mode:', dev);

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  
  // Parse JSON request bodies
  server.use(bodyParser.json());
  
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
  
  // POST endpoint for taking screenshots
  server.post('/screenshot', async (req, res) => {
    let browser = null;
    let page = null;
    
    try {
      const { 
        url = `http://localhost:${PORT || 3000}`,
        full_page = true,
        width = 1280,
        height = 800,
        wait_for = 'networkidle2', // Changed from networkidle0 to networkidle2 (more forgiving)
        timeout = 30000, // Reduced timeout
        wait_time = 2000, // Additional wait time after page load
        format = 'png', // png or jpeg
        quality = 90 // Only for jpeg
      } = req.body;
      
      console.log(`Taking screenshot of: ${url}`);
      
      // Launch Puppeteer with improved settings
      browser = await puppeteer.launch({
        headless: 'new', // Use new headless mode
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-software-rasterizer',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-extensions',
          '--no-first-run',
          '--disable-ipc-flooding-protection'
        ],
        timeout: 30000
      });
      
      page = await browser.newPage();
      
      // Set longer timeout for page operations
      page.setDefaultTimeout(timeout);
      page.setDefaultNavigationTimeout(timeout);
      
      // Set viewport size
      await page.setViewport({
        width: parseInt(width),
        height: parseInt(height),
        deviceScaleFactor: 1
      });
      
      // Set user agent
      await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Navigate to the URL with retry logic
      let retries = 3;
      while (retries > 0) {
        try {
          await page.goto(url, { 
            waitUntil: wait_for,
            timeout: timeout
          });
          break; // Success, exit retry loop
        } catch (navError) {
          retries--;
          console.log(`Navigation failed, retries left: ${retries}. Error: ${navError.message}`);
          if (retries === 0) throw navError;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
      
      // Wait for any dynamic content to load using Promise.race
      try {
        await Promise.race([
          // Wait for additional time if specified
          new Promise(resolve => setTimeout(resolve, wait_time)),
          // Or wait for network to be idle (if supported)
          page.waitForLoadState ? page.waitForLoadState('networkidle') : Promise.resolve()
        ]);
      } catch (waitError) {
        console.log('Wait completed with timeout or method not available');
      }
      
      // Check if page is still alive before taking screenshot
      if (page.isClosed()) {
        throw new Error('Page was closed before screenshot could be taken');
      }
      
      // Determine image format and type
      const imageType = format === 'jpeg' || format === 'jpg' ? 'jpeg' : 'png';
      const contentType = imageType === 'jpeg' ? 'image/jpeg' : 'image/png';
      
      // Take screenshot as buffer (don't save to file)
      const screenshotBuffer = await page.screenshot({ 
        fullPage: full_page,
        type: imageType,
        quality: imageType === 'jpeg' ? parseInt(quality) : undefined,
        timeout: 30000
      });
      
      // Close page first, then browser
      await page.close();
      page = null;
      await browser.close();
      browser = null;
      
      console.log(`Screenshot taken successfully (${screenshotBuffer.length} bytes)`);
      
      // Set response headers for image
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', screenshotBuffer.length);
      res.setHeader('Content-Disposition', `inline; filename="screenshot.${imageType}"`);
      
      // Send the image buffer directly
      res.status(200).send(screenshotBuffer);
      
    } catch (error) {
      console.error('Error taking screenshot:', error);
      
      // Clean up page and browser if they're still running
      if (page && !page.isClosed()) {
        try {
          await page.close();
        } catch (closeError) {
          console.error('Error closing page:', closeError);
        }
      }
      
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
      }
      
      res.status(500).json({
        error: 'Failed to take screenshot',
        details: error.message,
        code: error?.code,
        stack: error.stack
      });
    }
  });
  
  // GET endpoint to serve screenshots
  server.get('/screenshots/:filename', (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(process.cwd(), 'screenshots', filename);
      
      // Security check
      if (!filename.match(/^[a-zA-Z0-9._-]+$/) || filename.includes('..')) {
        return res.status(403).json({ error: 'Invalid filename' });
      }
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Screenshot not found' });
      }
      
      // Set appropriate content type
      const ext = path.extname(filename).toLowerCase();
      const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
      
      res.setHeader('Content-Type', contentType);
      res.sendFile(filePath);
      
    } catch (error) {
      console.error('Error serving screenshot:', error);
      res.status(500).json({ error: 'Failed to serve screenshot' });
    }
  });
  
  // GET endpoint to list available screenshots
  server.get('/screenshots', (req, res) => {
    try {
      const screenshotDir = path.join(process.cwd(), 'screenshots');
      
      if (!fs.existsSync(screenshotDir)) {
        return res.status(200).json({ screenshots: [] });
      }
      
      const files = fs.readdirSync(screenshotDir)
        .filter(file => file.match(/\.(png|jpg|jpeg)$/i))
        .map(file => {
          const filePath = path.join(screenshotDir, file);
          const stats = fs.statSync(filePath);
          
          return {
            filename: file,
            size_kb: Math.round(stats.size / 1024),
            created: stats.birthtime,
            modified: stats.mtime,
            url: `/screenshots/${file}`
          };
        })
        .sort((a, b) => new Date(b.created) - new Date(a.created));
      
      res.status(200).json({ screenshots: files });
      
    } catch (error) {
      console.error('Error listing screenshots:', error);
      res.status(500).json({ error: 'Failed to list screenshots' });
    }
  });
  
  // Make the build status available
  server.get('/build-status', (req, res) => {
    res.status(200).json({
      dev_mode: dev,
      rebuild_enabled: process.env.ENABLE_REBUILD === 'true',
      restart_enabled: process.env.RESTART_AFTER_REBUILD === 'true',
      screenshot_enabled: true
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
    console.log(`> Screenshot endpoints available: POST /screenshot, GET /screenshots`);
  });
});