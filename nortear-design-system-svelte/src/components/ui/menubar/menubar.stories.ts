import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import MenubarStory from './MenubarStory.svelte';
import MenubarDocs from '@/components/docs/MenubarDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { menubarSource } from './menubar.source';

// As mesmas quatro categorias que o `MenubarStory` monta na demonstração
// padrão: a contagem do play sai daqui, nunca de um número escrito à mão.
const MENUS = [
  { label: 'Arquivo', items: ['Novo', 'Abrir', 'Salvar'] },
  { label: 'Editar', items: ['Desfazer', 'Refazer', 'Copiar'] },
  { label: 'Exibir', items: ['Aproximar', 'Afastar', 'Tela cheia'] },
  { label: 'Ajuda', items: ['Documentação', 'Atalhos de teclado'] },
];

const meta: Meta = {
  title: 'Primitives/Navigation/Menubar',
  component: MenubarStory,
  tags: ['autodocs', 'navigation'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(MenubarDocs),
      source: { transform: menubarSource },
      description: {
        component:
          'Barra horizontal de menus estilo desktop: gatilhos na barra, painéis com itens, marcação, escolha única, submenu, separadores e atalhos; a seta horizontal anda entre os menus e a vertical, dentro do menu aberto.',
      },
    },
  },
  argTypes: {
    defaultValue: {
      control: 'text',
      description: 'Menu aberto ao montar (ex.: "file").',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    loop: {
      control: 'boolean',
      description: 'A seta dá a volta do último gatilho para o primeiro, e vice-versa.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    variant: {
      control: 'inline-radio',
      options: ['default', 'destructive'],
      description: 'Ênfase dos itens exibidos na demonstração padrão.',
      table: {
        type: { summary: "'default' | 'destructive'" },
        defaultValue: { summary: "'default'" },
      },
    },
    demonstration: {
      control: 'select',
      options: [
        'default',
        'shortcuts',
        'submenu',
        'checkbox',
        'radio',
        'itemDisabled',
        'destructive',
        'editor',
      ],
      description: 'Composição interna usada na demonstração.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'default'" } },
    },
  },
  args: {
    defaultValue: undefined,
    loop: true,
    variant: 'default',
    demonstration: 'default',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'functional.item4',
      'functional.item6',
      'functional.item8',
      'functional.item10',
      'functional.item12',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item4',
      'accessibility.item6',
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('menubar');
    const triggers = within(barra).getAllByRole('menuitem');
    const [arquivo, editar] = triggers;

    await step('A barra é um menubar, e cada gatilho anuncia o menu que abre', async () => {
      await expect(triggers).toHaveLength(MENUS.length);
      for (const [i, trigger] of triggers.entries()) {
        await expect(trigger).toHaveAccessibleName(MENUS[i].label);
        await expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
      }
    });

    await step('A barra inteira é UMA parada de tabulação', async () => {
      // Zera o foco para o Tab partir sempre do mesmo ponto: o replay do painel
      // Interactions roda a play de novo, com o foco onde a rodada anterior o
      // deixou, e sem isto a asserção mediria a segunda volta.
      (document.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();

      await expect(document.activeElement).toBe(arquivo);
      await expect(triggers.filter((g) => g.tabIndex === 0)).toHaveLength(1);
    });

    await step('Enter no gatilho abre o menu com foco no primeiro item', async () => {
      // Idempotente: só digita com o menu fechado, então o replay parte do
      // mesmo estado da primeira rodada.
      if (arquivo.getAttribute('aria-expanded') !== 'true') {
        arquivo.focus();
        await userEvent.keyboard('{Enter}');
      }

      const menu = await waitForPortal('menu');
      await expect(arquivo.getAttribute('aria-expanded')).toBe('true');

      const items = within(menu).getAllByRole('menuitem');
      await expect(items).toHaveLength(MENUS[0].items.length);
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[0]);
      });
    });

    await step('Dentro do menu, a seta vertical anda entre os itens', async () => {
      const menu = await waitForPortal('menu');
      const items = within(menu).getAllByRole('menuitem');

      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[1]);
      });

      await userEvent.keyboard('{ArrowUp}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[0]);
      });
    });

    // TYPEAHEAD NÃO ENTREGUE NESTA STACK, e por isso `functional.item11`
    // não é declarado aqui — o auditor de contrato acusa a divergência em vez
    // de engoli-la. Medido em 2026-09-03: com o menu aberto e o foco em
    // "Novo", digitar `s` deixa o foco onde estava, ainda depois de 600ms de
    // espera de relógio; as outras quatro stacks levam para "Salvar".
    //
    // Mecanismo medido no bits-ui: a busca por letra só roda quando
    // `target.closest('[data-menubar-content]').id` é igual ao `contentId` do
    // menu, e o painel desta stack renderiza SEM `id` — a comparação é sempre
    // falsa. O item e o painel carregam os atributos certos
    // (`data-menubar-item`, `data-menubar-content`), então não é o wrapper
    // deixando de encaminhar: é o `id` que não chega.
    //
    // O conteúdo compartilhado PROMETE a busca por letra ao leitor, então o
    // desfecho é entregar ou mudar a promessa — não deixar como está.
    await step('Space também abre o gatilho, e não só Enter', async () => {
      // O item do contrato diz "Enter/Space", e só o Enter era verificado —
      // meia verdade que o auditor de cobertura contava como verdade inteira.
      // Fecha ANTES de digitar: o passo estabelece a própria precondição, senão
      // o replay do painel Interactions parte do menu já aberto e o Space o
      // fecharia.
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(arquivo.getAttribute('aria-expanded')).toBe('false');
      });

      arquivo.focus();
      await userEvent.keyboard(' ');
      await waitFor(async () => {
        await expect(arquivo.getAttribute('aria-expanded')).toBe('true');
      });

      // O passo seguinte digita DENTRO do menu, então a precondição não é o
      // painel existir — é o foco já ter entrado nele. Sem esta espera, End era
      // digitado com o foco ainda no gatilho.
      const openedBySpace = await waitForPortal('menu');
      await waitFor(async () => {
        await expect(openedBySpace.contains(document.activeElement)).toBe(true);
      });
    });

    await step('Home e End saltam para as pontas da lista', async () => {
      const menu = await waitForPortal('menu');
      const items = within(menu).getAllByRole('menuitem');

      await userEvent.keyboard('{End}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[items.length - 1]);
      });

      await userEvent.keyboard('{Home}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[0]);
      });
    });

    await step('Com um menu aberto, a seta horizontal já abre o vizinho', async () => {
      // É o que separa um menubar de quatro botões vizinhos: a seta não só move
      // o foco, ela troca o menu aberto — o gesto de aplicação desktop.
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(editar.getAttribute('aria-expanded')).toBe('true');
      });
      await expect(arquivo.getAttribute('aria-expanded')).toBe('false');

      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(async () => {
        await expect(arquivo.getAttribute('aria-expanded')).toBe('true');
      });
      await expect(editar.getAttribute('aria-expanded')).toBe('false');
    });

    await step('Escape fecha o menu e devolve o foco ao gatilho', async () => {
      // Precondição própria: reabre pelo gatilho de Arquivo em vez de herdar
      // o que o passo das setas deixou. Qual gatilho fica com o realce depois
      // de uma troca de menu é decisão de cada lib — herdar isso faria este
      // passo medir a lib, e não a devolução do foco que o contrato promete.
      if (arquivo.getAttribute('aria-expanded') !== 'true') {
        await userEvent.click(arquivo);
        await waitForPortal('menu');
      }
      arquivo.focus();
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('menu');
      await expect(arquivo.getAttribute('aria-expanded')).toBe('false');
      // O foco não pode cair no corpo do documento: quem navega por teclado
      // teria de percorrer a página inteira de novo para voltar ao ponto.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(arquivo);
      });
    });

    await step('Clicar no gatilho de um menu aberto fecha o menu', async () => {
      if (arquivo.getAttribute('aria-expanded') !== 'true') {
        await userEvent.click(arquivo);
      }
      await waitForPortal('menu');

      await userEvent.click(arquivo);
      await waitForPortalGone('menu');
      await expect(arquivo.getAttribute('aria-expanded')).toBe('false');
    });
  },
};
