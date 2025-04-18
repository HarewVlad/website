const express = require('express');
const next = require('next');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const dev = process.env.NODE_ENV !== 'production';
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
      
      // Check if directory exists, create it if it doesn't
      const directory = path.dirname(absolutePath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      
      // Write content to file
      fs.writeFileSync(absolutePath, content, 'utf8');
      
      return res.status(200).json({ 
        success: true, 
        message: `File updated successfully: ${file_path}` 
      });
      
    } catch (error) {
      console.error('Error updating file:', error);
      return res.status(500).json({ 
        error: 'Failed to update file',
        details: error.message 
      });
    }
  });
  
  // Let Next.js handle all other routes
  server.use((req, res) => {
    return handle(req, res);
  });
  
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});