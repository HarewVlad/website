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
      
      // Log debugging information
      console.log('Current working directory:', process.cwd());
      console.log('File path requested:', file_path);
      console.log('Normalized path:', normalizedPath);
      
      // Make path absolute from project root
      const absolutePath = path.join(process.cwd(), normalizedPath);
      console.log('Full absolute path:', absolutePath);
      
      // Check if target file exists already
      const fileExists = fs.existsSync(absolutePath);
      console.log('File exists before update?', fileExists);
      
      // Check if directory exists
      const directory = path.dirname(absolutePath);
      const dirExists = fs.existsSync(directory);
      console.log('Directory exists?', dirExists);
      
      // Try to get directory permissions
      try {
        const dirStats = fs.statSync(directory);
        console.log('Directory permissions:', dirStats.mode.toString(8));
      } catch (err) {
        console.log('Could not get directory stats:', err.message);
      }
      
      // Create directory if it doesn't exist
      if (!dirExists) {
        console.log('Attempting to create directory:', directory);
        fs.mkdirSync(directory, { recursive: true });
        console.log('Directory created successfully');
      }
      
      // Write content to file with explicit error handling
      console.log('Attempting to write to file...');
      try {
        fs.writeFileSync(absolutePath, content, 'utf8');
        console.log('File written successfully');
        
        // Verify the file was actually written
        const fileExistsAfter = fs.existsSync(absolutePath);
        console.log('File exists after update?', fileExistsAfter);
        
        if (fileExistsAfter) {
          const fileContent = fs.readFileSync(absolutePath, 'utf8');
          console.log('File content length:', fileContent.length);
          console.log('First 100 chars of content:', fileContent.substring(0, 100));
        }
      } catch (writeError) {
        console.error('Error during file write operation:', writeError);
        return res.status(500).json({
          error: 'Failed to write file',
          details: writeError.message,
          code: writeError.code
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        message: `File updated successfully: ${file_path}`,
        path: absolutePath
      });
      
    } catch (error) {
      console.error('Error updating file:', error);
      return res.status(500).json({ 
        error: 'Failed to update file',
        details: error.message,
        code: error.code,
        stack: error.stack
      });
    }
  });