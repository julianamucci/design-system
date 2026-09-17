import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import SheetStory from './SheetStory.svelte';
import SheetControlledStory from './SheetControlledStory.svelte';
import SheetPairStory from './SheetPairStory.svelte';
import { secondPanelState } from './sheet-pair-state.svelte';
import { waitForPointerRelease, waitForScrollRelease } from './sheet.fixtures';
import {
  sheetControlledSource,
  sheetSecondPanelSource,
  sheetSource,
  sheetTermosWithScrollSource,
} from './sheet.source';

import { figmaDesign } from '@shared/figma/design-links';
// Fechado e aberto são os dois extremos do ciclo. Fechado o painel nem existe
// no DOM; aberto, o foco entra e fica preso até o fechamento.

const meta: Meta = {
  title: 'Components/Overlay/Sheet/States',
  component: SheetStory,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('sheet'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para os quatro estados: cada story declara os próprios args, e
      // é deles que sai o snippet — inclusive o `open` que a torna controlada.
      source: { transform: sheetSource },
      description: {
        component:
          'Estados canônicos do Sheet: Closed (inicial), Open, LongScrollBody (corpo mais ' +
          'alto que o painel), WithCloseButtonHidden (sem o botão do canto), Controlled ' +
          '(estado externo) e SecondPanelClosesFirst (um painel por vez).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Closed: Story = {
  args: {
    triggerLabel: 'Abrir filtros',
    title: 'Filtros avançados',
    description: 'Configure os filtros para refinar os resultados.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Estado inicial. O painel não está no DOM, e o gatilho anuncia que existe um ' +
          'diálogo por trás dele sem prometer que já está aberto.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir filtros/i });

    await step('Fechado, o painel não existe no DOM', async () => {
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
      await expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull();
    });

    await step('O gatilho anuncia o diálogo sem afirmar que está aberto', async () => {
      await expect(trigger).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('data-slot', 'sheet-trigger');
    });
  },
};

export const Open: Story = {
  args: {
    open: true,
    side: 'right',
    triggerLabel: 'Abrir filtros',
    title: 'Filtros avançados',
    description: 'Configure os filtros para refinar os resultados.',
    actionLabel: 'Aplicar filtros',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Aberto por estado inicial, sem interação nenhuma. O foco entra no painel e o ' +
          'restante da página fica inerte enquanto ele durar.',
      },
    },
  },
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');

    await step('Monta já aberto, com o contrato de markup completo', async () => {
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('aria-modal', 'true');
      // O nome ESPERADO, e não "algum nome": sem argumento a asserção passa com
      // qualquer palavra — inclusive com o título de outro painel.
      await expect(panel).toHaveAccessibleName('Filtros avançados');
      await expect(panel).toHaveAccessibleDescription(
        'Configure os filtros para refinar os resultados.',
      );
      await expect(document.querySelector('[data-slot="sheet-overlay"]')).not.toBeNull();
    });

    await step('O foco está dentro do painel', async () => {
      await waitFor(() => {
        if (!panel.contains(document.activeElement)) {
          throw new Error('o foco não entrou no painel');
        }
      });
    });
  },
};

