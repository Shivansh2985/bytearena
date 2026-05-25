const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      if (fullPath.includes('/lib/api.ts')) continue;
      
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Replace fetch('/api/...') and fetch(`/api/...`)
      // But avoid replacing apiFetch if we run it twice
      const fetchRegex = /\bfetch\s*\(\s*(['"`]\/api\/)/g;
      
      if (fetchRegex.test(content)) {
        content = content.replace(fetchRegex, "apiFetch($1");
        modified = true;
      }

      // If we modified it, ensure apiFetch is imported
      if (modified) {
        if (!content.includes('import { apiFetch }')) {
          // Add import at the top (after other imports or "use client")
          const lines = content.split('\n');
          let insertIdx = 0;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('"use client"') || lines[i].startsWith("'use client'")) {
              insertIdx = i + 1;
              break;
            }
          }
          lines.splice(insertIdx, 0, "import { apiFetch } from '@/lib/api';");
          content = lines.join('\n');
        }
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated:', fullPath);
      }
    }
  }
}

processDir('/Users/shivanshsharma/Desktop/codeee/bytearena/apps/frontend/src');
console.log('Done!');
