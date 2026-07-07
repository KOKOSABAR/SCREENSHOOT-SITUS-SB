/**
 * Google Apps Script for Website Auto-Screenshot Dashboard (History, Dual Shift & Settings Sync Version)
 * Copy and paste this code into Extensions > Apps Script in your Google Sheet.
 * Pastikan untuk MENGHAPUS SEMUA KODE LAMA di editor sebelum menempelkan kode ini.
 * Then deploy it as a Web App: 
 *   - Execute as: Me
 *   - Who has access: Anyone
 */

// Default categories to initialize the spreadsheet
var DEFAULT_CATEGORIES = [
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

// Default configurations inside Settings sheet
var DEFAULT_SETTINGS = [
  {"key": "AUTO_LOGIN_USERNAME", "value": "", "description": "USERNAME UNTUK LOGIN OTOMATIS KE WEBSITE"},
  {"key": "AUTO_LOGIN_PASSWORD", "value": "", "description": "PASSWORD UNTUK LOGIN OTOMATIS KE WEBSITE"},
  {"key": "DELAY_MS", "value": "5000", "description": "DELAY (MILIDETIK) TUNGGU BUKA WEBSITE SEBELUM SCREENSHOT"},
  {"key": "ZOOM_SCALE", "value": "50%", "description": "SKALA ZOOM TAMPILAN WEBSITE (50% / 100%)"},
  {"key": "VIEWPORT_WIDTH", "value": "1366", "description": "LEBAR LAYAR BROWSER VIRTUAL"},
  {"key": "VIEWPORT_HEIGHT", "value": "768", "description": "TINGGI LAYAR BROWSER VIRTUAL"},
  {"key": "HEADLESS_MODE", "value": "TRUE", "description": "JALANKAN CHROME TERSEMBUNYI (TRUE / FALSE)"},
  {"key": "CSS_USERNAME", "value": "", "description": "SELECTOR CSS KUSTOM INPUT USERNAME (OPSIONAL)"},
  {"key": "CSS_PASSWORD", "value": "", "description": "SELECTOR CSS KUSTOM INPUT PASSWORD (OPSIONAL)"},
  {"key": "CSS_LOGIN_BTN", "value": "", "description": "SELECTOR CSS KUSTOM TOMBOL LOGIN (OPSIONAL)"}
];

// Sheet names
var SHEET_NAME = "Screenshots";
var HISTORY_SHEET_NAME = "Screenshot_History";
var SETTINGS_SHEET_NAME = "Settings";

/**
 * Handle GET requests: Retrieve active values, history lists, daily details, or settings.
 */
function doGet(e) {
  try {
    var action = e.parameter.action;
    
    if (action === "getHistoryDates") {
      var summary = getHistoryDatesSummary();
      return createJsonResponse({ success: true, data: summary });
    }
    
    else if (action === "getHistoryDetails") {
      var dateStr = e.parameter.date; // yyyy-mm-dd
      var shiftStr = e.parameter.shift; // Pagi / Malam
      var details = getHistoryDetails(dateStr, shiftStr);
      return createJsonResponse({ success: true, data: details });
    }
    
    // Default GET: Return current active sheet data compiled on-the-fly and Settings
    var data = getActiveDashboardData();
    var settings = getSettingsData();
    return createJsonResponse({ success: true, data: data, settings: settings });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Handle POST requests: Update urls, settings, or upload new screenshots.
 */
function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var sheet = getOrCreateSheet();

    if (action === "updateUrl") {
      var id = postData.id;
      var url = postData.url;
      var row = findRowById(sheet, id);
      
      if (row > 0) {
        sheet.getRange(row, 3).setValue(url); // Column C
        return createJsonResponse({ success: true, message: "URL updated for ID " + id });
      } else {
        return createJsonResponse({ success: false, error: "Category ID " + id + " not found." });
      }
    }

    else if (action === "addCategory") {
      var newId   = postData.id;
      var newName = postData.name;
      var newUrl  = postData.url || "";
      // Check if ID already exists — update URL if so
      var existingRow = findRowById(sheet, newId);
      if (existingRow > 0) {
        sheet.getRange(existingRow, 2).setValue(newName);
        sheet.getRange(existingRow, 3).setValue(newUrl);
        return createJsonResponse({ success: true, message: "Category " + newId + " updated in sheet." });
      }
      // Append new row at position 2 (below header) to keep it at the top
      sheet.insertRowBefore(2);
      sheet.getRange(2, 1).setValue(newId);
      sheet.getRange(2, 2).setValue(newName);
      sheet.getRange(2, 3).setValue(newUrl);
      return createJsonResponse({ success: true, message: "Category " + newId + " added to sheet." });
    }
    
    else if (action === "updateSettings") {
      var incomingSettings = postData.settings;
      saveSettingsData(incomingSettings);
      return createJsonResponse({ success: true, message: "Settings synchronized successfully on Google Sheets." });
    }
    
    else if (action === "updateScreenshot") {
      var id = postData.id;
      var status = postData.status;
      var timestamp = postData.timestamp || new Date().toISOString();
      var imageBase64 = postData.image || "";  // Base64 PNG dari Node.js
      var shift = postData.shift || "Pagi";

      // Find Category Name and URL config from screenshots sheet
      var name = id;
      var url = "";
      var row = findRowById(sheet, id);
      if (row > 0) {
        name = sheet.getRange(row, 2).getValue();
        url = sheet.getRange(row, 3).getValue();
      }

      // Upload gambar ke Google Drive
      var fileUrl = "";
      if (imageBase64 && status === "Success") {
        try {
          var folder = getOrCreateDriveFolder();
          var filename = id + "_" + shift + "_" + new Date().getTime() + ".png";
          var blob = Utilities.newBlob(Utilities.base64Decode(imageBase64), "image/png", filename);
          var file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          fileUrl = file.getUrl();
        } catch (driveErr) {
          console.error("Drive upload failed: " + driveErr.toString());
          // Tetap lanjut meski Drive gagal
        }
      }

      // Simpan ke tab harian
      try {
        var localDateStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
        var dateSheet = getOrCreateDateSheet(localDateStr);
        dateSheet.appendRow([timestamp, shift, id, name, url, status, fileUrl]);
      } catch (histErr) {
        console.error("Failed writing to daily history log: " + histErr.toString());
      }

      return createJsonResponse({ 
        success: true, 
        message: "Screenshot status updated for ID " + id + " (" + shift + ")", 
        screenshotUrl: fileUrl
      });
    }

    return createJsonResponse({ success: false, error: "Invalid action type." });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Get the target active Sheet, populating defaults.
 */
function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    
    var headers = [
      "Category ID", 
      "Category Name", 
      "URL Link Website"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#3b82f6");
    headerRange.setFontColor("#ffffff");
    headerRange.setHorizontalAlignment("center");
    
    var rows = [];
    for (var i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      var item = DEFAULT_CATEGORIES[i];
      rows.push([
        item.id,
        item.name,
        item.url
      ]);
    }
    
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    sheet.autoResizeColumns(1, headers.length);
  }
  
  return sheet;
}

/**
 * Get or create a separate Sheet tab for the specific date.
 */
function getOrCreateDateSheet(dateStr) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(dateStr);
  
  if (!sheet) {
    sheet = ss.insertSheet(dateStr);
    var headers = [
      "Timestamp",
      "Shift",
      "Category ID",
      "Category Name",
      "URL Link Website",
      "Status",
      "Screenshot Link"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#059669"); // Emerald/Green color
    headerRange.setFontColor("#ffffff");
    headerRange.setHorizontalAlignment("center");
    
    sheet.autoResizeColumns(1, headers.length);
  }
  return sheet;
}

/**
 * Get or create Settings Sheet in Google Sheets.
 */
function getOrCreateSettingsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SETTINGS_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SETTINGS_SHEET_NAME);
  }
  
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    var headers = ["Setting Key", "Setting Value", "Description"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#f59e0b"); // Amber color
    headerRange.setFontColor("#ffffff");
    headerRange.setHorizontalAlignment("center");
    
    var rows = [];
    for (var i = 0; i < DEFAULT_SETTINGS.length; i++) {
      var item = DEFAULT_SETTINGS[i];
      rows.push([item.key, item.value, item.description]);
    }
    sheet.getRange(2, 1, rows.length, 3).setValues(rows);
    sheet.autoResizeColumns(1, headers.length);
  }
  return sheet;
}

