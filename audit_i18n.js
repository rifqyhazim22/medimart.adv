const fs = require('fs');
const path = require('path');

// 1. Parse i18n.js
const i18nPath = path.join(__dirname, 'public/js/i18n.js');
let i18nContent = fs.readFileSync(i18nPath, 'utf8');

const definedKeys = new Set();
const keyRegex = /'([^']+)':\s*\{/g;
let match;
while ((match = keyRegex.exec(i18nContent)) !== null) {
    definedKeys.add(match[1]);
}

// 2. Scan views and controllers and public/js for t('key') and req.t('key') and data-i18n="key"
const usedKeys = new Set();
const dirsToScan = [
    path.join(__dirname, 'views'),
    path.join(__dirname, 'controllers'),
    path.join(__dirname, 'public/js')
];

const usageRegexes = [
    /t\('([^']+)'/g,
    /req\.t\('([^']+)'/g,
    /data-i18n\s*=\s*"([^"]+)"/g,
    /data-i18n-placeholder\s*=\s*"([^"]+)"/g
];

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
        } else if (fullPath.endsWith('.ejs') || fullPath.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            for (const rx of usageRegexes) {
                let m;
                rx.lastIndex = 0;
                while ((m = rx.exec(content)) !== null) {
                    let key = m[1];
                    // Skip dynamic EJS templates injected in tags or JS interpolations
                    if (!key.includes('<%') && !key.includes(' ') && !key.includes('${')) {
                        usedKeys.add(key);
                    }
                }
            }
        }
    }
}

dirsToScan.forEach(scanDir);

const missingKeys = [];
for (const key of usedKeys) {
    if (!definedKeys.has(key)) {
        missingKeys.push(key);
    }
}

console.log('--- Missing Translation Keys (' + missingKeys.length + ') ---');
missingKeys.sort().forEach(k => console.log(k));
