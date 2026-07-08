const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const screenshotService = require('./services/screenshotService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// SSE Clients holding array
let sseClients = [];

// Fallback Default Categories if Google Sheets is not yet connected
const FALLBACK_CATEGORIES = [
  {"id": "LUPA_PASSWORD", "name": "LUPA PASSWORD", "url": "https://wdbos90.com/#/forget"},
  {"id": "HUBUNGI_KAMI", "name": "HUBUNGI KAMI", "url": "https://wdbos90.com/#/service"},
  {"id": "PREDIKSI_BOLA", "name": "PREDIKSI BOLA", "url": "https://wdbos90.com/blog/?title=PREDIKSI%20BOLA%20WDBOS"},
  {"id": "RTP_SLOT", "name": "RTP SLOT", "url": "https://wdbos90.com/rtp/"},
  {"id": "CARA_BERMAIN", "name": "CARA BERMAIN", "url": "https://wdbos90.com/#/gameRules"},
  {"id": "BUKTI_JP", "name": "BUKTI JP", "url": "https://wdbos90.com/blog/?categories=BUKTI%20JP"},
  {"id": "PENGADUAN_CUSTOMER", "name": "PENGADUAN CUSTOMER", "url": "https://wdbos90.com/#/index?category=hot"},
  {"id": "YOUTUBE", "name": "YOUTUBE", "url": "https://www.youtube.com/channel/UCPvCLIOIpq8ItGmcW-iCgwg?themeRefresh=1"},
  {"id": "FACEBOOK", "name": "FACEBOOK", "url": "https://www.facebook.com/wdbos888?rdid=BE7ULcomb6m1CNDM&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1ET3FYxgUf%2F#"},
  {"id": "TWITTER", "name": "TWITTER", "url": "https://x.com/wdbos252"},
  {"id": "TELEGRAM", "name": "TELEGRAM", "url": "https://t.me/wdbosnew88_bot"},
  {"id": "WHATSAPP_CHANNEL", "name": "WHATSAPP CHANNEL", "url": "https://www.whatsapp.com/channel/0029Vb8RagH6LwHt3GNo6v17"},
  {"id": "FACEBOOK_GROUP", "name": "FACEBOOK GROUP", "url": "https://www.facebook.com/groups/1857154468262416"},
  {"id": "LIVECHAT", "name": "LIVECHAT", "url": "https://direct.lc.chat/14748282"},
  {"id": "INSTAGRAM", "name": "INSTAGRAM", "url": ""},
  {"id": "PROMOSI_SITUS", "name": "PROMOSI SITUS", "url": "https://wdbos90.com/#/activity"},
  {"id": "PROMOSI_PROVIDER", "name": "PROMOSI PROVIDER", "url": ""},
  {"id": "DAFTAR", "name": "DAFTAR", "url": "https://wdbos90.com/#/register"},
  {"id": "PERATURAN_PERMAINAN", "name": "PERATURAN PERMAINAN", "url": ""},
  {"id": "LOGIN_SAYA_SETUJU", "name": "LOGIN & SAYA SETUJU", "url": ""},
  {"id": "LUCKY_WHEEL", "name": "LUCKY WHEEL", "url": ""},
  {"id": "PROFIL", "name": "PROFIL", "url": "https://wdbos90.com/#/mine"},
  {"id": "HISTORY_TARUHAN", "name": "HISTORY TARUHAN", "url": "https://wdbos90.com/#/betRecords"},
  {"id": "PERHITUNGAN_HADIAH_TOGEL", "name": "PERHITUNGAN HADIAH TOGEL", "url": "https://wdbos90.com/#/lotteryCalculate"},
  {"id": "PREDIKSI_TOGEL", "name": "PREDIKSI TOGEL", "url": "https://wdbos90.com/blog/?title=PREDIKSI%20TOGEL%20WDBOS"},
  {"id": "PESAN_SAYA", "name": "PESAN SAYA", "url": "https://wdbos90.com/#/myMessage"},
  {"id": "REFFERAL", "name": "REFFERAL", "url": "https://wdbos90.com/#/myRecommend"},
  {"id": "KYC", "name": "KYC", "url": "https://wdbos90.com/#/myKYC"},
  {"id": "BONUS", "name": "BONUS", "url": "https://wdbos90.com/#/transactionRecords?Bonus"},
  {"id": "LOGOUT", "name": "LOGOUT", "url": "https://wdbos90.com/#/index?category=history"},
  {"id": "PENARIKAN_CASH", "name": "PENARIKAN CASH", "url": "https://wdbos90.com/#/withdrawal"},
  {"id": "PENARIKAN_USDT", "name": "PENARIKAN USDT", "url": "https://wdbos90.com/#/withdrawal"},
  {"id": "DEPOSIT", "name": "DEPOSIT", "url": "https://wdbos90.com/#/deposit"},
  {"id": "BARCODE_QRIS", "name": "BARCODE QRIS", "url": "https://wdbos90.com/#/deposit"},
  {"id": "JADWAL_PASARAN_TOGEL", "name": "JADWAL PASARAN TOGEL", "url": "https://wdbos90.com/#/index?category=lottery"},
  {"id": "HADIAH_TOGEL", "name": "HADIAH TOGEL", "url": "https://wdbos90.com/blog/?title=HADIAH%20TOGEL%20WDBOS"},
  {"id": "JADWAL_BANK", "name": "JADWAL BANK", "url": "https://wdbos90.com/blog/?categories=Jadwal%20Bank"},
  {"id": "SYAIR", "name": "SYAIR", "url": "https://wdbos90.com/blog/?categories=SYAIR"},
  {"id": "CARA_BETTING_TOGEL", "name": "CARA BETTING TOGEL", "url": "https://wdbos90.com/blog/?title=CARA%20BETTING%20TOGEL"},
  {"id": "HISTORY_NOMOR", "name": "HISTORY NOMOR", "url": "https://randomtechhub.com/?gameid=54#/historyNomor"},
  {"id": "BUKU_MIMPI", "name": "BUKU MIMPI", "url": ""},
  {"id": "PROMOSI_SPESIAL", "name": "PROMOSI SPESIAL", "url": "https://wdbos90.com/#/activity"},
  {"id": "MENU_GAMES_CEK_1_1", "name": "MENU GAMES (CEK 1 1)", "url": ""},
  {"id": "TOGEL_ALL_PASARAN", "name": "TOGEL ALL PASARAN", "url": "https://wdbos90.com/#/index?category=lottery"},
  {"id": "SPINEMAN", "name": "SPINEMAN", "url": "https://ruevop.com/ifm.html"},
  {"id": "LUCKY_DRAGON_TIGER_LIVE_GAMES", "name": "LUCKY DRAGON TIGER LIVE GAMES", "url": "https://rebrand.ly/du4usn6"},
  {"id": "LUCKY_BACCARAT_LIVE_GAMES", "name": "LUCKY BACCARAT LIVE GAMES", "url": "https://rebrand.ly/rsl83qt"},
  {"id": "LIVEGAME_PRAGMATIC_PLAY_LIVE_GAMES", "name": "LIVEGAME PRAGMATIC PLAY LIVE GAMES", "url": "https://wdbos90.com/#/game?category=live&code=ppLive&typeId=1808235"},
  {"id": "PASSO_V_LIVE_GAMES", "name": "PASSO V LIVE GAMES", "url": "https://www.passo-game.com/Games/lobby.aspx?lang=id&section=hot"},
  {"id": "EVOLUTION_LIVE_GAMES", "name": "EVOLUTION LIVE GAMES", "url": "https://tmphnxsea.ps9launcher.com/frontend/evo/mini/#category=all_games"},
  {"id": "SEXYGAMING_LIVE_GAMES", "name": "SEXYGAMING LIVE GAMES", "url": "https://bpweb.wlyss.net/player/webMain.jsp?dm=1&title=1"},
  {"id": "EMPIRE_GAMING_LIVE_GAMES", "name": "EMPIRE GAMING LIVE GAMES", "url": "https://fl.empiregaming.io/lobby"},
  {"id": "TGION_LIVE_GAMES", "name": "TGION LIVE GAMES", "url": "https://wwwpo1c1.t38games.com/web-page/general/tablet/default.aspx?token=IiOsbGd2QRdvo7q2w9j+bkMavHMGZF7SK4lmWeL4O9PXlo6sPICmAc8KEMhxpNeEQL+5FmpVvJ/3a7YehDG5LQ==&redir=PO1&isRedir=yes&product=1#/"},
  {"id": "SA_GAMING_LIVE_GAMES", "name": "SA GAMING LIVE GAMES", "url": "https://wdbos90.com/#/game?category=live&code=saLv&typeId=9655"},
  {"id": "BG_LIVE_GAMES", "name": "BG LIVE GAMES", "url": "https://cdnx-hw.yctkrs.com/h5V01/pc/index.html?locale=en_US&mode=9&token=ht12482C858116A33899EA2D5D574941&uid=1210877313&account=1_wdbostes99&sn=ht12&referrer=https://wdbos90.com/"},
  {"id": "PLAYTECH_LIVE_GAMES", "name": "PLAYTECH LIVE GAMES", "url": "https://wdbos90.com/#/game?category=live&code=playtechLive&typeId=3228206"},
  {"id": "MICROGAMING_LIVE_GAMES", "name": "MICROGAMING LIVE GAMES", "url": "https://wdbos90.com/#/game?category=live&code=microLive&typeId=3376034"},
  {"id": "PRAGMATIC_PLAY_SLOT", "name": "PRAGMATIC PLAY SLOT", "url": "https://wdbos90.com/#/game?category=elgame&code=ppSlot&typeId=10183"},
  {"id": "PG_SLOT", "name": "PG SLOT", "url": "https://wdbos90.com/#/game?category=elgame&code=pgSlot&typeId=9704"},
  {"id": "PNG_SLOT", "name": "PNG SLOT", "url": "https://wdbos90.com/#/game?category=elgame&code=yesSlot&typeId=9685"},
  {"id": "NOLIMITCITY_SLOT", "name": "NOLIMITCITY SLOT", "url": "https://wdbos90.com/#/game?category=elgame&code=evonlc&typeId=508286"},
  {"id": "JILI_SLOT", "name": "JILI SLOT", "url": "https://wdbos90.com/#/game?category=elgame&code=jiliSlot&typeId=552271"},
  {"id": "ASK_SLOT", "name": "ASK SLOT", "url": "https://wdbos90.com/#/game?category=elgame&code=askSlot&typeId=1927017"},
  {"id": "GGSOFT_SLOT", "name": "GGSOFT SLOT", "url": "https://wdbos90.com/#/game?category=elgame&code=ggSoft&typeId=2417093"},
  {"id": "HABANERO_SLOT", "name": "HABANERO SLOT", "url": "https://wdbos90.com/#/game?category=elgame&code=habaneroSlot&typeId=1145817"},
  {"id": "5G_SLOT", "name": "5G SLOT", "url": "https://wdbos90.com/#/game?category=elgame&code=5gSlot&typeId=1624015"},
  {"id": "FATPANDA_SLOT", "name": "FATPANDA SLOT", "url": "https://wdbos90.com/#/game?category=elgame&code=fpSlot&typeId=2194299"},
  {"id": "SPADEGAMING_SLOT", "name": "SPADEGAMING SLOT", "url": "https://wdbos90.com/#/game?category=elgame&code=sgSlot&typeId=3334040"},
  {"id": "PLAYTECH_SLOT", "name": "PLAYTECH SLOT", "url": "https://wdbos90.com/#/game?category=elgame&code=playtechSlot&typeId=2916756"},
  {"id": "WOWGAMING_SLOT", "name": "WOWGAMING SLOT", "url": "https://wdbos90.com/#/game?category=elgame&code=wowgaming&typeId=2420896"},
  {"id": "HACKSAW_SLOT", "name": "HACKSAW SLOT", "url": "https://wdbos90.com/#/game?category=elgame&code=IMone&typeId=1984277"},
  {"id": "PLAYSTAR_SLOT", "name": "PLAYSTAR SLOT", "url": "https://wdbos90.com/#/game?category=elgame&code=playStar&typeId=2410414"},
  {"id": "RED_TIGER_SLOT", "name": "RED TIGER SLOT", "url": "https://wdbos90.com/#/game?category=elgame&code=evoredtiger&typeId=508363"},
  {"id": "NETENT_SLOT", "name": "NETENT SLOT", "url": "https://wdbos90.com/#/game?category=elgame&code=evonetent&typeId=5080"},
  {"id": "BIGTIMEGAMING_SLOT", "name": "BIGTIMEGAMING SLOT", "url": "https://wdbos90.com/#/game?category=elgame&code=evobtg&typeId=508051"},
  {"id": "JOKER_SLOT", "name": "JOKER SLOT", "url": "https://wdbos90.com/#/game?category=elgame&code=jokerSlot&typeId=9925"},
  {"id": "WMC_SLOT", "name": "WMC SLOT", "url": "https://wdbos90.com/#/game?category=elgame&code=wmcSlot&typeId=9849"},
  {"id": "MICROGAMING_SLOT", "name": "MICROGAMING SLOT", "url": "https://wdbos90.com/#/game?category=elgame&code=microSlot&typeId=3376097"},
  {"id": "BESOFT", "name": "BESOFT", "url": "https://wdbos90.com/#/game?category=elgame&code=besoftSlot&typeId=3243907"},
  {"id": "SABA", "name": "SABA", "url": "https://i7f2oa.bp145b4u.com/(S(Tesqedixd2c99fc589434110a7d86220d7872ffe))/NewIndex?lang=id&webskintype=3&scmt=tab02&ssmt=tab02"},
  {"id": "SBO", "name": "SBO", "url": "https://sports-sbomaind-play.llkkbbzz22.com/SBOMainD/ID_ID?token=1159834431.shzajRAOXjAgHYDeHfCcgs.241&host=sportsbook-auth.llkkbbzz22.com&loginname=5601849d56ee62947bbea66f1b7be1cb&jd=jd"},
  {"id": "AP", "name": "AP", "url": "https://wyfunom.eviran66.com/id/compact/sports/soccer"},
  {"id": "TF", "name": "TF", "url": "https://gc.9wwu88.com/v8/events"},
  {"id": "JILI_FISHING", "name": "JILI FISHING", "url": "https://wdbos90.com/#/game?category=fish&code=jiliFish&typeId=552407"},
  {"id": "BG_FISHING", "name": "BG FISHING", "url": "https://wdbos90.com/#/game?category=fish&code=bgFish&typeId=23693"},
  {"id": "JOKER_FISHING", "name": "JOKER FISHING", "url": "https://wdbos90.com/#/game?category=fish&code=jokerFish&typeId=10122"},
  {"id": "ASK_FISHING", "name": "ASK FISHING", "url": "https://wdbos90.com/#/game?category=fish&code=askFish&typeId=1927013"},
  {"id": "SPADEGAMING_FISHING", "name": "SPADEGAMING FISHING", "url": "https://wdbos90.com/#/game?category=fish&code=sgFish&typeId=3334167"},
  {"id": "ARCADE", "name": "ARCADE", "url": "https://wdbos90.com/#/index?category=card"}
];

// Listen for logs from screenshot service and broadcast them to SSE clients
screenshotService.on('log', (logObj) => {
  broadcastSSE('log', logObj);
});

// Local cache for categories status to provide instant, real-time live updates
let categoriesCache = null;

// Manually restored categories that were accidentally deleted from Google Sheets
// These are merged into cache on every load so they survive server restarts
const RESTORED_CATEGORIES = [
  { id: 'LUPA_PASSWORD', name: 'LUPA PASSWORD', url: 'https://wdbos90.com/#/forget' },
  { id: 'HUBUNGI_KAMI',  name: 'HUBUNGI KAMI',  url: 'https://wdbos90.com/#/service' }
];

// Helper to merge RESTORED_CATEGORIES into cache (add to top if missing)
function mergeRestoredCategories(cache) {
  for (let i = RESTORED_CATEGORIES.length - 1; i >= 0; i--) {
    const r = RESTORED_CATEGORIES[i];
    const exists = cache.find(c => c.id === r.id);
    if (!exists) {
      cache.unshift({
        id: r.id, name: r.name, url: r.url,
        statusPagi: 'Idle', lastCapturedPagi: '', screenshotUrlPagi: '',
        statusMalam: 'Idle', lastCapturedMalam: '', screenshotUrlMalam: ''
      });
      console.log(`[RESTORE] Category "${r.name}" re-added to cache from restore list.`);
    }
  }
  return cache;
}

// Helper to compare two cache objects to check if any data (like links/status) changed
function hasCacheChanged(oldCache, newCache) {
  if (!oldCache || !newCache) return true;
  if (oldCache.length !== newCache.length) return true;
  
  for (let i = 0; i < oldCache.length; i++) {
    const o = oldCache[i];
    const n = newCache.find(c => c.id === o.id);
    if (!n) return true;
    if (o.url !== n.url || 
        o.statusPagi !== n.statusPagi || 
        o.screenshotUrlPagi !== n.screenshotUrlPagi ||
        o.statusMalam !== n.statusMalam || 
        o.screenshotUrlMalam !== n.screenshotUrlMalam) {
      return true;
    }
  }
  return false;
}

// Helper to fetch categories from Google Sheets and update cache
async function refreshCategoriesCache(scriptUrl) {
  try {
    const response = await fetch(`${scriptUrl}?t=${Date.now()}`);
    const data = await response.json();
    if (data && data.success && data.data) {
      const freshData = mergeRestoredCategories(data.data);
      
      // Check if data actually changed before replacing and broadcasting
      const changed = hasCacheChanged(categoriesCache, freshData);
      categoriesCache = freshData;
      
      if (changed) {
        console.log(`[INFO] Cache changes detected. Broadcasting update to all dashboard clients.`);
        broadcastSSE('categories-updated', { success: true, count: categoriesCache.length });
      }
      return true;
    }
  } catch (err) {
    console.error('[ERROR] Failed fetching categories from Sheets:', err.message);
  }
  return false;
}

// Start background auto-synchronization interval (Runs every 25 seconds)
// This will fetch updates silently from Google Sheets and update the dashboard in real-time
setInterval(async () => {
  // Only sync if browser is not busy capturing (to avoid race conditions)
  if (screenshotService.isProcessing) return;
  
  const scriptUrl = screenshotService.settings.appsScriptUrl;
  if (scriptUrl) {
    await refreshCategoriesCache(scriptUrl);
  }
}, 25000);

// Update cache in real-time when capture starts (status = 'Capturing')
screenshotService.on('capture-start', (data) => {
  if (categoriesCache) {
    const item = categoriesCache.find(c => c.id === data.id);
    if (item) {
      if (data.shift === 'Malam') {
        item.statusMalam = 'Capturing';
      } else {
        item.statusPagi = 'Capturing';
      }
      console.log(`[CACHE] Status of ${data.id} set to Capturing (${data.shift})`);
    }
  }
});

// Update cache in real-time when capture completes (Success/Failed + Screenshot URL)
screenshotService.on('capture-complete', (data) => {
  if (categoriesCache) {
    const item = categoriesCache.find(c => c.id === data.id);
    if (item) {
      if (data.shift === 'Malam') {
        item.statusMalam = data.status;
        item.lastCapturedMalam = data.lastCaptured;
        item.screenshotUrlMalam = data.screenshotUrl;
      } else {
        item.statusPagi = data.status;
        item.lastCapturedPagi = data.lastCaptured;
        item.screenshotUrlPagi = data.screenshotUrl;
      }
      console.log(`[CACHE] Status of ${data.id} updated to ${data.status} (${data.shift}), url: ${data.screenshotUrl}`);
    }
  }
});

// SSE helper: Broadcast messages to all connected SSE clients
function broadcastSSE(event, data) {
  sseClients.forEach(client => {
    client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  });
}

/**
 * 1. SETTINGS ENDPOINTS
 */
// GET Settings (removes/masks sensitive credentials, fetches fresh from Spreadsheet)
app.get('/api/settings', async (req, res) => {
  const current = screenshotService.settings;
  const scriptUrl = current.appsScriptUrl;

  if (scriptUrl) {
    try {
      // Fetch fresh settings from Spreadsheet
      const response = await fetch(`${scriptUrl}?t=${Date.now()}`);
      const data = await response.json();
      
      if (data && data.success && data.settings) {
        const s = data.settings;
        
        // Update local settings from Spreadsheet
        const sheetSettings = {
          username: s.AUTO_LOGIN_USERNAME || '',
          password: s.AUTO_LOGIN_PASSWORD || '',
          captureDelay: parseInt(s.DELAY_MS) || 5000,
          zoomScale: s.ZOOM_SCALE || '50%',
          viewportWidth: parseInt(s.VIEWPORT_WIDTH) || 1366,
          viewportHeight: parseInt(s.VIEWPORT_HEIGHT) || 768,
          headless: String(s.HEADLESS_MODE).toUpperCase() === 'TRUE',
          usernameSelector: s.CSS_USERNAME || '',
          passwordSelector: s.CSS_PASSWORD || '',
          loginButtonSelector: s.CSS_LOGIN_BTN || ''
        };

        screenshotService.saveSettings(sheetSettings);
      }
    } catch (err) {
      console.error('Could not load settings from Sheet on GET:', err.message);
    }
  }

  const freshSettings = screenshotService.settings;
  const masked = {
    ...freshSettings,
    password: freshSettings.password ? '********' : '' // Mask for display safety
  };
  res.json({ success: true, settings: masked });
});

// POST Save Settings (saves locally and synchronizes with Spreadsheet)
app.post('/api/settings', async (req, res) => {
  const incoming = req.body;
  
  // If password is sent as masked, retrieve old password from service
  if (incoming.password === '********') {
    incoming.password = screenshotService.settings.password;
  }
  
  const ok = screenshotService.saveSettings(incoming);
  if (!ok) {
    return res.status(500).json({ success: false, error: 'Could not write settings to disk' });
  }

  // If Apps Script URL is present, synchronize settings with Spreadsheet!
  const scriptUrl = incoming.appsScriptUrl || screenshotService.settings.appsScriptUrl;
  if (scriptUrl) {
    try {
      const payload = {
        action: 'updateSettings',
        settings: {
          AUTO_LOGIN_USERNAME: incoming.username || '',
          AUTO_LOGIN_PASSWORD: incoming.password || '',
          DELAY_MS: String(incoming.captureDelay || '5000'),
          ZOOM_SCALE: String(incoming.zoomScale || '50%'),
          VIEWPORT_WIDTH: String(incoming.viewportWidth || '1366'),
          VIEWPORT_HEIGHT: String(incoming.viewportHeight || '768'),
          HEADLESS_MODE: String(incoming.headless !== false).toUpperCase(),
          CSS_USERNAME: incoming.usernameSelector || '',
          CSS_PASSWORD: incoming.passwordSelector || '',
          CSS_LOGIN_BTN: incoming.loginButtonSelector || ''
        }
      };

      await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      screenshotService.log('Settings successfully synchronized with Google Sheet.');
    } catch (err) {
      screenshotService.log(`Could not sync settings to Sheet: ${err.message}`, 'warning');
    }
  }

  res.json({ success: true, message: 'Settings saved successfully and synchronized with Google Sheet.' });
});

/**
 * 2. CATEGORIES ENDPOINTS (Proxied directly to Google Sheets Apps Script Web App)
 */
app.get('/api/categories', async (req, res) => {
  const scriptUrl = screenshotService.settings.appsScriptUrl;
  const force = req.query.force === 'true';
  
  if (!scriptUrl) {
    // If not connected, return the fallback offline list
    return res.json({ 
      success: true, 
      offline: true,
      data: FALLBACK_CATEGORIES.map(c => ({
        ...c,
        statusPagi: 'Idle',
        screenshotUrlPagi: '',
        statusMalam: 'Idle',
        screenshotUrlMalam: ''
      }))
    });
  }

  try {
    // If cache is empty or force refresh is requested, fetch from Sheets
    if (!categoriesCache || force) {
      const success = await refreshCategoriesCache(scriptUrl);
      if (!success && !categoriesCache) {
        // Fallback offline settings if connect fails
        categoriesCache = FALLBACK_CATEGORIES.map(c => ({
          ...c,
          statusPagi: 'Idle',
          screenshotUrlPagi: '',
          statusMalam: 'Idle',
          screenshotUrlMalam: ''
        }));
      }
    }
    res.json({ success: true, offline: false, data: categoriesCache });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: `Could not connect to Google Apps Script. Detail: ${err.message}` 
    });
  }
});

