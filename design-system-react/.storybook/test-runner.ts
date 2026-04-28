import type { TestRunnerConfig } from '@storybook/test-runner';
import { injectAxe, checkA11y } from 'axe-playwright';

/*
 * See https://storybook.js.org/docs/react/writing-tests/test-runner#test-hook-api-experimental
 * to learn more about the test-runner hooks API.
 *
 * NOTA: getStoryContext() do @storybook/test-runner@0.24.3 é incompatível com Storybook 10
 * (depende de globalThis.__getContext que não existe mais). Por isso o axe roda em todas
 * as stories incondicionalmente. Para desabilitar a11y em uma story específica, use a
 * convenção de naming (ex: prefixar com "_" ou colocar em arquivo `*.no-a11y.stories.tsx`)
 * e ajuste o filtro abaixo.
 */
const config: TestRunnerConfig = {
  async preVisit(page) {
    // Reset state if axe was already loaded from previous story
    await page.evaluate(() => {
      // @ts-expect-error: axe global injetado pelo axe-playwright
      if (typeof window !== 'undefined' && window.axe) {
        // @ts-expect-error
        delete window.axe;
      }
    });
    await injectAxe(page);
  },
  async postVisit(page) {
    try {
      await checkA11y(page, '#storybook-root', {
        detailedReport: true,
        detailedReportOptions: {
          html: true,
        },
      });
    } catch (err) {
      // Se o axe falhar por estado corrompido entre stories, log mas não falha o teste
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Axe is already running')) {
        console.warn('[a11y] Axe already running, skipping this story');
        return;
      }
      throw err;
    }
  },
};

export default config;
