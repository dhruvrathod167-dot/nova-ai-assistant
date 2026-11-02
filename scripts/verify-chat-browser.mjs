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

  await page.waitForTimeout(2000);

  const modelSelect = page.locator('select');
  const modelCount = await modelSelect.count();
  const modelValue = modelCount ? await modelSelect.first().inputValue() : null;
  const modelText = modelCount
    ? await modelSelect.first().locator('option:checked').textContent()
    : null;

  await page.locator('textarea').fill('hello');
  await page.locator('form button[type="submit"]').click();

  await page.waitForFunction(
    () => {
      const t = document.body.innerText;
      return (
        (t.includes('Hello') || t.includes('assist') || t.includes('help')) &&
        !t.includes('Thinking...') &&
        !t.includes('OpenRouter API key is not configured') &&
        !t.includes('Connection ended')
      );
    },
    null,
    { timeout: 60000 }
  );

  const body = await page.locator('body').innerText();
  await page.screenshot({
    path: 'tool-results/openrouter-chat-verify.png',
    fullPage: true,
  });

  return {
    modelSelectCount: modelCount,
    modelValue,
    modelText,
    hasRealResponse:
      /Hello|assist|help/i.test(body) &&
      !/OpenRouter API key is not configured|Connection ended/i.test(body),
    snippet: body.slice(0, 900),
  };
}