// Update single Category URL
app.post('/api/categories/url', async (req, res) => {
  const { id, url } = req.body;
  const scriptUrl = screenshotService.settings.appsScriptUrl;

  if (!scriptUrl) {
    return res.status(400).json({ 
      success: false, 
      error: 'Cannot update URL on Sheet. Google Sheet connection is not set up.' 
    });
  }

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateUrl', id, url })
    });
    const result = await response.json();
    
    // Update local cache URL if update succeeded
    if (result.success && categoriesCache) {
      const item = categoriesCache.find(c => c.id === id);
      if (item) {
        item.url = url;
        console.log(`[CACHE] Custom URL updated for ${id}: ${url}`);
      }
    }
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Add a new category row
app.post('/api/categories/add', async (req, res) => {
  const { id, name, url } = req.body;
  if (!id || !name) return res.status(400).json({ success: false, error: 'id and name are required.' });

  const scriptUrl = screenshotService.settings.appsScriptUrl;

  // Add to local cache immediately
  if (categoriesCache) {
    const exists = categoriesCache.find(c => c.id === id);
    if (!exists) {
      categoriesCache.unshift({
        id, name, url: url || '',
        statusPagi: 'Idle', lastCapturedPagi: '', screenshotUrlPagi: '',
        statusMalam: 'Idle', lastCapturedMalam: '', screenshotUrlMalam: ''
      });
      console.log(`[CACHE] New category added to cache: ${id}`);
    } else {
      // Update existing
      exists.name = name;
      exists.url = url || exists.url;
      console.log(`[CACHE] Existing category updated in cache: ${id}`);
    }
  }

  // Sync to Google Sheet if connected
  if (scriptUrl) {
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addCategory', id, name, url: url || '' })
      });
      const result = await response.json();
      return res.json({ success: true, message: `Category "${name}" added to cache and sheet.`, sheetResult: result });
    } catch (err) {
      console.warn(`[WARN] Sheet sync failed for addCategory: ${err.message}`);
    }
  }

  res.json({ success: true, message: `Category "${name}" added to local cache. Sheet sync skipped (not connected).` });
});

