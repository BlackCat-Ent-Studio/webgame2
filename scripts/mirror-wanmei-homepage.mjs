// Mirror the wanmei games homepage byte-for-byte for local Stage 1 testing.
// Fetches https://games.wanmei.com/, recursively downloads all referenced
// assets from games.wanmei.com + static.games.wanmei.com, rewrites URLs to
// local relative paths, patches isMobile() and stat.js out.
//
// Run: node scripts/mirror-wanmei-homepage.mjs

import { load } from 'cheerio';
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { dirname, join, posix } from 'node:path';
import { URL } from 'node:url';

const ROOT = 'https://games.wanmei.com/';
const OUT = 'mirror';
const HOSTS = new Set(['games.wanmei.com', 'static.games.wanmei.com']);
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  Referer: ROOT,
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
};

const seen = new Set();
const errors = [];
const stats = { files: 0, bytes: 0, byHost: {} };

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

// Map an absolute URL on a whitelisted host to a local mirror path.
function urlToLocalPath(absUrl) {
  let u;
  try {
    u = new URL(absUrl);
  } catch {
    return null;
  }
  if (!HOSTS.has(u.hostname)) return null;
  let p = u.pathname === '/' ? '/index.html' : u.pathname;
  // Drop query string from path (filesystems don't keep it). Most static
  // assets here use ?v1 cache-busting which we can ignore.
  const segments = p.split('/').filter(Boolean);
  return join(OUT, u.hostname, ...segments);
}

// Compute a browser-friendly POSIX relative path from `fromFile`'s directory
// to `targetLocal`. Both are local FS paths; we normalize slashes for the web.
function toPosix(p) {
  return p.replaceAll('\\', '/');
}

function urlToRelative(absUrl, fromFileLocalPath) {
  const targetLocal = urlToLocalPath(absUrl);
  if (!targetLocal) return absUrl; // off-host — leave alone
  const fromDir = toPosix(dirname(fromFileLocalPath));
  const target = toPosix(targetLocal);
  let rel = posix.relative(fromDir, target);
  if (!rel) rel = posix.basename(target);
  if (!rel.startsWith('.') && !rel.startsWith('/')) rel = './' + rel;
  return rel;
}

async function downloadOne(url) {
  if (seen.has(url)) return null;
  seen.add(url);

  const local = urlToLocalPath(url);
  if (!local) return null;

  if (await exists(local)) {
    return local; // idempotent skip
  }

  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      errors.push({ url, status: res.status });
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await mkdir(dirname(local), { recursive: true });
    await writeFile(local, buf);

    stats.files++;
    stats.bytes += buf.length;
    const host = new URL(url).hostname;
    stats.byHost[host] = (stats.byHost[host] || 0) + 1;

    // Recurse one level into CSS for url(...) refs and rewrite them.
    if (local.endsWith('.css')) {
      const css = buf.toString('utf8');
      const refs = [
        ...css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g),
      ].map((m) => m[1]);
      // Download referenced assets
      for (const u of refs) {
        if (u.startsWith('data:')) continue;
        try {
          const abs = new URL(u, url).toString();
          await downloadOne(abs);
        } catch {
          /* ignore malformed */
        }
      }
      // Rewrite url(...) to local relative paths
      const rewritten = css.replace(
        /url\(\s*['"]?([^'")]+)['"]?\s*\)/g,
        (m, u) => {
          if (u.startsWith('data:')) return m;
          try {
            const abs = new URL(u, url).toString();
            return `url(${urlToRelative(abs, local)})`;
          } catch {
            return m;
          }
        },
      );
      await writeFile(local, rewritten);
    }
    return local;
  } catch (e) {
    errors.push({ url, err: String(e) });
    return null;
  }
}

async function main() {
  console.log('Fetching root:', ROOT);
  const res = await fetch(ROOT, { headers: HEADERS });
  if (!res.ok) throw new Error(`Root fetch failed: ${res.status}`);
  const html = await res.text();
  const $ = load(html, { decodeEntities: false });

  // Collect asset URLs from HTML.
  const queue = new Set();
  $('link[href], script[src], img[src]').each((_, el) => {
    const attr = el.tagName === 'link' ? 'href' : 'src';
    const v = $(el).attr(attr);
    if (!v) return;
    try {
      queue.add(new URL(v, ROOT).toString());
    } catch {
      /* ignore */
    }
  });
  $('source[srcset], img[srcset]').each((_, el) => {
    const v = $(el).attr('srcset');
    if (!v) return;
    v.split(',').forEach((part) => {
      const u = part.trim().split(/\s+/)[0];
      if (!u) return;
      try {
        queue.add(new URL(u, ROOT).toString());
      } catch {
        /* ignore */
      }
    });
  });
  // Inline <style> url(...) refs.
  $('style').each((_, el) => {
    const css = $(el).text();
    [...css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].forEach((m) => {
      if (m[1].startsWith('data:')) return;
      try {
        queue.add(new URL(m[1], ROOT).toString());
      } catch {
        /* ignore */
      }
    });
  });

  console.log('Asset queue:', queue.size);
  // Download (concurrency-limited via simple chunking; cheerio gave us a static set)
  const list = [...queue];
  const CONCURRENCY = 8;
  for (let i = 0; i < list.length; i += CONCURRENCY) {
    await Promise.all(list.slice(i, i + CONCURRENCY).map(downloadOne));
  }

  // Patches: comment out isMobile import + redirect, and stat.js import.
  $('script[src*="isMobile"]').each((_, el) => {
    $(el).replaceWith('<!-- isMobile script removed (Stage 1 mirror) -->');
  });
  // The inline `<script>if(isMobile()){location.href=...}</script>` block:
  $('script').each((_, el) => {
    const text = $(el).html() || '';
    if (/isMobile\s*\(\s*\)/.test(text) && /location\.href/.test(text)) {
      $(el).replaceWith(
        '<!-- isMobile redirect block removed (Stage 1 mirror) -->',
      );
    }
  });
  $('script[src*="stat.js"]').each((_, el) => {
    $(el).replaceWith('<!-- stat.js removed (Stage 1 mirror) -->');
  });

  // Rewrite all attribute URLs to local relative paths.
  const indexLocal = join(OUT, 'index.html');
  $('link[href], script[src], img[src]').each((_, el) => {
    const attr = el.tagName === 'link' ? 'href' : 'src';
    const v = $(el).attr(attr);
    if (!v) return;
    try {
      const abs = new URL(v, ROOT).toString();
      const rel = urlToRelative(abs, indexLocal);
      $(el).attr(attr, rel);
    } catch {
      /* ignore */
    }
  });
  $('source[srcset], img[srcset]').each((_, el) => {
    const v = $(el).attr('srcset');
    if (!v) return;
    const rewritten = v
      .split(',')
      .map((part) => {
        const m = part.trim().split(/\s+/);
        if (!m[0]) return part;
        try {
          const abs = new URL(m[0], ROOT).toString();
          m[0] = urlToRelative(abs, indexLocal);
        } catch {
          /* ignore */
        }
        return m.join(' ');
      })
      .join(', ');
    $(el).attr('srcset', rewritten);
  });

  await mkdir(OUT, { recursive: true });
  await writeFile(indexLocal, $.html());

  console.log('=== Mirror Summary ===');
  console.log('Files:', stats.files, '| Bytes:', stats.bytes);
  console.log('By host:', stats.byHost);
  console.log('Errors:', errors.length);
  errors.slice(0, 30).forEach((e) => console.log(' -', e));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
