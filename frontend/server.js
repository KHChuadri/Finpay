import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug: Check if dist folder exists
const distPath = path.join(__dirname, 'dist');
console.log('Checking dist path:', distPath);
console.log('Dist folder exists:', fs.existsSync(distPath));

if (fs.existsSync(distPath)) {
  console.log('Files in dist:', fs.readdirSync(distPath));
}

// Debug: Check if index.html exists
const indexPath = path.join(__dirname, 'dist', 'index.html');
console.log('Index.html exists:', fs.existsSync(indexPath));

// Serve static files from dist directory
app.use(express.static(distPath));

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Handle React Router - use middleware catch-all
app.use((req, res) => {
  console.log('Serving index.html for:', req.path);
  res.sendFile(indexPath);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});