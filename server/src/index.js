import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { connectDB, isDbConnected, inMemoryStore } from './db.js';
import { Scan } from './models/Scan.js';
import { Measurement } from './models/Measurement.js';
import { InspectionSession } from './models/InspectionSession.js';

import authRoutes from './routes/auth.routes.js';
import scanRoutes from './routes/scan.routes.js';
import reportRoutes from './routes/report.routes.js';
import auditRoutes from './routes/audit.routes.js';
import healthRoutes from './routes/health.routes.js';
import challanRoutes from './routes/challan.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import entityRoutes from './routes/entity.routes.js';
import ruleRoutes from './routes/rule.routes.js';
import inspectionRoutes from './routes/inspection.routes.js';
import enforcementRoutes from './routes/enforcement.routes.js';

import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static directories (resolved relative to server root)
const serverDir = path.resolve(__dirname, '..');
const repoDir = path.resolve(serverDir, '..');
const uploadsDir = path.join(serverDir, 'uploads');
const reportsDir = path.join(serverDir, 'reports');
const datasetDir = fs.existsSync(path.join(repoDir, 'synthetic_dataset'))
  ? path.join(repoDir, 'synthetic_dataset')
  : path.join(serverDir, 'synthetic_dataset');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

app.use('/uploads', express.static(uploadsDir));
app.use('/reports', express.static(reportsDir));
if (fs.existsSync(datasetDir)) {
  app.use('/dataset', express.static(datasetDir));
}

// Dedicated Health endpoints (always JSON)
app.use('/api/v1', healthRoutes);
app.use('/api', healthRoutes);
app.use('/health', healthRoutes);

// Mount API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/entities', entityRoutes);
app.use('/api/v1/rules', ruleRoutes);
app.use('/api/v1/inspections', inspectionRoutes);
app.use('/api/v1/enforcement', enforcementRoutes);
app.use('/api/v1', scanRoutes);
app.use('/api/v1', reportRoutes);
app.use('/api/v1', auditRoutes);
app.use('/api/v1', challanRoutes);
app.use('/api/v1', analyticsRoutes);

