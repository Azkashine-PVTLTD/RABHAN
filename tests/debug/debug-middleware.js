// This will help us debug what the middleware is receiving
const express = require('express');
const multer = require('multer');
const app = express();

// Configure multer the same way as the document service
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use((req, res, next) => {
  console.log('📝 Incoming request:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    contentType: req.headers['content-type']
  });
  next();
});

app.post('/test-upload', upload.single('file'), (req, res) => {
  console.log('📋 Request body:', req.body);
  console.log('📁 File info:', req.file ? {
    fieldname: req.file.fieldname,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  } : 'No file received');
  
  const { userId, categoryId } = req.body;
  console.log('🔍 Extracted fields:', { userId, categoryId });
  
  res.json({
    success: true,
    received: {
      userId,
      categoryId,
      hasFile: !!req.file,
      fileName: req.file?.originalname
    }
  });
});

const port = 3099;
app.listen(port, () => {
  console.log(`🧪 Debug server running on http://localhost:${port}`);
});

// Keep the server running
process.on('SIGINT', () => {
  console.log('🛑 Shutting down debug server');
  process.exit(0);
});