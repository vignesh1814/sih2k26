import fs from 'fs';
import path from 'path';

const API_BASE = 'http://127.0.0.1:8001/api/v1';

async function runTests() {
  console.log('=== Starting MERN LMPC Compliance Engine API Tests ===\n');

  // 1. Health Check
  try {
    const healthRes = await fetch(`${API_BASE}/health`);
    const health = await healthRes.json();
    console.log('1. Health Check:', health.status, `(${health.service})`);
  } catch (e) {
    console.error('1. Health Check Failed:', e.message);
  }

  // 2. Auth Login
  let token = null;
  try {
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'inspector@lm.gov.in', password: 'password123' })
    });
    const loginData = await loginRes.json();
    token = loginData.token;
    console.log('2. Officer Login:', loginData.success ? 'SUCCESS' : 'FAILED', `(${loginData.user?.name} - ${loginData.user?.role})`);
  } catch (e) {
    console.error('2. Officer Login Failed:', e.message);
  }

  // 3. Scan Package (Single label upload)
  let scanId = null;
  try {
    const sampleImgPath = path.join(process.cwd(), '..', 'synthetic_dataset', 'images', 'SYN_000.png');
    if (fs.existsSync(sampleImgPath)) {
      const formData = new FormData();
      const fileBlob = new Blob([fs.readFileSync(sampleImgPath)], { type: 'image/png' });
      formData.append('file', fileBlob, 'SYN_000.png');

      const scanRes = await fetch(`${API_BASE}/scan`, {
        method: 'POST',
        body: formData
      });
      const scanData = await scanRes.json();
      scanId = scanData.scan_id;
      console.log('3. Package Label Scan:', scanData.status, `(Confidence: ${scanData.overall_confidence}, Violations: ${scanData.violations?.length || 0})`);
      console.log('   - Extracted MRP (Rs.):', scanData.declarations?.mrp ? `Rs. ${scanData.declarations.mrp}` : 'None');
      console.log('   - Net Qty:', scanData.declarations?.net_quantity, scanData.declarations?.unit);
    } else {
      console.log('3. Package Label Scan: Skipped (no local sample image at path)');
    }
  } catch (e) {
    console.error('3. Package Label Scan Failed:', e.message);
  }

  // 4. Report Generation
  if (scanId) {
    try {
      const reportRes = await fetch(`${API_BASE}/report/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scan_id: scanId,
          officer_name: 'Inspector Sharma',
          station_jurisdiction: 'Maharashtra Enforcement Wing',
          notes: 'Routine market surveillance audit'
        })
      });
      const reportData = await reportRes.json();
      console.log('4. Statutory PDF Report Generation:', reportData.status, `(${reportData.pdf_url})`);
    } catch (e) {
      console.error('4. Report Generation Failed:', e.message);
    }
  }

  // 5. Scans List
  try {
    const listRes = await fetch(`${API_BASE}/scans?limit=5`);
    const listData = await listRes.json();
    console.log('5. Persistent Scans List:', `${listData.count} scans returned`);
  } catch (e) {
    console.error('5. Scans List Failed:', e.message);
  }

  // 6. Audit Trail List
  try {
    const auditRes = await fetch(`${API_BASE}/audit-trail?limit=5`);
    const auditData = await auditRes.json();
    console.log('6. Statutory Audit Trail Logs:', `${auditData.count} audit events logged`);
  } catch (e) {
    console.error('6. Audit Trail Failed:', e.message);
  }

  // 7. Auth Logout
  try {
    const logoutRes = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: { name: 'Field Inspector', role: 'INSPECTOR' } })
    });
    const logoutData = await logoutRes.json();
    console.log('7. Officer Session Logout:', logoutData.success ? 'SUCCESS' : 'FAILED');
  } catch (e) {
    console.error('7. Officer Logout Failed:', e.message);
  }

  console.log('\n=== All Tests Finished ===');
}

runTests();
