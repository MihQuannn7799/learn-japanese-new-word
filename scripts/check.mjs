#!/usr/bin/env node
// Kiểm tra tĩnh cho Kotoba. Không cần cài thư viện.
// Chạy: node scripts/check.mjs
//
// Kiểm tra:
//  1. Cú pháp mọi file .js / .mjs (coi như ES module)
//  2. Mọi import tương đối trỏ tới file có thật, và tên import có được export
//  3. index.html: các href/src nội bộ trỏ tới file có thật
//  4. Không có URL mạng ngoài (app chạy offline, không CDN)
//  5. storageKey không bị đổi (đổi sẽ làm mất dữ liệu người dùng)
//  6. Chạy tests/ bằng node --test nếu thư mục tồn tại

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXPECTED_STORAGE_KEY = 'kotoba.notebook.v1';

// Kiểm tra nguồn thay vì bản dist được tạo từ nguồn.
const sourceRoot = ['frontend', 'src', '.', 'dist']
  .map((name) => join(repoRoot, name))
  .find((dir) => existsSync(join(dir, 'index.html')));

const errors = [];
const warnings = [];
const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);
const rel = (path) => relative(repoRoot, path) || '.';

if (!sourceRoot) {
  console.error('Không tìm thấy index.html trong frontend/.');
  process.exit(1);
}

const skipDirs = new Set(['.git', 'node_modules', '.claude', 'tests', 'scripts', 'storage']);

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    if (skipDirs.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const allFiles = walk(sourceRoot);
const frontendJs = allFiles.filter((file) => /\.m?js$/.test(file));
const supportFiles = ['backend', 'scripts', 'tests']
  .map((name) => join(repoRoot, name))
  .filter(existsSync)
  .flatMap(walk);
const jsFiles = [...frontendJs, ...supportFiles.filter((file) => /\.m?js$/.test(file))];
const htmlFiles = allFiles.filter((file) => file.endsWith('.html'));
const cssFiles = allFiles.filter((file) => file.endsWith('.css'));

// Reject unresolved merges, including markers in files without JS syntax checks.
const textFiles = [...allFiles, ...supportFiles, join(repoRoot, 'README.md')]
  .filter((file) => /\.(?:m?js|html|css|json|md|txt)$/.test(file) && existsSync(file));
for (const file of textFiles) {
  const source = readFileSync(file, 'utf8');
  if (/^(?:<{7}(?: .*)?|={7}|>{7}(?: .*)?|\|{7}(?: .*)?)\r?$/m.test(source)) {
    fail(`${rel(file)} còn dấu xung đột Git chưa được giải quyết.`);
  }
  if (/\.test\.m?js$/.test(file) && !source.trim()) {
    fail(`${rel(file)} rỗng nên không kiểm tra được chức năng nào.`);
  }
}

// --- 1. Cú pháp JS (coi là ES module qua stdin) -----------------------------
for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ['--input-type=module', '--check'], {
    input: readFileSync(file),
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    const detail = (result.stderr || '').split('\n').filter(Boolean).slice(0, 4).join('\n    ');
    fail(`Lỗi cú pháp trong ${rel(file)}:\n    ${detail}`);
  }
}

// --- 2. Import tương đối và tên export --------------------------------------
function exportedNames(source) {
  const names = new Set();
  for (const match of source.matchAll(/export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g)) {
    names.add(match[1]);
  }
  for (const match of source.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of match[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop();
      if (name) names.add(name);
    }
  }
  if (/export\s+default\b/.test(source)) names.add('default');
  return names;
}

for (const file of jsFiles) {
  const source = readFileSync(file, 'utf8');
  const importPattern = /import\s+(?:([^;]*?)\s+from\s+)?['"](\.{1,2}\/[^'"]+)['"]/g;
  for (const match of source.matchAll(importPattern)) {
    const [, clause, specifier] = match;
    const target = resolve(dirname(file), specifier);
    if (!existsSync(target)) {
      fail(`${rel(file)} import '${specifier}' nhưng file không tồn tại.`);
      continue;
    }
    if (!clause || !clause.includes('{')) continue;
    const wanted = clause.match(/\{([\s\S]*)\}/)[1].split(',')
      .map((part) => part.trim().split(/\s+as\s+/)[0]).filter(Boolean);
    const available = exportedNames(readFileSync(target, 'utf8'));
    for (const name of wanted) {
      if (!available.has(name)) fail(`${rel(file)} import '${name}' từ '${specifier}' nhưng file đó không export tên này.`);
    }
  }
}

// --- 3. Tham chiếu nội bộ trong HTML ----------------------------------------
for (const file of htmlFiles) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/\b(?:href|src)\s*=\s*"([^"]+)"/g)) {
    const value = match[1];
    if (/^(#|https?:|mailto:|data:|javascript:)/.test(value)) continue;
    const target = resolve(dirname(file), value.split(/[?#]/)[0]);
    if (!existsSync(target)) fail(`${rel(file)} tham chiếu '${value}' nhưng file không tồn tại.`);
  }
}

// --- 4. Không có URL mạng ngoài ---------------------------------------------
const allowedHosts = ['www.w3.org']; // xmlns của SVG
for (const file of [...htmlFiles, ...frontendJs, ...cssFiles]) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/https?:\/\/([A-Za-z0-9.-]+)[^\s"'`)<>]*/g)) {
    if (!allowedHosts.includes(match[1])) {
      fail(`${rel(file)} chứa URL ngoài '${match[0]}'. App phải chạy offline, không dùng CDN hay gọi mạng.`);
    }
  }
}

// --- 5. storageKey ----------------------------------------------------------
for (const file of jsFiles) {
  const match = readFileSync(file, 'utf8').match(/storageKey\s*=\s*['"]([^'"]+)['"]/);
  if (match && match[1] !== EXPECTED_STORAGE_KEY) {
    fail(`${rel(file)} đổi storageKey thành '${match[1]}' (mong đợi '${EXPECTED_STORAGE_KEY}'). Đổi key sẽ làm mất dữ liệu người dùng; cần migration và xác nhận của người dùng.`);
  }
}

// --- 6. Test (nếu có) -------------------------------------------------------
const testsDir = join(repoRoot, 'tests');
if (existsSync(testsDir) && readdirSync(testsDir).some((name) => /\.test\.m?js$/.test(name))) {
  const result = spawnSync(process.execPath, ['--test'], { cwd: repoRoot, encoding: 'utf8' });
  if (result.status !== 0) fail(`Test thất bại:\n${(result.stdout + result.stderr).trim().split('\n').slice(-25).join('\n')}`);
} else {
  warn('Chưa có tests/*.test.mjs (bỏ qua bước test).');
}

// --- Kết quả ----------------------------------------------------------------
console.log(`Đã kiểm tra: ${jsFiles.length} file JS, ${htmlFiles.length} file HTML, ${cssFiles.length} file CSS (gốc: ${rel(sourceRoot)}).`);
for (const message of warnings) console.log(`⚠ ${message}`);
if (errors.length) {
  console.error(`\n✗ ${errors.length} lỗi:`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}
console.log('✓ Mọi kiểm tra tĩnh đều đạt.');
