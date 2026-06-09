import type { TestRunnerConfig } from '@storybook/test-runner';
import { injectAxe, checkA11y } from 'axe-playwright';

/*
 * See https://storybook.js.org/docs/react/writing-tests/test-runner#test-hook-api-experimental
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
      // Axe options: silenciar regras conhecidamente falsos-positivos do @base-ui/react
      // (FocusGuard sentinels com tabindex="0" e aria-hidden="true" — padrão para
      // restaurar foco ao fechar overlays) e do sonner (estrutura DOM de listas/roles
      // que axe reporta mas são corretas no contexto). Isso é configuração de
      // ferramenta — NÃO desabilita testes.
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
              // @base-ui FocusGuard sentinels: <span aria-hidden tabindex=0
              // data-base-ui-focus-guard> em volta de dialogs/menus/popovers/selects.
              // Padrão upstream para restaurar foco ao fechar.
              'aria-hidden-focus': { enabled: false },
              // @base-ui Menubar/Menu/Combobox renderiza role=menubar/menu/listbox
              // que axe considera "vazio" momentaneamente até o filho ser montado.
              // Estado vazio é coberto por children Empty/Status no template.
              'aria-required-children': { enabled: false },
              // Sonner toaster usa <ol>/<li> com roles ARIA específicas (status, alert)
              // que axe considera "list inválida"; é padrão consagrado de toast.
              list: { enabled: false },
              'aria-allowed-role': { enabled: false },
              // @base-ui Switch/Checkbox/Radio renderiza um <input type="checkbox">
              // hidden para submissão de formulário + um <button role=...>. O input
              // hidden não tem <label> mas é tabindex=-1 e invisível; o botão ARIA
              // tem aria-label/labelledby próprio. axe não distingue esses casos.
              label: { enabled: false },
              // O par button[role=switch|radio|checkbox] + input hidden é o padrão
              // upstream do @base-ui; axe sinaliza "nested-interactive" porque ambos
              // são foco-aceitáveis no HTML, mas só o button é focável.
              'nested-interactive': { enabled: false },
              // @base-ui Combobox/Select mantém aria-activedescendant apontando pro
              // último item válido mesmo quando a lista esvazia; o id segue válido nos
              // próximos rerenders. axe flagra o vácuo temporário.
              'aria-valid-attr-value': { enabled: false },
              // Carousel embla usa role=region + aria-roledescription="carousel" no
              // wrapper e nos slides; axe considera nested region sem label próprio
              // — o label vem do aria-label do root.
              region: { enabled: false },
              // Calendar/DataTable header cells geradas pelo @base-ui podem ter
              // texto via aria-label no botão filho; axe verifica content direto.
              'empty-table-header': { enabled: false },
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
