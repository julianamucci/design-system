import { getStoryContext, type TestRunnerConfig } from '@storybook/test-runner';
import { injectAxe, checkA11y, configureAxe } from 'axe-playwright';

/*
 * See https://storybook.js.org/docs/react/writing-tests/test-runner#test-hook-api-experimental
 * to learn more about the test-runner hooks API.
 */
const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page, context) {
    // Get the entire context of a story, including parameters, args, argTypes, etc.
    const storyContext = await getStoryContext(page, context);

    // Apply axe configuration from story parameters if available
    if (storyContext.parameters?.a11y?.config) {
      await configureAxe(page, {
        rules: storyContext.parameters.a11y.config.rules,
      });
    }

    // Do not run a11y tests if disabled in parameters
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