/**
 * Get Settings as a single Key-Value JavaScript Object
 */
function getSettingsData() {
  var sheet = getOrCreateSettingsSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return {};
  
  var values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  var settings = {};
  for (var i = 0; i < values.length; i++) {
    var key = values[i][0];
    var val = values[i][1];
    if (key) {
      settings[key] = (val !== null && val !== undefined) ? val.toString() : "";
    }
  }
  return settings;
}

/**
 * Save settings from local server into Settings sheet rows
 */
function saveSettingsData(settingsObj) {
  var sheet = getOrCreateSettingsSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  
  var range = sheet.getRange(2, 1, lastRow - 1, 2);
  var values = range.getValues();
  
  for (var i = 0; i < values.length; i++) {
    var key = values[i][0];
    if (settingsObj.hasOwnProperty(key)) {
      values[i][1] = settingsObj[key];
    }
  }
  range.setValues(values);
}

/**
 * Read current active grid data by merging configurations with today's daily sheet logs.
 */
function getActiveDashboardData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet = getOrCreateSheet();
  var lastRow = configSheet.getLastRow();
  if (lastRow < 2) return [];
  
  var configValues = configSheet.getRange(2, 1, lastRow - 1, 3).getValues();
  
  var localDateStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  var todaySheet = ss.getSheetByName(localDateStr);
  
  var todayMap = {};
  if (todaySheet) {
    var todayLast = todaySheet.getLastRow();
    if (todayLast >= 2) {
      var todayValues = todaySheet.getRange(2, 1, todayLast - 1, 7).getValues(); // Timestamp, Shift, ID, Name, URL, Status, Link
      for (var i = 0; i < todayValues.length; i++) {
        var row = todayValues[i];
        var shift = row[1];
        var id = row[2];
        var status = row[5];
        var timestamp = row[0];
        var screenshotUrl = row[6];
        
        var key = id + "_" + shift;
        todayMap[key] = {
          status: status,
          timestamp: timestamp,
          screenshotUrl: screenshotUrl
        };
      }
    }
  }
  
  var result = [];
  for (var i = 0; i < configValues.length; i++) {
    var id = configValues[i][0];
    var name = configValues[i][1];
    var url = configValues[i][2];
    
    var pagiKey = id + "_Pagi";
    var malamKey = id + "_Malam";
    
    var pagiData = todayMap[pagiKey] || { status: "Idle", timestamp: "", screenshotUrl: "" };
    var malamData = todayMap[malamKey] || { status: "Idle", timestamp: "", screenshotUrl: "" };
    
    result.push({
      id: id,
      name: name,
      url: url,
      statusPagi: pagiData.status,
      lastCapturedPagi: pagiData.timestamp ? pagiData.timestamp.toString() : "",
      screenshotUrlPagi: pagiData.screenshotUrl,
      statusMalam: malamData.status,
      lastCapturedMalam: malamData.timestamp ? malamData.timestamp.toString() : "",
      screenshotUrlMalam: malamData.screenshotUrl
    });
  }
  return result;
}