/**
 * 3. SCREENSHOT QUEUE ACTIONS
 */
// GET Queue Status
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    isProcessing: screenshotService.isProcessing,
    activeId: screenshotService.activeId,
    queueLength: screenshotService.queue.length
  });
});

// POST Start Screenshot Queue
app.post('/api/capture', async (req, res) => {
  const { ids, shift } = req.body; // Array of category IDs and active Shift (Pagi/Malam)
  const scriptUrl = screenshotService.settings.appsScriptUrl;

  if (!scriptUrl) {
    return res.status(400).json({ 
      success: false, 
      error: 'Google Sheet Web App URL must be configured before capturing!' 
    });
  }

  if (screenshotService.isProcessing) {
    return res.status(400).json({ success: false, error: 'Queue is already processing screenshots!' });
  }

  try {
    // Fetch fresh list of URLs and settings from sheet
    const response = await fetch(`${scriptUrl}?t=${Date.now()}`);
    const sheetData = await response.json();
    
    if (!sheetData || !sheetData.success) {
      return res.status(500).json({ success: false, error: sheetData.error || 'Failed to fetch data from Google Sheets' });
    }

    // Sync settings from sheet if returned
    if (sheetData.settings) {
      const s = sheetData.settings;
      const sheetSettings = {
        username: s.AUTO_LOGIN_USERNAME || '',
        password: s.AUTO_LOGIN_PASSWORD || '',
        captureDelay: parseInt(s.DELAY_MS) || 5000,
        zoomScale: s.ZOOM_SCALE || '50%',
        viewportWidth: parseInt(s.VIEWPORT_WIDTH) || 1366,
        viewportHeight: parseInt(s.VIEWPORT_HEIGHT) || 768,
        headless: String(s.HEADLESS_MODE).toUpperCase() === 'TRUE',
        usernameSelector: s.CSS_USERNAME || '',
        passwordSelector: s.CSS_PASSWORD || '',
        loginButtonSelector: s.CSS_LOGIN_BTN || ''
      };
      screenshotService.saveSettings(sheetSettings);
    }

    let targets = sheetData.data;

    // Filter if specific categories are selected
    if (ids && Array.isArray(ids) && ids.length > 0) {
      targets = targets.filter(item => ids.includes(item.id));
    }

    if (targets.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid category URLs selected for capture.' });
    }

    // Start sequential screenshot runner
    const started = await screenshotService.startQueue(targets, shift || 'Pagi');
    if (started) {
      res.json({ success: true, message: `Screenshot queue started for ${targets.length} items (${shift || 'Pagi'} Shift).` });
    } else {
      res.status(500).json({ success: false, error: 'Failed to start screenshot queue.' });
    }

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Trigger single manual capture
app.post('/api/capture/single', async (req, res) => {
  const { id, name, url, shift } = req.body;
  const scriptUrl = screenshotService.settings.appsScriptUrl;

  if (!scriptUrl) {
    return res.status(400).json({ 
      success: false, 
      error: 'Google Sheet Web App URL must be configured before capturing!' 
    });
  }

  if (screenshotService.isProcessing) {
    return res.status(400).json({ success: false, error: 'Browser is busy running another process. Please wait.' });
  }

  // Run single capture asynchronously
  screenshotService.captureSingle(id, name, url, shift || 'Pagi')
    .then(resObj => {
      // Completed in background, logged already
    })
    .catch(err => {
      console.error(err);
    });

  res.json({ success: true, message: `Triggered capture for ${name} (${shift || 'Pagi'} Shift). Monitor terminal logs.` });
});

// POST Stop Queue
app.post('/api/stop', (req, res) => {
  if (!screenshotService.isProcessing) {
    return res.json({ success: true, message: 'Queue is already inactive.' });
  }
  screenshotService.stopQueue();
  res.json({ success: true, message: 'Requested screenshot queue to stop.' });
});

// POST Reset Login state
app.post('/api/reset-login', (req, res) => {
  screenshotService.resetLoginState();
  res.json({ success: true, message: 'Session login state has been reset.' });
});

/**
 * 4. REAL-TIME LOG SSE STREAM
 */
app.get('/api/logs/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send previous log history
  res.write(`event: history\ndata: ${JSON.stringify(screenshotService.logs)}\n\n`);
  
  sseClients.push(res);
  
  req.on('close', () => {
    sseClients = sseClients.filter(client => client !== res);
  });
});

/**
 * 5. ARSIP KALENDER HISTORY ENDPOINTS
 */
// GET History Dates Summary
app.get('/api/history/summary', async (req, res) => {
  const scriptUrl = screenshotService.settings.appsScriptUrl;
  if (!scriptUrl) {
    return res.json({ success: true, data: [] });
  }

  try {
    const response = await fetch(`${scriptUrl}?action=getHistoryDates&t=${Date.now()}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET History Daily Details
app.get('/api/history/details', async (req, res) => {
  const { date, shift } = req.query;
  const scriptUrl = screenshotService.settings.appsScriptUrl;
  if (!scriptUrl) {
    return res.status(400).json({ success: false, error: 'Google sheet is not set up' });
  }

  try {
    const response = await fetch(`${scriptUrl}?action=getHistoryDetails&date=${date}&shift=${shift}&t=${Date.now()}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` AUTO SCREENSHOT DASHBOARD SERVER IS RUNNING`);
  console.log(` Port: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
