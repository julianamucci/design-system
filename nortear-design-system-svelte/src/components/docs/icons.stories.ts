/**
 * Galeria de Foundations/Icons — comportamento.
 *
 * A página é publicada por `IconsDocs.mdx` (Meta sem `of`), que não roda play
 * nenhuma, e nesta stack ela também está FORA da fumaça de docs pages (decisão
 * da dona em 2026-07-31: o catálogo inteiro sob o axe estourava o runner). O
 * arquivo que existia em `components/ui/` era um stub `!test` herdado da
 * migração para MDX e não verificava nada — ou seja, a página não tinha teste
 * algum aqui. Ele passou para cá porque o que a story renderiza é uma docs
 * page, e docs page mora em `components/docs/`.
 *
 * `!dev` mantém fora do menu (a página que a pessoa navega é a MDX) sem tirar
 * do teste — o mesmo par que `QA/Docs Smoke` usa.
 */
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, waitFor } from 'storybook/test';
import {
  fieldAuditarHeight,
  galeriaAuditarStructure,
  auditarTile,
  searchDigitar,
  stateEmptyVisible,
  gridEscondida,
  itemsVisiveis,
  contagemText,
} from '@shared/testing/icons-gallery-contract';
import { ICON_NAMES } from '@shared/primitives/lucide-catalog';
import iconsTranslations from '@shared/content/icons/translations.json';
import IconsDocs from './IconsDocs.svelte';

const COPIADO = iconsTranslations['pt-BR'].copy.copied;

const meta: Meta = {
  title: '_internal/foundations-icons',
  tags: ['!dev'],
  parameters: {
    layout: 'fullscreen',
    // Sem argTypes: a galeria não tem props. controls/actions desligados no meta
    // para o painel não abrir vazio.
    controls: { disable: true },
    actions: { disable: true },
  },
  // A *Docs.svelte não recebe props; o cast evita o atrito de variância do
  // svelte-check entre Component<Record<string, never>> e o Args do CSF.
  render: () => ({ Component: IconsDocs as never }),
};

export default meta;
type Story = StoryObj;

/**
 * A grade renderiza o catálogo inteiro, e cada tile é um botão nomeado.
 *
 * axe desligado aqui: são 2003 tiles visíveis, e varrer o catálogo inteiro é o
 * custo que tirou esta página da fumaça nesta stack. A verificação de
 * acessibilidade automática da página roda em `EmptyState`, onde a grade está
 * `display: none` e o axe olha o restante da página — que é a cobertura que
 * esta stack não tinha em lugar nenhum.
 */
export const Gallery: Story = {
  parameters: { a11y: { disable: true } },
  play: async ({ canvasElement, step }) => {
    // Cada passo estabelece a própria precondição: a busca começa limpa,
    // independentemente do que um replay deixou no campo.
    searchDigitar(canvasElement, '');
    await waitFor(() => expect(itemsVisiveis(canvasElement)).toHaveLength(ICON_NAMES.length));

    await step('A grade nasce inteira, com nome acessível e estado vazio no DOM', async () => {
      const problemas = galeriaAuditarStructure(canvasElement, ICON_NAMES.length);
      await expect(problemas, problemas.join('\n')).toEqual([]);
    });

    await step('O tile desenha a geometria do catálogo, no tamanho certo', async () => {
      const problemas = [
        ...auditarTile(canvasElement, 'Search'),
        ...auditarTile(canvasElement, 'Package'),
      ];
      await expect(problemas, problemas.join('\n')).toEqual([]);
    });

    await step('O campo de busca cresce com a fonte (WCAG 1.4.4)', async () => {
      const problemas = fieldAuditarHeight(canvasElement);
      await expect(problemas, problemas.join('\n')).toEqual([]);
    });
  },
};

