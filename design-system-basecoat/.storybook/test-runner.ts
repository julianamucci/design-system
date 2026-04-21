import { getStoryContext, type TestRunnerConfig } from '@storybook/test-runner';
import { injectAxe, checkA11y, configureAxe } from 'axe-playwright';
import type { Page } from 'playwright';

/*
 * See https://storybook.js.org/docs/writing-tests/integrations/test-runner
 * to learn more about the test-runner hooks API.
 */
async function runA11yCheck(page: Page): Promise<void> {
  // PATCH: bugfix — axe-playwright esporadicamente lança
  // "Axe is already running" em corridas concorrentes do test-runner.
  // Pequena retry com backoff contorna a race condition.
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await checkA11y(page, '#storybook-root', {
        detailedReport: true,
        detailedReportOptions: {
          html: true,
        },
      });
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt < maxAttempts && /Axe is already running/i.test(msg)) {
        await page.waitForTimeout(150 * attempt);
        continue;
      }
      throw err;
    }
  }
}

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page, context) {
    const storyContext = await getStoryContext(page, context);

    if (storyContext.parameters?.a11y?.config) {
      await configureAxe(page, {
        rules: storyContext.parameters.a11y.config.rules,
      });
    }

    if (storyContext.parameters?.a11y?.disable) {
      return;
    }

    await runA11yCheck(page);
  },
};

export default config;
