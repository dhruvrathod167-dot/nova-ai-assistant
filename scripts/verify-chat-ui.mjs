export default async function (page) {
  await page.waitForFunction(
    () => !document.body.innerText.includes('Initializing NOVA AI'),
    null,
    { timeout: 30000 }
  );

  const emailInput = page.locator('input[type="email"]');
  if (await emailInput.count()) {
    await emailInput.fill('user@novaai.com');
    await page.locator('input[type="password"]').fill('user123');
    await page.locator('form button[type="submit"]').click();
    await page.waitForSelector('textarea', { timeout: 20000 });
  }

  await page.waitForTimeout(2500);

  const modelSelect = page.locator('select');
  const modelCount = await modelSelect.count();
  let modelValue = null;
  let modelText = null;
  if (modelCount > 0) {
    modelValue = await modelSelect.first().inputValue();
    modelText = await modelSelect
      .first()
      .locator('option:checked')
      .textContent();
  }

  const bodyText = await page.locator('body').innerText();
  const hasModelLabel = /Model:/i.test(bodyText) || modelCount > 0;

  await page.locator('textarea').fill('hello');
  await page.locator('form button[type="submit"]').click();

  await page.waitForFunction(
    () => {
      const t = document.body.innerText;
      return (
        (t.includes('Hello') ||
          t.includes('assist') ||
          t.includes('OpenRouter') ||
          t.includes('Error')) &&
        !t.includes('Thinking...')
      );
    },
    null,
    { timeout: 60000 }
  );

  const afterSend = await page.locator('body').innerText();
  await page.screenshot({
    path: 'tool-results/chat-ui-verify.png',
    fullPage: true,
  });

  return {
    modelSelectCount: modelCount,
    modelValue,
    modelText,
    hasModelLabel,
    hasResponse: /Hello|assist|help/i.test(afterSend),
    bodySnippet: afterSend.slice(0, 1200),
  };
}
