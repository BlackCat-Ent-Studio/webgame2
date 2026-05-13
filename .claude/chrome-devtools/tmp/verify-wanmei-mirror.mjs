// One-shot verification: load mirror, capture console + network failures,
// screenshot at 1920x1080, probe carousel/ticker DOM.
import { getBrowser, getPage, disconnectBrowser, outputJSON } from '../../skills/chrome-devtools/scripts/lib/browser.js';

const URL = 'http://localhost:3000/';
const SHOT = 'C:/web2/plans/260507-2044-wanmei-local-mirror/visuals/mirror-homepage-1920x1080.png';

const browser = await getBrowser({ headless: true });
const page = await getPage(browser);

await page.setViewport({ width: 1920, height: 1080 });

const consoleMsgs = [];
const failures = [];

page.on('console', (m) => consoleMsgs.push({ type: m.type(), text: m.text() }));
page.on('pageerror', (e) => consoleMsgs.push({ type: 'pageerror', text: e.message }));
page.on('requestfailed', (req) =>
  failures.push({ url: req.url(), reason: req.failure()?.errorText || 'unknown' }),
);
page.on('response', (res) => {
  if (res.status() >= 400) failures.push({ url: res.url(), status: res.status() });
});

await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise((r) => setTimeout(r, 5000)); // let carousels render

const dom = await page.evaluate(() => ({
  title: document.title,
  heroSlides: document.querySelectorAll('#index_lunbo_top .swiper-slide').length,
  heroThumbs: document.querySelectorAll('#index_lunbo_icon .swiper-slide').length,
  newsSlides: document.querySelectorAll('#cv_swiper .swiper-slide').length,
  newsTabs: document.querySelectorAll('#cv_swiperPic li').length,
  gameClient: document.querySelectorAll('.insertClient li').length,
  gameMobile: document.querySelectorAll('.insertMobiel li').length,
  gameWeb: document.querySelectorAll('.insertWebgame li').length,
  gameOther: document.querySelectorAll('.insertOther li').length,
  brandTiles: document.querySelectorAll('.brand_list li').length,
  swiperActive: document.querySelector('.product-top .swiper-slide-active') !== null,
  imgsLoaded: Array.from(document.images).filter((i) => i.complete && i.naturalWidth > 0).length,
  imgsBroken: Array.from(document.images).filter((i) => i.complete && i.naturalWidth === 0).length,
  imgsTotal: document.images.length,
}));

await page.screenshot({ path: SHOT, type: 'png' });

const errCount = consoleMsgs.filter((m) => m.type === 'error' || m.type === 'pageerror').length;
const warnCount = consoleMsgs.filter((m) => m.type === 'warning').length;

outputJSON({
  success: true,
  screenshot: SHOT,
  dom,
  console: {
    total: consoleMsgs.length,
    errors: errCount,
    warnings: warnCount,
    sample: consoleMsgs.slice(0, 15),
  },
  network: {
    failures: failures.length,
    sample: failures.slice(0, 20),
  },
});

await disconnectBrowser();