export const LongScrollBody: Story = {
  args: {
    open: true,
    side: 'right',
    variant: 'withScrollContent',
    // Os CINCO rótulos são os do Vanilla, literais. O corpo já vinha alinhado e
    // os outros quatro não: o mesmo exemplo se chamava "Ver termos / Termos e
    // condições / Aceitar / Recusar" aqui e "Ler termos / Termos de uso /
    // Aceitar termos / Cancelar" na referência. Nenhuma das duas está errada
    // sozinha; juntas, comparar as cinco páginas lado a lado deixa de responder
    // se a diferença é de texto ou de comportamento.
    triggerLabel: 'Ler termos',
    title: 'Termos de uso',
    description: 'Leia atentamente antes de aceitar.',
    actionLabel: 'Aceitar termos',
    cancelLabel: 'Cancelar',
    // As cinco stacks nomeiam a mesma região com a mesma palavra, senão o leitor
    // de tela ouve coisa diferente em cada página do mesmo componente.
    bodyLabel: 'Termos de uso',
  },
  parameters: {
    // Só `visual.item4`: o trio do corpo nomeado (C7) é `accessibility.items.item8`
    // da PÁGINA, e o vocabulário de `covers` é `testes.*` do conteúdo
    // compartilhado, onde não existe critério correspondente. Declarar um id que
    // não existe é pior que não declarar — vira cobertura fantasma.
    covers: ['visual.item4'],
    docs: {
      source: { transform: sheetTermosWithScrollSource },
      description: {
        story:
          'Corpo mais alto que o painel. O corpo rola sozinho e o rodapé continua visível — ' +
          "é o que separa 'conteúdo longo' de 'ação fora de alcance'.",
      },
    },
  },
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');
    const body = panel.querySelector<HTMLElement>('[data-slot="sheet-body"]')!;
    const footer = panel.querySelector<HTMLElement>('[data-slot="sheet-footer"]')!;

    await step('O corpo é quem rola, não o painel', async () => {
      await expect(body).not.toBeNull();
      await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
      // O painel em si não rola: o `flex: 1 1 auto` do corpo é o que segura o rodapé.
      await expect(panel.scrollHeight).toBeLessThanOrEqual(panel.clientHeight + 1);
    });

    await step('A região rolável é alcançável por teclado, e se anuncia (C7)', async () => {
      // Os TRÊS juntos, e é essa a condição: caixa que rola é parada de teclado
      // (WCAG 2.1.1 — regra scrollable-region-focusable do axe), parada de
      // teclado precisa de papel, e nome em elemento sem papel o leitor de tela
      // descarta. Nenhuma story das cinco stacks nomeava o corpo, então o
      // `role="group"` do primitivo nunca chegava a ser emitido.
      await expect(body).toHaveAttribute('tabindex', '0');
      await expect(body).toHaveAttribute('role', 'group');
      await expect(body).toHaveAccessibleName('Termos de uso');
    });

    await step('O rodapé continua visível com o corpo cheio', async () => {
      const boxFooter = footer.getBoundingClientRect();
      const boxPanel = panel.getBoundingClientRect();
      await expect(boxFooter.bottom).toBeLessThanOrEqual(boxPanel.bottom + 1);
      await expect(boxFooter.height).toBeGreaterThan(0);
    });
  },
};

export const WithCloseButtonHidden: Story = {
  args: {
    open: true,
    side: 'right',
    showCloseButton: false,
    // Os rótulos da Demonstração, como nas outras stacks: o exemplo que as cinco
    // páginas comparam lado a lado tem de ser o mesmo, e aqui ele era outro
    // ("Convidar para o time"), sem que nada disso fosse o assunto da story.
    triggerLabel: 'Abrir filtros',
    title: 'Filtros avançados',
    description: 'Configure os filtros para refinar os resultados.',
    actionLabel: 'Aplicar filtros',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Sem o botão do canto. Só faz sentido quando o rodapé já oferece uma saída ' +
          'explícita — Escape continua fechando de qualquer forma.',
      },
    },
  },
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');

    await step('O botão do canto não é renderizado', async () => {
      await expect(panel).toBeVisible();
      await expect(
        within(panel).queryByRole('button', { name: /^Fechar$/i }),
      ).not.toBeInTheDocument();
      // O seletor da própria folha, e não só o papel: nesta stack o X é um Button
      // composto, e quem o posiciona é esta classe — zero dela é a prova direta
      // de que a peça não foi montada.
      await expect(panel.querySelector('.nds-sheet-close-position')).toBeNull();
    });

    await step('E ainda assim existe uma saída — o rodapé', async () => {
      const footer = panel.querySelector<HTMLElement>('[data-slot="sheet-footer"]');
      await expect(footer).not.toBeNull();
      // `queryAllByRole` com o número esperado: `getAllByRole` ESTOURA em zero
      // antes de chegar à comparação, então `.length > 0` nunca reprovava —
      // a story falhava por exceção ou passava dizendo nada.
      const botoes = within(footer!).queryAllByRole('button');
      await expect(botoes).toHaveLength(2);
      await expect(botoes.map((b) => b.textContent?.trim())).toEqual([
        'Cancelar',
        'Aplicar filtros',
      ]);
    });
  },
};

