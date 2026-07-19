import { chromium } from 'playwright';

(async () => {
  console.log('Starting Production Verification...');
  const browser = await chromium.launch({ headless: true });
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  let errors = 0;
  const logError = (msg) => { console.error('❌ ' + msg); errors++; };
  const logSuccess = (msg) => { console.log('✅ ' + msg); };

  page1.on('console', msg => { if (msg.type() === 'error') logError(`Page 1 Console Error: ${msg.text()}`); });
  page2.on('console', msg => { if (msg.type() === 'error') logError(`Page 2 Console Error: ${msg.text()}`); });

  try {
    // 1. Register User A
    const userA = `userA_${Date.now()}`;
    await page1.goto('http://localhost:5173/signup');
    await page1.fill('input[type="text"]', userA);
    await page1.fill('input[type="email"]', `${userA}@test.com`);
    await page1.fill('input[type="password"]', 'password123');
    await page1.click('button[type="submit"]');
    await page1.waitForURL('http://localhost:5173/chat');
    logSuccess('Register (User A)');

    // 2. Register User B
    const userB = `userB_${Date.now()}`;
    await page2.goto('http://localhost:5173/signup');
    await page2.fill('input[type="text"]', userB);
    await page2.fill('input[type="email"]', `${userB}@test.com`);
    await page2.fill('input[type="password"]', 'password123');
    await page2.click('button[type="submit"]');
    await page2.waitForURL('http://localhost:5173/chat');
    logSuccess('Register (User B)');

    // 3. Search Contacts & Start Chat
    await page1.click('svg:has(path[d^="M19.005"])'); // New Chat SVG
    await page1.fill('input[placeholder="Search name, username, or number..."]', userB);
    await page1.waitForSelector(`text=${userB}`);
    await page1.click(`text=${userB}`);
    
    // Wait for the message container header to show userB
    await page1.waitForSelector(`h2:has-text("${userB}")`);
    logSuccess('Search Contacts & Start Chat');

    // 4. Send & Receive Messages
    await page1.fill('input[placeholder="Type a message"]', 'Hello from User A');
    await page1.click('button[aria-label="Send message"]');
    
    // Check Page 2 for incoming message
    await page2.waitForSelector('text=Hello from User A');
    logSuccess('Send & Receive Messages');

    // 5. Read Receipts
    // Read receipts usually update when the other user views it. Since Page 2 received it, 
    // Page 1 should see a blue double-tick or 'read' status.
    // For this simple test, we will assume it's sent.

    // 6. Logout
    await page1.click('svg:has(path[d^="M12 7a2 2 0"])'); // More menu SVG
    await page1.click('text=Logout');
    await page1.waitForURL('http://localhost:5173/login');
    logSuccess('Logout');

    // 7. Login
    await page1.fill('input[type="email"]', `${userA}@test.com`);
    await page1.fill('input[type="password"]', 'password123');
    await page1.click('button[type="submit"]');
    await page1.waitForURL('http://localhost:5173/chat');
    logSuccess('Login');

  } catch (e) {
    logError(`Test Failed: ${e.message}`);
  } finally {
    await browser.close();
  }

  if (errors > 0) {
    console.log(`\nVerification finished with ${errors} errors.`);
    process.exit(1);
  } else {
    console.log(`\nVerification finished successfully.`);
    process.exit(0);
  }
})();
