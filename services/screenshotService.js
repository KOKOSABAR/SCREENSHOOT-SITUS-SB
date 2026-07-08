const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class ScreenshotService extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.isProcessing = false;
    this.stopRequested = false;
    this.activeId = null;
    this.browser = null;
    this.page = null;
    this.wdbosLoggedIn = false;
    
    // In-memory logs cache (keep last 200 logs)
    this.logs = [];
    
    // Default settings
    this.settings = {
      appsScriptUrl: 'https://script.google.com/macros/s/AKfycbzUIozxHAv1elXnIrPGq8rAtR5nLojg9Ct2JJ3cG8VpYQFxCBvzgZT3S1-NBVOMr7WJ/exec',
      username: '',
      password: '',
      captureDelay: 5000,
      viewportWidth: 1366,
      viewportHeight: 768,
      headless: true,
      zoomScale: 0.5,
      usernameSelector: '',
      passwordSelector: '',
      loginButtonSelector: ''
    };

    this.loadSettings();
  }

  // Helper to parse zoom values like "50%", "0.5", or "0,5" safely
  parseZoomScale(value) {
    if (!value) return 1.0;
    let str = String(value).trim();
    if (str.endsWith('%')) {
      const val = parseFloat(str) / 100;
      return isNaN(val) ? 1.0 : val;
    }
    const val = parseFloat(str);
    return isNaN(val) ? 1.0 : val;
  }

  // Log message helper
  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logObj = { timestamp, message, type };
    this.logs.push(logObj);
    if (this.logs.length > 200) this.logs.shift();
    this.emit('log', logObj);
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  // Resolve path to settings.json dynamically (supports read-write AppData on packaged Electron)
  getSettingsPath() {
    // Check if running inside Electron main or renderer process
    const isElectron = (process.versions && process.versions.electron) || process.env.ELECTRON_RUN_AS_NODE;
    if (isElectron) {
      try {
        const { app } = require('electron');
        // If app is not ready/available in this context, fall back safely
        const userDataPath = app ? app.getPath('userData') : path.join(process.env.APPDATA || process.env.HOME, 'AutoScreenshotDashboard');
        return path.join(userDataPath, 'settings.json');
      } catch (e) {
        // Safe fallback inside user profile directory
        const userHome = process.env.APPDATA || process.env.HOME || '.';
        return path.join(userHome, 'AutoScreenshotDashboard', 'settings.json');
      }
    }
    return path.join(__dirname, '../data/settings.json');
  }

  // Load settings from file
  loadSettings() {
    const settingsPath = this.getSettingsPath();
    try {
      if (fs.existsSync(settingsPath)) {
        const raw = fs.readFileSync(settingsPath, 'utf8');
        const parsed = JSON.parse(raw);
        this.settings = { ...this.settings, ...parsed };
        this.log('Settings loaded successfully.');
      } else {
        // Create default settings folder and file
        const dataDir = path.dirname(settingsPath);
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        this.saveSettings(this.settings);
      }
    } catch (err) {
      this.log(`Error loading settings: ${err.message}`, 'error');
    }
  }

  // Save settings to file
  saveSettings(newSettings) {
    const settingsPath = this.getSettingsPath();
    try {
      this.settings = { ...this.settings, ...newSettings };
      const dataDir = path.dirname(settingsPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(settingsPath, JSON.stringify(this.settings, null, 2), 'utf8');
      this.log('Settings saved to disk.');
      return true;
    } catch (err) {
      this.log(`Error saving settings: ${err.message}`, 'error');
      return false;
    }
  }

  // Reset login state (forces log-in on next wdbos screenshot)
  resetLoginState() {
    this.wdbosLoggedIn = false;
    this.log('Login state has been reset.');
  }

  // Initialize Puppeteer browser & page
  async initBrowser() {
    if (this.browser) return;

    // Gracefully handle Vercel Serverless platform limit
    if (process.env.VERCEL) {
      throw new Error("Vercel Serverless environment detected. Puppeteer screenshot capture is not supported directly on Vercel's free serverless functions (max 10s execution timeout). Please run this server locally on your PC or deploy to Railway/Render to run the screenshot bot.");
    }

    const w = parseInt(this.settings.viewportWidth) || 1366;
    const h = parseInt(this.settings.viewportHeight) || 768;

    this.log('Launching browser (with Stealth plugin enabled)...');
    try {
      this.browser = await puppeteer.launch({
        headless: this.settings.headless === true || this.settings.headless === 'true' ? true : false,
        ignoreDefaultArgs: ['--enable-automation'],
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-blink-features=AutomationControlled',
          '--window-size=' + w + ',' + h
        ],
        defaultViewport: {
          width: w,
          height: h,
          deviceScaleFactor: 2 // High-density (Retina/DPI) rendering for crystal-clear, non-blurry screenshots
        }
      });
      
      const pages = await this.browser.pages();
      this.page = pages.length > 0 ? pages[0] : await this.browser.newPage();
      
      // Set User-Agent to mimic a real desktop Chrome browser
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
      
      // Prevent browser dialog alerts from blocking the script
      this.page.on('dialog', async dialog => {
        this.log(`Dismissing page alert: "${dialog.message()}"`, 'warning');
        await dialog.dismiss();
      });

      this.log('Browser initialized successfully.');
    } catch (err) {
      this.log(`Failed to launch browser: ${err.message}`, 'error');
      throw err;
    }
  }

  // Close browser instance
  async closeBrowser() {
    if (this.browser) {
      this.log('Closing browser...');
      try {
        await this.browser.close();
      } catch (e) {}
      this.browser = null;
      this.page = null;
      this.wdbosLoggedIn = false;
      this.log('Browser closed.');
    }
  }

  // Start the screenshot queue
  async startQueue(categories, shift = 'Pagi') {
    if (this.isProcessing) {
      this.log('Queue is already running!', 'warning');
      return false;
    }

    if (!this.settings.appsScriptUrl) {
      this.log('Cannot start queue: Google Apps Script Web App URL is not configured.', 'error');
      return false;
    }

    this.queue = [...categories];
    this.currentShift = shift;
    this.isProcessing = true;
    this.stopRequested = false;
    this.log(`Starting queue for ${this.queue.length} items (${shift} Shift)...`);
    
    // Run async loop
    this.processQueue().catch(err => {
      this.log(`Queue processing error: ${err.message}`, 'error');
    });

    return true;
  }

  // Stop current screenshot run
  stopQueue() {
    if (!this.isProcessing) return;
    this.log('Stop requested. Completing current item and stopping...', 'warning');
    this.stopRequested = true;
  }

  // Main queue processing loop
  async processQueue() {
    try {
      await this.initBrowser();

      while (this.queue.length > 0 && !this.stopRequested) {
        const item = this.queue.shift();
        this.activeId = item.id;
        
        this.emit('capture-start', { id: item.id, shift: this.currentShift });
        this.log(`[Queue] Processing: ${item.name}...`);
        
        if (!item.url) {
          this.log(`Skipping category "${item.name}" - no URL link provided.`, 'warning');
          await this.syncWithAppsScript(item.id, 'Failed', null, this.currentShift, 'No URL Link Website');
          this.emit('capture-complete', {
            id: item.id,
            status: 'Failed',
            screenshotUrl: '',
            shift: this.currentShift,
            lastCaptured: new Date().toISOString()
          });
          continue;
        }

        let attempts = 0;
        let success = false;
        let errorMsg = '';

        while (attempts < 2 && !success && !this.stopRequested) {
          attempts++;
          try {
            // Check if domain is wdbos90.com and requires login
            const isWdbos = item.url.includes('wdbos90.com');
            const hasCreds = this.settings.username && this.settings.password;

            if (isWdbos && hasCreds && !this.wdbosLoggedIn) {
              this.log(`Logging into wdbos90.com (Username: ${this.settings.username})...`);
              const loginSuccess = await this.performWdbosLogin();
              if (loginSuccess) {
                this.wdbosLoggedIn = true;
                this.log('Login successful! Saved session.');
              } else {
                throw new Error('Login failed. Selector not found or invalid credentials.');
              }
            }

            this.log(`Navigating to: ${item.url}`);
            
            // Navigate to URL
            await this.page.goto(item.url, {
              waitUntil: 'networkidle2',
              timeout: 45000
            });

            // Smart check: do we need to log in on this page?
            try {
              const needsLogin = await this.page.evaluate(() => {
                const inputs = Array.from(document.querySelectorAll('input'));
                const hasPassword = inputs.some(i => i.type === 'password' || (i.placeholder || '').toLowerCase().includes('sandi') || (i.placeholder || '').toLowerCase().includes('password'));
                const text = (document.body && document.body.innerText) || '';
                const hasLoggedInIndicator = text.includes('Keluar') || text.includes('Logout') || text.includes('Saldo') || text.includes('Profil');
                return hasPassword && !hasLoggedInIndicator;
              });

              if (needsLogin && this.settings.username && this.settings.password) {
                this.log('Login prompt detected on target page. Performing automated session recovery...');
                const loginSuccess = await this.performLoginOnCurrentPage();
                if (loginSuccess) {
                  this.wdbosLoggedIn = true;
                  this.log(`Re-navigating to target URL after session recovery: ${item.url}`);
                  await this.page.goto(item.url, { waitUntil: 'networkidle2', timeout: 30000 });
                }
              }
            } catch (loginCheckErr) {
              this.log(`Login check skipped: ${loginCheckErr.message}`, 'warning');
            }

            // Additional wait to let AJAX / Canvas load (configurable)
            const delay = parseInt(this.settings.captureDelay) || 5000;
            this.log(`Waiting ${delay}ms for page components to render...`);
            await new Promise(r => setTimeout(r, delay));

            // If page contains an iframe, wait a bit longer for sub-lobby components
            const hasIframe = await this.page.evaluate(() => {
              return document.querySelectorAll('iframe').length > 0;
            });
            if (hasIframe) {
              this.log('Detected iframe on page. Waiting an additional 3000ms for sub-lobby content rendering...');
              await new Promise(r => setTimeout(r, 3000));
            }

            // Hide scrollbars for cleaner screenshot (optional but nice)
            try {
              await this.page.evaluate(() => {
                document.body.style.overflow = 'hidden';
              });
            } catch (e) {}

            // Remove advertisement popups and overlays before capturing
            await this.removePopups();

            // Set zoom scale (default 50%)
            const zoomVal = this.parseZoomScale(this.settings.zoomScale);
            await this.setPageScale(zoomVal);

            // Take screenshot as base64 (for Drive upload)
            this.log(`Taking screenshot for ${item.name}...`);
            const screenshotBase64 = await this.page.screenshot({
              type: 'png',
              encoding: 'base64',
              fullPage: false
            });

            // Send base64 to Apps Script — it uploads to Google Drive and returns Drive URL
            this.log('Uploading screenshot to Google Drive via Apps Script...');
            const syncResult = await this.syncWithAppsScript(item.id, 'Success', screenshotBase64, this.currentShift);

            if (syncResult && syncResult.success) {
              this.log(`Successfully captured and synced ${item.name} (${this.currentShift})!`, 'success');
              this.emit('capture-complete', {
                id: item.id,
                status: 'Success',
                screenshotUrl: syncResult.screenshotUrl || '',
                shift: this.currentShift,
                lastCaptured: new Date().toISOString()
              });
              success = true;
            } else {
              throw new Error(syncResult ? syncResult.error : 'Sync response failed');
            }

          } catch (err) {
            errorMsg = err.message;
            this.log(`Attempt ${attempts} failed for "${item.name}": ${err.message}`, 'warning');
            
            // If login state was corrupted, reset it so we try logging in again next attempt
            if (item.url.includes('wdbos90.com')) {
              this.wdbosLoggedIn = false;
            }
            
            // Wait before retry
            if (attempts < 2 && !this.stopRequested) {
              await new Promise(r => setTimeout(r, 3000));
            }
          }
        }

        if (!success && !this.stopRequested) {
          this.log(`Failed to capture ${item.name} after all attempts.`, 'error');
          await this.syncWithAppsScript(item.id, 'Failed', null, this.currentShift, errorMsg);
          this.emit('capture-complete', {
            id: item.id,
            status: 'Failed',
            screenshotUrl: '',
            shift: this.currentShift,
            lastCaptured: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      this.log(`Fatal queue runner error: ${err.message}`, 'error');
    } finally {
      this.isProcessing = false;
      this.stopRequested = false;
      this.activeId = null;
      
      // Keep browser open to preserve sessions, or close on finish if desired.
      // Keeping it open is better for speed, but let's close it to release RAM if the queue is fully done.
      await this.closeBrowser();
      this.log('Screenshot queue process finished.');
      this.emit('status-change', { isProcessing: false });
    }
  }

  // Smart login finder for wdbos90.com
  async performWdbosLogin() {
    // Navigate to wdbos homepage
    await this.page.goto('https://wdbos90.com/#/index', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Let React/SPA router load
    await new Promise(r => setTimeout(r, 5000));

    // 1. Check if already logged in (if logout buttons are visible)
    const bodyText = await this.page.evaluate(() => document.body.innerText);
    if (bodyText.includes('Keluar') || bodyText.includes('Logout') || bodyText.includes('Saldo') || bodyText.includes('Profil')) {
      this.log('Already authenticated on wdbos90.com. Skipping login.');
      return true;
    }

    // 2. Locate fields. Allow custom selector overrides if configured, else auto-detect
    const usernameSel = this.settings.usernameSelector || null;
    const passwordSel = this.settings.passwordSelector || null;
    const loginBtnSel = this.settings.loginButtonSelector || null;

    let userField = null;
    let passField = null;

    if (usernameSel && passwordSel) {
      try {
        userField = await this.page.waitForSelector(usernameSel, { timeout: 4000 });
        passField = await this.page.waitForSelector(passwordSel, { timeout: 4000 });
      } catch (e) {
        this.log('Custom selectors failed. Falling back to auto-detection.', 'warning');
      }
    }

    // Auto-detect if custom selectors failed or weren't provided
    if (!userField || !passField) {
      const inputs = await this.page.$$('input');
      for (const input of inputs) {
        const type = await this.page.evaluate(el => el.type || '', input);
        const placeholder = await this.page.evaluate(el => el.placeholder || '', input);
        const name = await this.page.evaluate(el => el.name || '', input);

        const typeLower = type.toLowerCase();
        const phLower = placeholder.toLowerCase();
        const nameLower = name.toLowerCase();

        if (typeLower === 'password' || phLower.includes('sandi') || phLower.includes('password') || nameLower.includes('pass')) {
          passField = input;
        } else if (typeLower === 'text' || phLower.includes('username') || phLower.includes('user') || phLower.includes('nama') || nameLower.includes('user')) {
          userField = input;
        }
      }
    }

    if (!userField || !passField) {
      // Sometimes login fields are inside a modal. Let's see if there is a "Masuk" or "Login" button to open the modal
      this.log('Login fields not directly visible. Searching for a "Login" or "Masuk" button to trigger login form...', 'warning');
      
      let triggerBtn = null;
      const elements = await this.page.$$('button, a, div');
      for (const el of elements) {
        const text = await this.page.evaluate(e => e.textContent || '', el);
        const textTrim = text.trim();
        if (textTrim === 'Masuk' || textTrim === 'Login' || textTrim === 'Sign In') {
          triggerBtn = el;
          break;
        }
      }

      if (triggerBtn) {
        this.log('Clicking login modal trigger...');
        await triggerBtn.click();
        await new Promise(r => setTimeout(r, 2000)); // wait for modal transition
        
        // Re-attempt finding inputs
        const inputs = await this.page.$$('input');
        for (const input of inputs) {
          const type = await this.page.evaluate(el => el.type || '', input);
          const placeholder = await this.page.evaluate(el => el.placeholder || '', input);
          const typeLower = type.toLowerCase();
          const phLower = placeholder.toLowerCase();
          if (typeLower === 'password' || phLower.includes('sandi') || phLower.includes('password')) {
            passField = input;
          } else if (typeLower === 'text' || phLower.includes('username') || phLower.includes('user')) {
            userField = input;
          }
        }
      }
    }

    if (userField && passField) {
      // Focus and enter credentials
      await userField.click();
      await userField.focus();
      await this.page.evaluate(el => el.value = '', userField); // clear
      await userField.type(this.settings.username, { delay: 50 });

      await passField.click();
      await passField.focus();
      await this.page.evaluate(el => el.value = '', passField); // clear
      await passField.type(this.settings.password, { delay: 50 });

      // Click login button
      let loginBtn = null;
      if (loginBtnSel) {
        try {
          loginBtn = await this.page.waitForSelector(loginBtnSel, { timeout: 3000 });
        } catch (e) {}
      }

      if (!loginBtn) {
        const buttons = await this.page.$$('button, input[type="submit"], a');
        for (const btn of buttons) {
          const text = await this.page.evaluate(el => el.textContent || el.value || '', btn);
          const cls = await this.page.evaluate(el => el.className || '', btn);
          
          const textLower = text.toLowerCase();
          const clsLower = cls.toLowerCase();

          if (
            textLower.includes('masuk') || 
            textLower.includes('login') || 
            textLower.includes('sign') ||
            clsLower.includes('login') || 
            clsLower.includes('submit')
          ) {
            loginBtn = btn;
            break;
          }
        }
      }

      if (loginBtn) {
        this.log('Clicking the login submit button...');
        await loginBtn.click();
      } else {
        this.log('Login button not detected. Sending Enter key...');
        await this.page.keyboard.press('Enter');
      }

      // Wait for navigation / session establishment
      await new Promise(r => setTimeout(r, 6000));
      return true;
    } else {
      this.log('Authentication fields could not be resolved.', 'error');
      return false;
    }
  }

  // Helper function to fill and login directly on the current active page
  // Uses page.evaluate() for all DOM interactions to avoid detached node errors
  async performLoginOnCurrentPage() {
    try {
      const username = this.settings.username;
      const password = this.settings.password;
      const usernameSel = this.settings.usernameSelector || '';
      const passwordSel = this.settings.passwordSelector || '';
      const loginBtnSel = this.settings.loginButtonSelector || '';

      // Fill username and password entirely within page context to avoid detached handles
      const filled = await this.page.evaluate((uname, pass, uSel, pSel) => {
        let userField = uSel ? document.querySelector(uSel) : null;
        let passField = pSel ? document.querySelector(pSel) : null;

        if (!userField || !passField) {
          const inputs = Array.from(document.querySelectorAll('input'));
          for (const input of inputs) {
            const typeL = (input.type || '').toLowerCase();
            const phL = (input.placeholder || '').toLowerCase();
            const nameL = (input.name || '').toLowerCase();

            if (typeL === 'password' || phL.includes('sandi') || phL.includes('password') || nameL.includes('pass')) {
              passField = input;
            } else if (!userField && (typeL === 'text' || phL.includes('username') || phL.includes('user') || phL.includes('nama') || nameL.includes('user'))) {
              userField = input;
            }
          }
        }

        if (!userField || !passField) return false;

        // Set values using native setter to trigger Vue/React bindings
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(userField, uname);
        userField.dispatchEvent(new Event('input', { bubbles: true }));
        userField.dispatchEvent(new Event('change', { bubbles: true }));

        nativeInputValueSetter.call(passField, pass);
        passField.dispatchEvent(new Event('input', { bubbles: true }));
        passField.dispatchEvent(new Event('change', { bubbles: true }));

        return true;
      }, username, password, usernameSel, passwordSel);

      if (!filled) {
        this.log('Could not find login fields on current page.', 'warning');
        return false;
      }

      // Click submit button within page context
      await this.page.evaluate((btnSel) => {
        let loginBtn = btnSel ? document.querySelector(btnSel) : null;
        if (!loginBtn) {
          const candidates = Array.from(document.querySelectorAll('button, input[type="submit"], a'));
          loginBtn = candidates.find(el => {
            const textL = (el.textContent || el.value || '').toLowerCase();
            const clsL = (el.className || '').toLowerCase();
            return textL.includes('masuk') || textL.includes('login') || textL.includes('sign') ||
                   clsL.includes('login') || clsL.includes('submit');
          });
        }
        if (loginBtn) loginBtn.click();
        else document.activeElement.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', bubbles: true }));
      }, loginBtnSel);

      await new Promise(r => setTimeout(r, 6000));
      return true;
    } catch (err) {
      this.log(`Failed automated login on page: ${err.message}`, 'warning');
    }
    return false;
  }

  // Save screenshot buffer to local public/screenshots/ folder and return public URL
  async saveScreenshotLocally(id, shift, screenshotBuffer) {
    try {
      const screenshotsDir = path.join(__dirname, '..', 'public', 'screenshots');
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }
      const timestamp = Date.now();
      const filename = `${id}_${shift}_${timestamp}.png`;
      const filepath = path.join(screenshotsDir, filename);
      // Write buffer (base64 string or Buffer)
      const buf = Buffer.isBuffer(screenshotBuffer) ? screenshotBuffer : Buffer.from(screenshotBuffer, 'base64');
      fs.writeFileSync(filepath, buf);
      this.log(`Screenshot saved locally: /screenshots/${filename}`);
      return `/screenshots/${filename}`;
    } catch (err) {
      this.log(`Failed to save screenshot locally: ${err.message}`, 'error');
      return '';
    }
  }

  // Push status & base64 image to Google Sheets Web App (which uploads to Drive)
  async syncWithAppsScript(id, status, imageBase64 = null, shift = 'Pagi', errorMsg = '') {
    const url = this.settings.appsScriptUrl;
    if (!url) return { success: false, error: 'Apps Script URL not configured.' };

    const payload = {
      action: 'updateScreenshot',
      id: id,
      status: status,
      timestamp: new Date().toLocaleString('id-ID'),
      image: imageBase64,   // Base64 PNG — Apps Script uploads to Drive
      shift: shift
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const text = await response.text();
      
      // Log raw response for debugging
      this.log(`[Apps Script Response] ${text.substring(0, 300)}`);
      
      let json;
      try {
        json = JSON.parse(text);
      } catch (parseErr) {
        this.log(`Apps Script returned non-JSON: ${text.substring(0, 200)}`, 'error');
        return { success: false, error: 'Non-JSON response from Apps Script' };
      }
      
      if (json.screenshotUrl) {
        this.log(`Drive upload SUCCESS. File URL: ${json.screenshotUrl}`, 'success');
      } else {
        this.log(`Drive URL kosong dari Apps Script. Response: ${JSON.stringify(json)}`, 'warning');
      }
      return json;
    } catch (err) {
      this.log(`Google Sheet/Drive sync failed: ${err.message}`, 'error');
      return { success: false, error: err.message };
    }
  }

  // Single test capture of a given URL
  async captureSingle(id, urlName, url, shift = 'Pagi') {
    if (this.isProcessing) {
      this.log('Queue is currently active. Cannot run single capture.', 'warning');
      return false;
    }
    
    this.log(`Triggering single capture for ${urlName}...`);
    this.isProcessing = true;
    this.emit('capture-start', { id: id, shift: shift });
    
    try {
      await this.initBrowser();
      const isWdbos = url.includes('wdbos90.com');
      const hasCreds = this.settings.username && this.settings.password;

      if (isWdbos && hasCreds && !this.wdbosLoggedIn) {
        this.log(`Logging into wdbos90.com...`);
        const loginSuccess = await this.performWdbosLogin();
        if (loginSuccess) {
          this.wdbosLoggedIn = true;
        }
      }

      this.log(`Navigating to URL: ${url}`);
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

      // Smart check: do we need to log in on this page?
      const needsLogin = await this.page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        const hasPassword = inputs.some(i => i.type === 'password' || i.placeholder.includes('sandi') || i.placeholder.includes('password'));
        const text = document.body.innerText;
        const hasLoggedInIndicator = text.includes('Keluar') || text.includes('Logout') || text.includes('Saldo') || text.includes('Profil');
        return hasPassword && !hasLoggedInIndicator;
      });

      if (needsLogin && this.settings.username && this.settings.password) {
        this.log('Login prompt detected on target page. Performing automated session recovery...');
        const loginSuccess = await this.performLoginOnCurrentPage();
        if (loginSuccess) {
          this.wdbosLoggedIn = true;
          this.log(`Re-navigating to target URL after session recovery: ${url}`);
          await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        }
      }
      
      const delay = parseInt(this.settings.captureDelay) || 5000;
      await new Promise(r => setTimeout(r, delay));

      // If page contains an iframe, wait a bit longer for sub-lobby components
      const hasIframe = await this.page.evaluate(() => {
        return document.querySelectorAll('iframe').length > 0;
      });
      if (hasIframe) {
        this.log('Detected iframe on page. Waiting an additional 3000ms for sub-lobby content rendering...');
        await new Promise(r => setTimeout(r, 3000));
      }

      // Remove advertisement popups and overlays before capturing
      await this.removePopups();

      // Set zoom scale (default 50%)
      const zoomVal = this.parseZoomScale(this.settings.zoomScale);
      await this.setPageScale(zoomVal);

      // Take screenshot as base64 (for Drive upload)
      const screenshotBase64 = await this.page.screenshot({
        type: 'png',
        encoding: 'base64'
      });

      // Upload to Drive via Apps Script
      this.log('Uploading screenshot to Google Drive...');
      const res = await this.syncWithAppsScript(id, 'Success', screenshotBase64, shift);

      if (res && res.success) {
        this.log(`Single capture of ${urlName} completed successfully!`, 'success');
        this.emit('capture-complete', {
          id: id,
          status: 'Success',
          screenshotUrl: res.screenshotUrl || '',
          shift: shift,
          lastCaptured: new Date().toISOString()
        });
        return { success: true, screenshotUrl: res.screenshotUrl };
      } else {
        throw new Error(res ? res.error : 'Sync response failed');
      }

    } catch (err) {
      this.log(`Single capture failed: ${err.message}`, 'error');
      await this.syncWithAppsScript(id, 'Failed', null, shift, err.message);
      this.emit('capture-complete', {
        id: id,
        status: 'Failed',
        screenshotUrl: '',
        shift: shift,
        lastCaptured: new Date().toISOString()
      });
      return { success: false, error: err.message };
    } finally {
      this.isProcessing = false;
      await this.closeBrowser();
      this.emit('status-change', { isProcessing: false });
    }
  }

  // Helper function to automatically close and hide overlay banners/popups
  async removePopups() {
    if (!this.page) return;
    
    try {
      this.log('Checking and removing advertisement popups/overlays...');
      await this.page.evaluate(() => {
        // 1. Try to click standard close buttons
        const closeSelectors = [
          '.close', '[class*="close"]', '[class*="Close"]', 
          '.van-icon-cross', '.van-popup__close-icon',
          '.el-dialog__close', '.modal-close', '.popup-close',
          '[aria-label="Close"]', '[aria-label="close"]'
        ];
        
        closeSelectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              if (el && typeof el.click === 'function') {
                el.click();
              }
            });
          } catch(e) {}
        });

        // 2. Hide common overlay elements, masks, modals or popups
        const popupKeywords = [
          'van-popup', 'el-dialog', 'modal', 'popup', 'dialog', 
          'announcement', 'notice', 'popup-bg', 'modal-bg', 'overlay', 
          'mask', 'advertisement', 'promo'
        ];
        
        try {
          const allElements = document.querySelectorAll('*');
          allElements.forEach(el => {
            const className = el.className || '';
            const id = el.id || '';
            
            let style;
            try {
              style = window.getComputedStyle(el);
            } catch (e) {
              return;
            }
            
            const zIndex = parseInt(style.zIndex);

            let isPopup = false;
            if (typeof className === 'string') {
              isPopup = popupKeywords.some(kw => className.toLowerCase().includes(kw));
            } else if (className && typeof className.baseVal === 'string') {
              isPopup = popupKeywords.some(kw => className.baseVal.toLowerCase().includes(kw));
            }
            
            if (typeof id === 'string') {
              isPopup = isPopup || popupKeywords.some(kw => id.toLowerCase().includes(kw));
            }

            if (isPopup || (zIndex > 90 && (style.position === 'fixed' || style.position === 'absolute'))) {
              // Do not hide main container elements
              if (id !== 'app' && id !== 'root' && !el.contains(document.querySelector('#app')) && !el.contains(document.querySelector('#root'))) {
                el.style.setProperty('display', 'none', 'important');
              }
            }
          });
        } catch (e) {}
      });
      
      // Wait 600ms for animations/transitions to settle after closing/hiding
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      this.log(`Error removing popups: ${err.message}`, 'warning');
    }
  }

  // Helper function to scale (zoom) the page layout
  async setPageScale(scale) {
    if (this.page) {
      try {
        await this.page.evaluate((s) => {
          document.documentElement.style.zoom = s;
        }, scale);
        this.log('Page layout zoomed natively to ' + Math.round(scale * 100) + '% via CSS zoom.');
      } catch (err) {
        this.log(`Error applying zoom: ${err.message}`, 'warning');
      }
    }
    await new Promise(r => setTimeout(r, 800));
  }
}

// Export single instance
module.exports = new ScreenshotService();
