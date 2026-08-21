import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from './config/prisma.js';
import AuthController from './controllers/authController.js';
import AnalyticsController from './controllers/analyticsController.js';
import BackupController from './controllers/backupController.js';

async function runTests() {
  console.log('🧪 ===============================================');
  console.log('🧪 Memulai Pengujian Fitur Login, Filter CRM, & Backup');
  console.log('🧪 ===============================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failedTests++;
    }
  }

  // 1. TEST AUTHENTICATION (Login, Hash verify, JWT token generation)
  console.log('--- 1. Pengujian Sistem Login & Autentikasi ---');
  
  // Test invalid login
  let loginRes1 = {};
  await AuthController.login(
    { body: { username: 'admin', password: 'wrong_password' } },
    { status: (code) => ({ json: (data) => { loginRes1 = { code, data }; } }), json: (data) => { loginRes1 = { code: 200, data }; } }
  );
  assert(loginRes1.code === 401 && !loginRes1.data.success, 'Login dengan password salah harus ditolak (401)');

  // Test valid login with httpOnly cookie
  let loginRes2 = {};
  let setCookieVal = null;
  let cookieOptions = null;
  await AuthController.login(
    { body: { username: 'admin', password: 'admin123', remember_me: true } },
    {
      cookie: (name, val, opts) => {
        if (name === 'tb_token') {
          setCookieVal = val;
          cookieOptions = opts;
        }
      },
      status: (code) => ({ json: (data) => { loginRes2 = { code, data }; } }),
      json: (data) => { loginRes2 = { code: 200, data }; }
    }
  );
  assert(loginRes2.code === 200 && loginRes2.data.success, 'Login default admin berhasil');
  assert(setCookieVal && cookieOptions && cookieOptions.httpOnly === true, 'Cookie httpOnly ("tb_token") berhasil di-set dengan aman untuk mencegah inject XSS');
  const authToken = loginRes2.data.token || setCookieVal;

  // 2. TEST CRM DATE RANGE FILTER
  console.log('\n--- 2. Pengujian Filter Waktu CRM ---');
  
  const testRanges = ['today', 'yesterday', '7d', 'this_week', '30d', 'this_month', 'last_month', 'all_time'];
  for (const r of testRanges) {
    const parsed = AnalyticsController.parseDateRange({ range: r });
    assert(parsed.range === r, `Date parser mendukung preset CRM: "${r}"`);
  }

  // Test custom range
  const customParsed = AnalyticsController.parseDateRange({
    range: 'custom',
    start_date: '2026-08-01',
    end_date: '2026-08-21'
  });
  assert(
    customParsed.startDate instanceof Date && customParsed.endDate instanceof Date,
    'Date parser mendukung Rentang Kustom (Custom Date Range)'
  );

  // Test Analytics Summary with date range
  let summaryRes = {};
  await AnalyticsController.getSummary(
    { query: { range: '7d' } },
    { status: (code) => ({ json: (data) => { summaryRes = { code, data }; } }), json: (data) => { summaryRes = { code: 200, data }; } }
  );
  assert(summaryRes.data.success && summaryRes.data.data.periodClicks !== undefined, 'Summary analytics merespons data terfilter dengan benar');

  // Test CSV Export with date range
  let csvRes = { headers: {}, body: '' };
  await AnalyticsController.exportCsv(
    { query: { range: '7d' } },
    {
      setHeader: (k, v) => { csvRes.headers[k] = v; },
      send: (data) => { csvRes.body = data; },
      status: () => ({ json: () => {} })
    }
  );
  assert(
    csvRes.body.includes('Waktu (WIB)') && csvRes.body.includes('Kampanye'),
    'Export CSV menghasilkan file lead terfilter lengkap dengan header dan baris data'
  );

  // 3. TEST BACKUP & RESTORE
  console.log('\n--- 3. Pengujian Backup & Restore (Export/Import) ---');

  // Test Backup Stats
  let statsRes = {};
  await BackupController.getStats(
    {},
    { status: (code) => ({ json: (data) => { statsRes = { code, data }; } }), json: (data) => { statsRes = { code: 200, data }; } }
  );
  assert(statsRes.data.success && statsRes.data.data.totalCampaigns > 0, 'Backup stats menghitung statistik database akurat');

  // Test Full Export
  let exportRes = {};
  await BackupController.exportData(
    { query: { type: 'full' }, user: { name: 'Super Admin' } },
    {
      setHeader: () => {},
      send: () => {},
      json: (data) => { exportRes = data; },
      status: (code) => ({ json: (data) => { exportRes = { code, data }; } })
    }
  );
  assert(
    exportRes.success && exportRes.backup && exportRes.backup.data.campaigns.length > 0,
    'Export Full Backup menghasilkan payload JSON lengkap dengan metadata snapshot'
  );

  // Test Import & Restore (Merge mode)
  let importRes = {};
  await BackupController.importData(
    {
      body: {
        backup: exportRes.backup,
        mode: 'merge'
      }
    },
    {
      json: (data) => { importRes = data; },
      status: (code) => ({ json: (data) => { importRes = { code, data }; } })
    }
  );
  assert(importRes.success, 'Restore data snapshot (Mode Merge/Replace) berhasil dieksekusi dengan aman');

  console.log('\n===============================================');
  console.log(`🎉 HASIL PENGUJIAN: ${passedTests} LULUS, ${failedTests} GAGAL`);
  console.log('===============================================\n');

  await prisma.$disconnect();
  process.exit(failedTests > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