// Aliases under /api
app.use('/api/auth', authRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/enforcement', enforcementRoutes);
app.use('/api', scanRoutes);
app.use('/api', reportRoutes);
app.use('/api', auditRoutes);
app.use('/api', challanRoutes);
app.use('/api', analyticsRoutes);

// Offline inspection synchronization endpoint (UC-SYS-04)
app.post(['/api/v1/sync', '/api/sync'], async (req, res) => {
  try {
    const { items = [] } = req.body;
    let syncedCount = 0;

    for (const item of items) {
      if ((item.type === 'SCAN' || item.type === 'scan') && item.payload) {
        if (isDbConnected()) {
          try { await Scan.create(item.payload); } catch (e) {}
        } else {
          inMemoryStore.scans.unshift(item.payload);
        }
        syncedCount++;
      } else if ((item.type === 'MEASUREMENT' || item.type === 'measurement') && item.payload) {
        if (isDbConnected()) {
          try { await Measurement.create(item.payload); } catch (e) {}
        } else {
          inMemoryStore.measurements.unshift(item.payload);
        }
        syncedCount++;
      } else if ((item.type === 'SESSION' || item.type === 'session') && item.payload) {
        if (isDbConnected()) {
          try { await InspectionSession.create(item.payload); } catch (e) {}
        } else {
          inMemoryStore.sessions.unshift(item.payload);
        }
        syncedCount++;
      }
    }

    return res.json({
      success: true,
      message: `Successfully synchronized ${syncedCount} offline records.`,
      synced_count: syncedCount
    });
  } catch (err) {
    console.error('[Sync error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Friendly GET handlers for endpoints that usually expect POST
app.get('/api/v1/scan', (req, res) => {
  res.json({
    endpoint: '/api/v1/scan',
    method: 'POST',
    description: 'Upload a single packaged commodity label for OCR and LMPC compliance audit.',
    accepts: 'multipart/form-data with "file" field',
    example_curl: 'curl -X POST -F "file=@label.png" http://localhost:8001/api/v1/scan'
  });
});

app.get('/api/v1/scan-multi', (req, res) => {
  res.json({
    endpoint: '/api/v1/scan-multi',
    method: 'POST',
    description: 'Upload multi-panel package label images (front, back, side_mrp, etc.) for synthesized audit.',
    accepts: 'multipart/form-data with "files" and "panel_names" fields'
  });
});

app.get('/api/v1/report/generate', (req, res) => {
  res.json({
    endpoint: '/api/v1/report/generate',
    method: 'POST',
    description: 'Generate an official LMPC statutory compliance inspection PDF certificate with SHA-256 evidence digest.',
    body_schema: {
      scan_id: 'string (required)',
      officer_name: 'string (optional)',
      station_jurisdiction: 'string (optional)',
      notes: 'string (optional)'
    }
  });
});

// Interactive API Portal & Dashboard for Root (/) and /docs
const renderApiPortal = (req, res) => {
  const acceptHeader = req.headers['accept'] || '';
  if (acceptHeader.includes('application/json')) {
    return res.json({
      service: 'SIH26034 - Legal Metrology (LMPC) MERN Compliance Engine API',
      version: '2.0.0',
      status: 'ONLINE',
      database: isDbConnected() ? 'CONNECTED (MongoDB)' : 'IN_MEMORY_FALLBACK',
      endpoints: {
        health: '/api/v1/health',
        scan: 'POST /api/v1/scan',
        scan_multi: 'POST /api/v1/scan-multi',
        scans_list: 'GET /api/v1/scans',
        challans_list: 'GET /api/v1/challans',
        challan_issue: 'POST /api/v1/challans/issue',
        superior_analytics: 'GET /api/v1/analytics/superior',
        manufacturer_dashboard: 'GET /api/v1/manufacturer/dashboard',
        reports_generate: 'POST /api/v1/report/generate',
        audit_trail: 'GET /api/v1/audit-trail',
        auth_login: 'POST /api/v1/auth/login',
        auth_logout: 'POST /api/v1/auth/logout'
      }
    });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SIH26034 - Legal Metrology Compliance API</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-900 text-gray-100 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="bg-gray-800 border border-gray-700 rounded-2xl p-6 sm:p-8 shadow-2xl mb-8">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div class="flex items-center space-x-3 mb-2">
            <span class="inline-block p-2 bg-blue-600 rounded-lg text-white font-bold">LMPC</span>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-white">Legal Metrology Compliance Engine</h1>
          </div>
          <p class="text-gray-400 text-sm">Automated Statutory Audit API for Packaged Commodities in India (MERN Stack)</p>
        </div>
        <div class="flex items-center space-x-2">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-900 text-green-300 border border-green-700">
            <span class="w-2 h-2 mr-1.5 bg-green-400 rounded-full animate-pulse"></span> Server ONLINE
          </span>
          <a href="http://localhost:3000" target="_blank" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-md">
            Open Frontend UI ↗
          </a>
        </div>
      </div>
    </div>

    <!-- Endpoints Grid -->
    <div class="bg-gray-800 border border-gray-700 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
      <h2 class="text-lg font-bold text-gray-200 border-b border-gray-700 pb-3">Available REST API Endpoints</h2>
      
      <div class="space-y-4 text-sm">
        <!-- Health -->
        <div class="p-4 bg-gray-900/80 rounded-xl border border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center space-x-3">
            <span class="px-2.5 py-1 text-xs font-mono font-bold bg-green-950 text-green-400 border border-green-800 rounded">GET</span>
            <code class="text-blue-400 font-mono">/api/v1/health</code>
          </div>
          <span class="text-gray-400 text-xs">System health & database status</span>
          <a href="/api/v1/health" class="text-blue-400 hover:underline text-xs font-semibold">Test Endpoint →</a>
        </div>

        <!-- Superior Analytics -->
        <div class="p-4 bg-gray-900/80 rounded-xl border border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center space-x-3">
            <span class="px-2.5 py-1 text-xs font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800 rounded">GET</span>
            <code class="text-blue-400 font-mono">/api/v1/analytics/superior</code>
          </div>
          <span class="text-gray-400 text-xs">Inspector leaderboard & Manufacturer risk matrix</span>
          <a href="/api/v1/analytics/superior" class="text-blue-400 hover:underline text-xs font-semibold">Test Endpoint →</a>
        </div>

        <!-- Challans List -->
        <div class="p-4 bg-gray-900/80 rounded-xl border border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center space-x-3">
            <span class="px-2.5 py-1 text-xs font-mono font-bold bg-green-950 text-green-400 border border-green-800 rounded">GET</span>
            <code class="text-blue-400 font-mono">/api/v1/challans</code>
          </div>
          <span class="text-gray-400 text-xs">List statutory compounding challans & legal notices</span>
          <a href="/api/v1/challans" class="text-blue-400 hover:underline text-xs font-semibold">Test Endpoint →</a>
        </div>

        <!-- Issue Challan -->
        <div class="p-4 bg-gray-900/80 rounded-xl border border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center space-x-3">
            <span class="px-2.5 py-1 text-xs font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800 rounded">POST</span>
            <code class="text-blue-400 font-mono">/api/v1/challans/issue</code>
          </div>
          <span class="text-gray-400 text-xs">Superior issues legal challan to non-compliant brand</span>
          <span class="text-gray-500 text-xs">Authority Only</span>
        </div>

        <!-- Scan -->
        <div class="p-4 bg-gray-900/80 rounded-xl border border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center space-x-3">
            <span class="px-2.5 py-1 text-xs font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800 rounded">POST</span>
            <code class="text-blue-400 font-mono">/api/v1/scan</code>
          </div>
          <span class="text-gray-400 text-xs">Run OCR & LMPC compliance audit on label image</span>
          <a href="/api/v1/scan" class="text-blue-400 hover:underline text-xs font-semibold">View Spec →</a>
        </div>

        <!-- Scans List -->
        <div class="p-4 bg-gray-900/80 rounded-xl border border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center space-x-3">
            <span class="px-2.5 py-1 text-xs font-mono font-bold bg-green-950 text-green-400 border border-green-800 rounded">GET</span>
            <code class="text-blue-400 font-mono">/api/v1/scans</code>
          </div>
          <span class="text-gray-400 text-xs">List persistent scan audits from MongoDB</span>
          <a href="/api/v1/scans" class="text-blue-400 hover:underline text-xs font-semibold">Test Endpoint →</a>
        </div>

        <!-- Report Generate -->
        <div class="p-4 bg-gray-900/80 rounded-xl border border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center space-x-3">
            <span class="px-2.5 py-1 text-xs font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800 rounded">POST</span>
            <code class="text-blue-400 font-mono">/api/v1/report/generate</code>
          </div>
          <span class="text-gray-400 text-xs">Generate official statutory inspection PDF</span>
          <a href="/api/v1/report/generate" class="text-blue-400 hover:underline text-xs font-semibold">View Spec →</a>
        </div>

        <!-- Audit Trail -->
        <div class="p-4 bg-gray-900/80 rounded-xl border border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center space-x-3">
            <span class="px-2.5 py-1 text-xs font-mono font-bold bg-green-950 text-green-400 border border-green-800 rounded">GET</span>
            <code class="text-blue-400 font-mono">/api/v1/audit-trail</code>
          </div>
          <span class="text-gray-400 text-xs">Retrieve legal audit trail logs</span>
          <a href="/api/v1/audit-trail" class="text-blue-400 hover:underline text-xs font-semibold">Test Endpoint →</a>
        </div>

        <!-- Auth Login -->
        <div class="p-4 bg-gray-900/80 rounded-xl border border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center space-x-3">
            <span class="px-2.5 py-1 text-xs font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800 rounded">POST</span>
            <code class="text-blue-400 font-mono">/api/v1/auth/login</code>
          </div>
          <span class="text-gray-400 text-xs">Inspector / Superior / Manufacturer Authentication</span>
          <span class="text-gray-500 text-xs">3 Portals Supported</span>
        </div>
      </div>
    </div>

    <div class="mt-8 text-center text-xs text-gray-500">
      Legal Metrology Compliance Engine • Ministry of Consumer Affairs, Government of India • 2026
    </div>
  </div>
</body>
</html>`;
  return res.send(html);
};

app.get('/', renderApiPortal);
app.get('/docs', renderApiPortal);
app.get('/api', renderApiPortal);
app.get('/api/v1', renderApiPortal);

// Catch-all 404 handler
app.use((req, res) => {
  const acceptHeader = req.headers['accept'] || '';
  if (acceptHeader.includes('text/html')) {
    return renderApiPortal(req, res);
  }
  return res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    available_endpoints: [
      'GET  /api/v1/health',
      'GET  /api/v1/analytics/superior',
      'GET  /api/v1/challans',
      'POST /api/v1/challans/issue',
      'GET  /api/v1/manufacturer/dashboard',
      'POST /api/v1/scan',
      'POST /api/v1/scan-multi',
      'GET  /api/v1/scans',
      'POST /api/v1/report/generate',
      'GET  /api/v1/audit-trail',
      'POST /api/v1/auth/login',
      'POST /api/v1/auth/logout'
    ]
  });
});

// Start server
const start = async () => {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LMPC Engine] Express MERN Server running on http://0.0.0.0:${PORT}`);
  });
};

start();
