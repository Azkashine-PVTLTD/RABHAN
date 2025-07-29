const fs = require('fs');

// Check test file
const testFile = 'E:\\RABHAN\\test-upload.png';

try {
  const stats = fs.statSync(testFile);
  console.log('Test file stats:');
  console.log('- Size:', stats.size, 'bytes');
  console.log('- Exists:', fs.existsSync(testFile));
  
  const buffer = fs.readFileSync(testFile);
  console.log('- Buffer size:', buffer.length);
  console.log('- Extension:', testFile.split('.').pop()?.toLowerCase());
  
  // Check validation criteria
  const actualSize = buffer.length;
  const maxSize = 50 * 1024 * 1024; // 50MB max
  const minSize = 100; // 100 bytes minimum
  
  const hasContent = actualSize > minSize;
  const notTooLarge = actualSize <= maxSize;
  const hasValidExtension = ['pdf', 'jpg', 'jpeg', 'png'].includes(
    testFile.split('.').pop()?.toLowerCase() || ''
  );
  
  console.log('\nValidation checks:');
  console.log('- hasContent (> 100 bytes):', hasContent);
  console.log('- notTooLarge (< 50MB):', notTooLarge);
  console.log('- hasValidExtension:', hasValidExtension);
  console.log('- allChecksPassed:', hasContent && notTooLarge && hasValidExtension);
  
} catch (error) {
  console.error('Error:', error.message);
}