export const Controlled: Story = {
  args: {
    triggerLabel: 'Abrir pelo estado externo',
    title: 'Controlado pelo pai',
    description:
      'Este painel é comandado por estado externo e devolve cada mudança a quem é dono dele.',
    actionLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    onClose: fn(),
  },
  parameters: {
    // A trava de rolagem (C5) é `accessibility.items.item7` da PÁGINA; `covers`
    // só aceita id de `testes.*`, e lá não há critério para ela.
    docs: {
      source: { transform: sheetControlledSource },
      description: {
        story:
          'Abertura comandada de fora, sem gatilho dentro do componente. O valor ligado manda ' +
          'no painel, e o painel devolve cada mudança — Escape fecha mesmo assim.',
      },
    },
  },
  // O andaime comum sempre monta um `SheetTrigger`, e era nele que esta story
  // clicava: o que ela provava era o gatilho do componente, não o estado
  // externo. Aqui o botão mora fora do `<Sheet>`.
  render: (args) => ({ Component: SheetControlledStory, props: args }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const externo = canvas.getByRole('button', { name: /Abrir pelo estado externo/i });
    const onClose = args.onClose as ReturnType<typeof fn>;

    await step('Sem gatilho do componente, o painel nasce fechado', async () => {
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
      // A prova de que quem abre é o ESTADO: não há `SheetTrigger` na página.
      await expect(canvasElement.querySelector('[data-slot="sheet-trigger"]')).toBeNull();
      await expect(externo).toHaveAttribute('aria-haspopup', 'dialog');
    });

    // Lido ANTES de abrir: é a isto que o fechamento tem de devolver a página, e
    // não a uma string vazia — outro painel pode ter deixado a trava posta.
    const overflowAntes = document.body.style.overflow;

    await step('O estado externo abre o painel', async () => {
      await userEvent.click(externo);
      const panel = await waitForPortal('dialog');
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('data-slot', 'sheet-content');
      await expect(panel).toHaveAccessibleName('Controlado pelo pai');
    });

    await step('Com o painel aberto, a página atrás não rola (C5)', async () => {
      // `aria-modal="true"` promete que o resto da página está fora de alcance.
      // Sem a trava a promessa é falsa: o leitor de tela não alcança o que está
      // atrás, mas o mouse e a roda alcançam.
      await waitFor(() => {
        if (document.body.style.overflow !== 'hidden') {
          throw new Error('a página atrás do painel continua rolando');
        }
      });
    });

    await step('Escape fecha, relata escape e solta a rolagem', async () => {
      const antes = onClose.mock.calls.length;
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('dialog');
      // O que a espera NÃO prova, e por isso é o que se afirma aqui: o nó do
      // painel saiu do documento (e não só o papel `dialog`), o fechamento foi
      // relatado uma vez e com a palavra certa, e a página voltou a rolar.
      await expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull();
      await expect(onClose.mock.calls.length).toBe(antes + 1);
      await expect(onClose.mock.calls[antes]![0]).toBe('escape');
      await waitForScrollRelease();
      await expect(document.body.style.overflow).toBe(overflowAntes);
    });
  },
};

// ─── Dois painéis, e o mais novo manda ────────────────────────────────────────
//
// O Sheet é MODAL: um de cada vez. Abrir o segundo tira o primeiro da tela, e
// essa saída é um fechamento como qualquer outro — precisa dizer por quê. Sem a
// guarda, a lib empilha: o painel de baixo fica atrás do véu do de cima, e as
// duas armadilhas de foco disputam o Tab na mesma tela.