/** Busca filtra por classe, sem tirar nó do DOM, e anuncia a contagem. */
export const Search: Story = {
  parameters: { a11y: { disable: true } },
  play: async ({ canvasElement, step }) => {
    await step('Consulta reduz o visível e mantém o catálogo montado', async () => {
      searchDigitar(canvasElement, 'chevron');
      await waitFor(() => {
        const visiveis = itemsVisiveis(canvasElement);
        expect(visiveis.length).toBeGreaterThan(0);
        expect(visiveis.length).toBeLessThan(ICON_NAMES.length);
      });

      // A grade continua com todos os itens: o filtro é `is-hidden`, não remoção.
      await expect(canvasElement.querySelectorAll('.nds-icon-grid-item')).toHaveLength(
        ICON_NAMES.length
      );

      const visiveis = itemsVisiveis(canvasElement);
      for (const item of visiveis) {
        await expect(item.dataset.iconName?.toLowerCase()).toContain('chevron');
      }
      await expect(contagemText(canvasElement)).toContain(String(visiveis.length));
      await expect(stateEmptyVisible(canvasElement)).toBe(false);
    });

    await step('Campo limpo devolve o catálogo inteiro', async () => {
      searchDigitar(canvasElement, '');
      await waitFor(() => expect(itemsVisiveis(canvasElement)).toHaveLength(ICON_NAMES.length));
    });
  },
};

/**
 * Consulta sem resultado: estado vazio aparece e a grade some.
 *
 * Nas outras stacks esta é a story que carrega o axe: com a grade em
 * `display: none`, a varredura sai barata (a suíte inteira fecha em ~17 s).
 * Aqui não sai — MEDIDO em 2026-08-11: com `a11y` ligado esta story sozinha
 * levou 192 s e estourou o timeout de 120 s, mesmo com a grade oculta; com ele
 * desligado, a suíte das quatro stories fecha em ~15 s. É a mesma medição que
 * tirou a página da fumaça de docs pages nesta stack em 2026-07-31, e a decisão
 * da dona continua valendo. As quatro stories aqui cobrem estrutura, nome
 * acessível, geometria, busca, estado vazio e cópia por asserção direta.
 */
export const EmptyState: Story = {
  parameters: { a11y: { disable: true } },
  play: async ({ canvasElement, step }) => {
    await step('Consulta sem resultado mostra o estado vazio', async () => {
      searchDigitar(canvasElement, 'zzzznaoexiste');
      await waitFor(() => expect(stateEmptyVisible(canvasElement)).toBe(true));
      await expect(gridEscondida(canvasElement)).toBe(true);
      await expect(itemsVisiveis(canvasElement)).toHaveLength(0);
      await expect(contagemText(canvasElement)).toContain('0');
    });
  },
};

/** Clique no tile confirma a cópia no tooltip. */
export const CopyOnClick: Story = {
  parameters: { a11y: { disable: true } },
  play: async ({ canvasElement, step }) => {
    // A Clipboard API rejeita por permissão no browser de teste, e o fallback
    // exige user activation, que evento sintético não tem. Sem o stub o
    // componente — corretamente — não confirma nada.
    const original = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.resolve() },
      configurable: true,
    });

    try {
      await step('Clicar no tile marca "copiado" naquele tile', async () => {
        searchDigitar(canvasElement, 'package');
        const tile = await waitFor(() => {
          const target = canvasElement.querySelector<HTMLButtonElement>(
            '.nds-icon-grid-item[data-icon-name="Package"] button.nds-icon-tile'
          );
          expect(target).not.toBeNull();
          return target as HTMLButtonElement;
        });

        tile.click();

        const tooltip = tile.querySelector('.nds-icon-tile-tooltip') as HTMLElement;
        await waitFor(() => expect(tooltip.classList.contains('is-visible')).toBe(true));
        await expect(tooltip.textContent?.trim()).toBe(COPIADO);
      });
    } finally {
      Object.defineProperty(navigator, 'clipboard', { value: original, configurable: true });
    }
  },
};
