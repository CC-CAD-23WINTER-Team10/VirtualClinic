import { test, expect, chromium } from '@playwright/test';

//NOte: This test may fail by excecution time --so setTimeout was extended to 60seg in playwright.config.ts and setTimeout to 120seg.

// Checks physician1 loged in 
test('test', async () => {
  test.setTimeout(120000);
  const browser1 = await chromium.launch();  // Or 'chromium' or 'webkit'.
  // Create a new incognito browser context.
  const context1 = await browser1.newContext();
  // Create a new page in a pristine context.
  const page1 = await context1.newPage();

  await page1.goto('http://localhost/');
  await page1.getByLabel('Username').click();
  await page1.getByLabel('Username').fill('001');
  await page1.getByLabel('Username').press('Tab');
  await page1.getByLabel('Password').fill('001');
  await page1.getByText('Submit').click();
  await expect(page1.locator('div').filter({ hasText: 'Andrew Dip' }).nth(2)).toHaveText("Andrew Dip");

  // ***Second user join the app
  const browser2 = await chromium.launch();  // Or 'chromium' or 'webkit'.
  // Create a new incognito browser context.
  const context2 = await browser2.newContext();
  // Create a new page in a pristine context.
  const page2 = await context2.newPage();

  await page2.goto('http://localhost/');
  await page2.getByLabel('Username').click();
  await page2.getByLabel('Username').fill('002');
  await page2.getByLabel('Username').press('Tab');
  await page2.getByLabel('Password').fill('002');
  await page2.getByText('Submit').click();
  await expect(page2.locator('div').filter({ hasText: 'Anderson Delfino' }).nth(2)).toHaveText("Anderson Delfino");
  
  await expect(page1.locator('div').filter({ hasText: 'Anderson Delfino' }).nth(3)).toHaveText("Anderson Delfino");
  
  await expect(page2.locator('div').filter({ hasText: 'Andrew Dip' }).nth(3)).toHaveText("Andrew Dip");
  
  // ***Third user join the app
  const browser3 = await chromium.launch();  // Or 'chromium' or 'webkit'.
  // Create a new incognito browser context.
  const context3 = await browser3.newContext();
  // Create a new page in a pristine context.
  // Create a new page in a pristine context.
  const page3 = await context3.newPage();

  await page3.goto('http://localhost/');
  await page3.getByLabel('Username').click();
  await page3.getByLabel('Username').fill('003');
  await page3.getByLabel('Username').press('Tab');
  await page3.getByLabel('Password').fill('003');
  await page3.getByText('Submit').click();
  await expect(page3.locator('div').filter({ hasText: 'David Smith' }).nth(2)).toHaveText("David Smith");

  await expect(page1.locator('div').filter({ hasText: 'David Smith' }).nth(3)).toHaveText("David Smith");
  await expect(page2.locator('div').filter({ hasText: 'David Smith' }).nth(3)).toHaveText("David Smith");
    
  await expect(page3.locator('div').filter({ hasText: 'Andrew Dip' }).nth(3)).toHaveText("Andrew Dip");
  await expect(page3.locator('div').filter({ hasText: 'Anderson Delfino' }).nth(3)).toHaveText("Anderson Delfino");


  const browser4 = await chromium.launch();  // Or 'chromium' or 'webkit'.
  // Create a new incognito browser context.
  const context4 = await browser4.newContext();
  // Create a new page in a pristine context.
  const page4 = await context4.newPage();

  await page4.goto('http://localhost/');
  await page4.getByLabel('Username').click();
  await page4.getByLabel('Username').fill('004');
  await page4.getByLabel('Username').press('Tab');
  await page4.getByLabel('Password').fill('004');
  await page4.getByText('Submit').click();
  await expect(page4.locator('div').filter({ hasText: 'May Smith' }).nth(2)).toHaveText("May Smith");

  await expect(page1.locator('div').filter({ hasText: 'May Smith' }).nth(3)).toHaveText("May Smith");
  await expect(page2.locator('div').filter({ hasText: 'May Smith' }).nth(3)).toHaveText("May Smith");
  
  await expect(page4.locator('div').filter({ hasText: 'Andrew Dip' }).nth(3)).toHaveText("Andrew Dip");
  await expect(page4.locator('div').filter({ hasText: 'Anderson Delfino' }).nth(3)).toHaveText("Anderson Delfino");
  // Gracefully close up everything
  //await context.close();
  //await browser.close();
});

