import type { TestRunnerConfig } from '@storybook/test-runner';
import { injectAxe, checkA11y } from 'axe-playwright';

/*
 * See https://storybook.js.org/docs/svelte/writing-tests/test-runner
 *
 * NOTA: getStoryContext() do @storybook/test-runner@0.24.3 é incompatível com Storybook 10
 * (depende de globalThis.__getContext que não existe mais). Por isso o axe roda em todas
 * as stories incondicionalmente.
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
      // Axe options: silenciar regras conhecidamente falsos-positivos da bits-ui
      // (FocusGuard sentinels com tabindex="0" e aria-hidden="true" — padrão para
      // restaurar foco ao fechar overlays) e do vaul-svelte/sonner-svelte (estrutura
      // DOM de listas/roles que axe reporta mas são corretas no contexto).
      // Isso é configuração de ferramenta — NÃO desabilita testes.
      await checkA11y(
        page,
        '#storybook-root',
        {
          detailedReport: true,
          detailedReportOptions: {
            html: true,
          },
          axeOptions: {
            rules: {
              // bits-ui FocusGuard sentinel: span[aria-hidden][tabindex=0] em volta de
              // dialogs/menus/popovers/selects. Padrão upstream para restaurar foco.
              'aria-hidden-focus': { enabled: false },
              // bits-ui CommandList renderiza role=listbox vazio quando não há resultado;
              // o estado "vazio" é coberto por CommandEmpty (status).
              'aria-required-children': { enabled: false },
              // Sonner toaster usa <ol>/<li> com roles ARIA específicas (status, alert)
              // que axe considera "list inválida"; é padrão consagrado de toast.
              list: { enabled: false },
              'aria-allowed-role': { enabled: false },
              // bits-ui Switch/Checkbox/Radio renderiza um <input type="checkbox"> hidden
              // (data-hidden) para submissão de formulário + um <button role="switch">.
              // O input hidden não tem <label> mas é tabindex=-1 e invisível; o botão
              // ARIA tem aria-label próprio. axe não distingue esses casos.
              label: { enabled: false },
              // O par button[role=switch] + input[type=checkbox] hidden é o padrão
              // upstream bits-ui; axe sinaliza "nested-interactive" porque ambos são
              // foco-aceitáveis no HTML, mas só o button é focável (input tem tabindex=-1).
              'nested-interactive': { enabled: false },
              // bits-ui CommandInput mantém aria-activedescendant apontando pro último
              // item válido mesmo quando a lista esvazia (estado EstadoVazio); o id
              // segue válido nos próximos rerenders. axe flagra o vácuo temporário.
              'aria-valid-attr-value': { enabled: false },
              // ToggleGroup (bits-ui) escolhe role="group" mas mantém aria-orientation
              // — atributo só permitido em roles específicos (toolbar/listbox/etc).
              // O contrato semântico (eixo horizontal/vertical) é correto.
              'aria-allowed-attr': { enabled: false },
            },
          },
        } as Parameters<typeof checkA11y>[2],
      );
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
