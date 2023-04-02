import { test, expect, firefox } from '@playwright/test';

test('test', async () => {
  const browser = await firefox.launch();  // Or 'chromium' or 'webkit'.
  // Create a new incognito browser context.
  const context = await browser.newContext();
  // Create a new page in a pristine context.
  const page = await context.newPage();

  await page.goto('http://localhost/');
  //If user clicks on Dashboard then should stay in home page
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page).toHaveURL('http://localhost/');

  // if user clicks on Home then should stay in home page
  await page.getByRole('link', { name: 'Home' }).click();
  await expect(page).toHaveURL('http://localhost/');

  // if user submits blank or empty data then NO access is allowed to dashboard
  await page.getByText('Submit').click();
  await expect(page.getByText('You entered a wrong username or password.')).toHaveText('You entered a wrong username or password.');

  // if user enters only a wrong user name then NO access allowed to dashboard
  await page.getByLabel('Username').click();
  await page.getByLabel('Username').fill('admin');
  await page.getByText('Submit').click();
  await expect(page.getByText('You entered a wrong username or password.')).toHaveText('You entered a wrong username or password.');

  // if user enters only an wrong password then NO access allowed to dashboard
  await page.getByLabel('Password').click();
  await page.getByLabel('Password').fill('123456');
  await page.getByText('Submit').click();
  await expect(page.getByText('You entered a wrong username or password.')).toHaveText('You entered a wrong username or password.');

  // if user enters wrong username and password then NO access allowed to dashboard
  await page.getByLabel('Username').click();
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Username').press('Tab');
  await page.getByLabel('Password').fill('admin');
  await page.getByText('Submit').click();
  await expect(page.getByText('You entered a wrong username or password.')).toHaveText('You entered a wrong username or password.');

  // if user enters correct username but no password then NO access allowed to dashboard
  await page.getByLabel('Username').click();
  await page.getByLabel('Username').fill('001');
  await page.getByText('Submit').click();
  await expect(page.getByText('You entered a wrong username or password.')).toHaveText('You entered a wrong username or password.');

  // if user enters no username and correct password then NO access allowed to dashboard
  await page.getByLabel('Password').click();
  await page.getByLabel('Password').fill('001');
  await page.getByText('Submit').click();
  await expect(page.getByText('You entered a wrong username or password.')).toHaveText('You entered a wrong username or password.');

  // if user enters a correct user name and password then access to dashboard is conceded
  await page.getByLabel('Username').click();
  await page.getByLabel('Username').fill('001');
  await page.getByLabel('Password').click();
  await page.getByLabel('Password').fill('001');
  await page.getByText('Submit').click();
  await expect(page.locator('div').filter({ hasText: 'Andrew Dip' }).nth(2)).toHaveText("Andrew Dip");

  // if user enters a correct user name and password then access to dashboard is conceded
  await page.getByRole('link', { name: 'Home' }).click();
  await page.getByLabel('Username').click();
  await page.getByLabel('Username').fill('002');
  await page.getByLabel('Password').click();
  await page.getByLabel('Password').fill('002');
  await page.getByText('Submit').click();
  await expect(page.locator('div').filter({ hasText: 'Anderson Delfino' }).nth(2)).toHaveText("Anderson Delfino");

  // if user enters a correct user name and password then access to dashboard is conceded
  await page.getByRole('link', { name: 'Home' }).click();
  await page.getByLabel('Username').click();
  await page.getByLabel('Username').fill('003');
  await page.getByLabel('Password').click();
  await page.getByLabel('Password').fill('003');
  await page.getByText('Submit').click();
  await expect(page.locator('div').filter({ hasText: 'David Smith' }).nth(2)).toHaveText("David Smith");

  // if user enters a correct user name and password then access to dashboard is conceded
  await page.getByRole('link', { name: 'Home' }).click();
  await page.getByLabel('Username').click();
  await page.getByLabel('Username').fill('004');
  await page.getByLabel('Password').click();
  await page.getByLabel('Password').fill('004');
  await page.getByText('Submit').click();
  await expect(page.locator('div').filter({ hasText: 'May Smith' }).nth(2)).toHaveText("May Smith");
});