/**
 * Read unique date summaries by scanning all sheet tabs matching date pattern (YYYY-MM-DD).
 */
function getHistoryDatesSummary() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var summaryList = [];
  var datePattern = /^\d{4}-\d{2}-\d{2}$/;
  
  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var name = sheet.getName();
    
    if (datePattern.test(name)) {
      var lastRow = sheet.getLastRow();
      if (lastRow < 2) continue;
      
      var values = sheet.getRange(2, 2, lastRow - 1, 5).getValues(); // Shift (Col 2), ID (Col 3), Name (Col 4), URL (Col 5), Status (Col 6 / Index 4 in range)
      var pagiSuccess = 0, pagiFailed = 0;
      var malamSuccess = 0, malamFailed = 0;
      
      for (var i = 0; i < values.length; i++) {
        var row = values[i];
        var shift = row[0];
        var status = row[4];
        
        if (shift === "Pagi") {
          if (status === "Success") pagiSuccess++;
          else if (status === "Failed") pagiFailed++;
        } else if (shift === "Malam") {
          if (status === "Success") malamSuccess++;
          else if (status === "Failed") malamFailed++;
        }
      }
      
      if (pagiSuccess > 0 || pagiFailed > 0) {
        summaryList.push({
          date: name,
          shift: "Pagi",
          successCount: pagiSuccess,
          failedCount: pagiFailed
        });
      }
      if (malamSuccess > 0 || malamFailed > 0) {
        summaryList.push({
          date: name,
          shift: "Malam",
          successCount: malamSuccess,
          failedCount: malamFailed
        });
      }
    }
  }
  return summaryList;
}

/**
 * Get screenshot entries from the specific date sheet matching dateVal (YYYY-MM-DD) and shiftVal.
 */
function getHistoryDetails(dateVal, shiftVal) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(dateVal);
  if (!sheet) return [];
  
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  
  var values = sheet.getRange(2, 1, lastRow - 1, 7).getValues(); // Timestamp, Shift, ID, Name, URL, Status, Link
  var result = [];
  
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var rowShift = row[1];
    
    if (rowShift === shiftVal) {
      result.push({
        timestamp: row[0],
        id: row[2],
        name: row[3],
        url: row[4],
        status: row[5],
        screenshotUrl: row[6]
      });
    }
  }
  return result;
}

/**
 * Find row index of the given Category ID (Column A)
 */
function findRowById(sheet, id) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) {
      return i + 2;
    }
  }
  return -1;
}

/**
 * Get or create the designated folder ID from user for screenshots.
 */
function getOrCreateDriveFolder() {
  var folderId = ""; // Empty to use user's own Drive
  var folderName = "Dashboard Screenshots";
  
  if (folderId && folderId !== "") {
    try {
      var folder = DriveApp.getFolderById(folderId);
      // Verify we can write to it
      folder.getName();
      return folder;
    } catch (e) {
      console.warn("Drive folder by ID (" + folderId + ") inaccessible: " + e.toString() + ". Falling back to local Drive root.");
    }
  }
  
  // Search for folder by name in My Drive
  try {
    var folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      var existingFolder = folders.next();
      existingFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return existingFolder;
    }
  } catch (e2) {
    console.warn("getFoldersByName failed: " + e2.toString());
  }
  
  // Create a brand new folder in active user's Drive
  try {
    var newFolder = DriveApp.createFolder(folderName);
    newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    console.log("Created brand new folder in My Drive: " + folderName + " (ID: " + newFolder.getId() + ")");
    return newFolder;
  } catch (e3) {
    console.error("Failed to create Drive folder: " + e3.toString());
    throw new Error("Google Drive access failed. Please run this function manually once in Apps Script editor to authorize.");
  }
}

/**
 * Formats API response as JSON
 */
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