export const SecondPanelClosesFirst: Story = {
  args: {
    firstTriggerLabel: 'Abrir o primeiro',
    secondTriggerLabel: 'Abrir o segundo',
    onFirstClose: fn(),
  },
  parameters: {
    docs: {
      source: { transform: sheetSecondPanelSource },
      description: {
        story:
          'Dois painéis na mesma página. Abrir o segundo fecha o primeiro, que relata o ' +
          'motivo api — ninguém o dispensou, foi a modalidade do componente que o recolheu.',
      },
    },
  },
  render: (args) => ({ Component: SheetPairStory, props: args }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const firstTrigger = canvas.getByRole('button', { name: 'Abrir o primeiro' });
    const onFirstClose = args.onFirstClose as ReturnType<typeof fn>;

    // A play REEXECUTA no mesmo DOM (painel Interactions): parte sempre do mesmo
    // ponto, e o espião recomeça vazio — senão o segundo passo somaria os
    // motivos da rodada anterior.
    secondPanelState.open = false;
    await waitForPortalGone('dialog');
    await waitForPointerRelease();
    onFirstClose.mockClear();

    await step('O primeiro painel abre sozinho na tela', async () => {
      await userEvent.click(firstTrigger);
      const panel = await waitForPortal('dialog');
      await expect(panel).toHaveAccessibleName('Primeiro painel');
      await expect(onFirstClose.mock.calls).toHaveLength(0);
    });

    await step('Abrir o segundo recolhe o primeiro, e ele diz por quê', async () => {
      // Aberto por ESTADO, e não por clique no gatilho: com um painel modal na
      // tela a lib deixa `pointer-events: none` no body, e um clique forçado no
      // gatilho irmão seria um ponteiro FORA do primeiro painel — dispensado
      // como clique fora, relatando `overlay`. O que se mede aqui é o painel
      // recolhido pela modalidade, que relata `api`.
      secondPanelState.open = true;

      // CONTAR não serve, e foi assim que esta guarda passou por cima do defeito
      // na primeira medição: entre o comando e a repintura do Svelte o único
      // painel na tela ainda é o PRIMEIRO, então "achei exatamente um" é
      // verdade cedo demais — a asserção seguinte media o painel antigo e
      // reprovava dizendo `Primeiro painel`. O recolhimento é assíncrono (roda
      // no efeito), então o que se espera é a TROCA: o segundo entra…
      await waitFor(
        () => {
          const entrou = [...document.querySelectorAll('[data-slot="sheet-content"]')].some(
            (p) => p.textContent?.includes('Segundo painel'),
          );
          if (!entrou) throw new Error('o segundo painel não entrou na tela');
        },
        { timeout: 4000 },
      );

      // …e o primeiro SAI. É esta a metade que prova a decisão: sem a guarda de
      // "um por vez", os dois ficam na tela e esta espera estoura.
      await waitFor(
        () => {
          const ficou = [...document.querySelectorAll('[data-slot="sheet-content"]')].some(
            (p) => p.textContent?.includes('Primeiro painel'),
          );
          if (ficou) throw new Error('o primeiro painel continua na tela ao lado do segundo');
        },
        { timeout: 4000 },
      );

      const abertos = [...document.querySelectorAll<HTMLElement>('[data-slot="sheet-content"]')];
      await expect(abertos).toHaveLength(1);
      await expect(abertos[0]).toHaveAccessibleName('Segundo painel');
      // O painel que sai da TELA tem de sair também do relatório. `api` e não
      // `overlay`/`escape`/`close-button`: nenhum gesto da pessoa fechou aquele
      // painel — foi uma decisão de dentro do componente.
      await expect(onFirstClose.mock.calls.flat()).toEqual(['api']);
    });

    await step('Escape fecha o segundo, e o primeiro não relata de novo', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('dialog');
      await expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull();
      // O primeiro já tinha saído: um segundo relato aqui seria o mesmo painel
      // fechando duas vezes na série do GA4.
      await expect(onFirstClose.mock.calls.flat()).toEqual(['api']);
    });
  },
};
