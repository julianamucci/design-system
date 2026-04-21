import { getStoryContext, type TestRunnerConfig } from '@storybook/test-runner';
import { injectAxe, checkA11y, configureAxe } from 'axe-playwright';

/*
 * See https://storybook.js.org/docs/writing-tests/integrations/test-runner
 * to learn more about the test-runner hooks API.
 */
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

    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  },
};

export default config;
