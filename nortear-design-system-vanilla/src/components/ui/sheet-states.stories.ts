import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { createSheet, type SheetElement } from './sheet';
import { sheetSource, sheetSourceWith, sheetSourceControlled } from './sheet.source';
import { createButton } from './button';
import { clicarQuandoMontado, makeBody, makeFooter } from './sheet.fixtures';
import { sondarOuvintes, probeHost, checkLimpeza, type ProbeResult } from './leak-probe';

import { figmaDesign } from '@shared/figma/design-links';
// ─── Meta ─────────────────────────────────────────────────────────────────────

// Fechado e aberto são os dois extremos do ciclo. Fechado o painel nem existe
// no DOM; aberto, o foco entra e fica preso até o fechamento.

const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/Sheet/States',
  parameters: {
    design: figmaDesign('sheet'),
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: sheetSource },
      description: {
        component:
          'Estados canônicos do Sheet: Closed (inicial), Open (aberto programaticamente), ' +
          'LongScrollBody (corpo mais alto que o painel), WithCloseButtonHidden (sem o X ' +
          'do canto) e Controlled (abertura externa — a factory não expõe prop de estado, ' +
          'expõe os verbos open/close/isOpen).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSheet(opts: {
  triggerLabel: string;
  title: string;
  description: string;
  openInitially?: boolean;
}): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: opts.triggerLabel });
  // Corpo canônico — o mesmo parágrafo que o painel Code publica.
  const body = makeBody();

  const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
  const action = createButton({ variant: 'default', label: 'Aplicar filtros' });
  const footer = document.createElement('div');
  footer.className = 'nds-cluster';
  footer.dataset.spacing = 'md';
  footer.append(cancel, action);

  const sheet = createSheet({
    trigger,
    side: 'right',
    title: opts.title,
    description: opts.description,
    content: body,
    footer,
  });
  if (opts.openInitially) clicarQuandoMontado(trigger);
  return sheet;
}

/**
 * Motivos que o PRIMEIRO painel relatou, gravados no render e lidos pela play.
 *
 * Fora do render porque o `onClose` é passado na MONTAGEM e a play só recebe o
 * `canvasElement`: sem um ponto combinado entre os dois, não há como observar um
 * callback de fábrica daqui.
 */
const firstPanelReasons: unknown[] = [];

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Closed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Estado inicial. O painel não está no DOM, e o gatilho anuncia que existe um ' +
          'diálogo por trás dele sem prometer que já está aberto.',
      },
    },
  },
  render: () => buildSheet({
    triggerLabel: 'Abrir filtros',
    title: 'Filtros avançados',
    description: 'Configure os filtros.',
  }),
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
  parameters: {
    docs: {
      description: {
        story:
          'Aberto na montagem, sem interação nenhuma. O foco entra no painel e o restante ' +
          'da página fica inerte enquanto ele durar.',
      },
    },
  },
  render: () => buildSheet({
    triggerLabel: 'Abrir filtros',
    title: 'Filtros avançados',
    description: 'Configure os filtros para refinar os resultados.',
    openInitially: true,
  }),
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');

    await step('Monta já aberto, com o contrato de markup completo', async () => {
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('aria-modal', 'true');
      await expect(panel).toHaveAccessibleName(/Filtros avançados/i);
      await expect(panel).toHaveAccessibleDescription();
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
  parameters: {
    covers: ['visual.item4'],
    docs: {
      // O corpo alto é o assunto: quem rola é `.nds-sheet-body`, e o rodapé fica
      // onde está sem nenhuma opção extra.
      source: {
        transform: sheetSourceWith({
          body: 'paragraphs',
          triggerLabel: 'Ler termos',
          title: 'Termos de uso',
          description: 'Leia atentamente antes de aceitar.',
          applyLabel: 'Aceitar termos',
        }),
      },
      description: {
        story:
          'Corpo mais alto que o painel. O corpo rola sozinho e o rodapé continua visível — ' +
          'é o que separa "conteúdo longo" de "ação fora de alcance".',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Ler termos' });

    const long = document.createElement('div');
    long.className = 'nds-stack nds-text-body nds-text-muted-foreground';
    long.dataset.spacing = 'sm';
    for (let i = 1; i <= 24; i++) {
      const p = document.createElement('p');
      p.textContent = `Parágrafo ${i}: termos longos o bastante para o corpo precisar rolar dentro do painel, sem empurrar o rodapé para fora da tela.`;
      long.appendChild(p);
    }

    const sheet = createSheet({
      trigger,
      side: 'right',
      title: 'Termos de uso',
      description: 'Leia atentamente antes de aceitar.',
      content: long,
      footer: makeFooter('Cancelar', 'Aceitar termos', true),
    });
    clicarQuandoMontado(trigger);
    return sheet;
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

    await step('A região rolável é alcançável por teclado', async () => {
      // WCAG 2.1.1 — sem o tabindex quem navega por teclado não consegue rolar
      // o corpo (é a regra scrollable-region-focusable do axe).
      await expect(body).toHaveAttribute('tabindex', '0');
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
  parameters: {
    docs: {
      // A AUSÊNCIA do X é o assunto, e ela só se sustenta com o rodapé
      // oferecendo a outra saída.
      source: {
        transform: sheetSourceWith({
          triggerLabel: 'Abrir filtros',
          title: 'Filtros avançados',
          description: 'Configure os filtros para refinar os resultados.',
          applyLabel: 'Aplicar filtros',
          showCloseButton: false,
        }),
      },
      description: {
        story:
          'Sem o botão do canto. Só faz sentido quando o rodapé já oferece uma saída ' +
          'explícita — Escape continua fechando de qualquer forma.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir filtros' });
    const body = makeBody();

    const sheet = createSheet({
      trigger,
      side: 'right',
      title: 'Filtros avançados',
      description: 'Configure os filtros para refinar os resultados.',
      content: body,
      footer: makeFooter('Cancelar', 'Aplicar filtros', true),
      showCloseButton: false,
    });
    clicarQuandoMontado(trigger);
    return sheet;
  },
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');

    await step('O botão do canto não é renderizado', async () => {
      await expect(panel).toBeVisible();
      await expect(
        within(panel).queryByRole('button', { name: /^Fechar$/i }),
      ).toBeNull();
      // O seletor da própria folha, e não só o papel: o X é o único elemento
      // que carrega esta classe, então zero dele é a prova direta.
      await expect(panel.querySelector('.nds-sheet-close')).toBeNull();
    });

    await step('E ainda assim existe uma saída — o rodapé', async () => {
      const footer = panel.querySelector<HTMLElement>('[data-slot="sheet-footer"]');
      await expect(footer).not.toBeNull();
      await expect(within(footer!).getAllByRole('button').length).toBeGreaterThan(0);
    });
  },
};

export const Controlled: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      // A fábrica não expõe prop de estado: ela expõe VERBOS. Quem abre por
      // código chama `open()` e acompanha o painel por `onOpenChange`.
      source: { transform: sheetSourceControlled() },
      description: {
        story:
          'Abertura comandada de fora. A factory não expõe uma prop de estado — o pai ' +
          'chama open() no que a fábrica devolve e acompanha o painel por onOpenChange.',
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';

    // SEM gatilho. Era um `<button>` com `.nds-sr-only`, `tabindex="-1"` e
    // `aria-hidden="true"` — um botão que existia para não ser visto, só porque
    // `trigger` era obrigatório e `open()` não existia. Agora a opção é
    // opcional e o verbo é público: o painel nasce sem gatilho nenhum.
    const body = document.createElement('div');
    body.className = 'nds-text-body nds-text-muted-foreground';
    body.textContent = 'Este painel é comandado por estado externo.';

    const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
    const action = createButton({ variant: 'default', label: 'Confirmar' });
    const footer = document.createElement('div');
    footer.className = 'nds-cluster';
    footer.dataset.spacing = 'md';
    footer.append(cancel, action);

    const sheet = createSheet({
      side: 'right',
      title: 'Controlado pelo pai',
      description: 'Abertura programática por open().',
      content: body,
      footer,
      onOpenChange: (open) => {
        externalBtn.dataset.open = String(open);
      },
    });

    const externalBtn = createButton({ variant: 'default', label: 'Abrir pelo estado externo' });
    // O botão que comanda o painel não é o gatilho da fábrica: o anúncio dele é
    // de quem o montou, e é por isso que o `aria-haspopup` vem escrito aqui.
    externalBtn.setAttribute('aria-haspopup', 'dialog');
    // Sem espelho de estado: a guarda de reentrância mora em `open()`, e um
    // `if (!isOpen)` aqui seria a mesma guarda no lugar errado.
    externalBtn.addEventListener('click', () => sheet.open());

    wrapper.appendChild(externalBtn);
    wrapper.appendChild(sheet);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const externo = canvas.getByRole('button', { name: /Abrir pelo estado externo/i });

    // O wrapper que a fábrica devolve É o `SheetElement`: `Object.assign` põe
    // os verbos no próprio nó, então a play alcança a API pública pelo DOM.
    const sheetEl = canvasElement.querySelector<HTMLElement>('[data-slot="sheet"]') as SheetElement;

    await step('Sem gatilho visível, o painel nasce fechado', async () => {
      if (within(document.body).queryAllByRole('dialog').length > 0) {
        await userEvent.keyboard('{Escape}');
        await waitForPortalGone('dialog');
      }
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    await step('E não existe gatilho ESCONDIDO — a forma que `open()` aposentou', async () => {
      // Era um `<button>` com `.nds-sr-only`, `tabindex="-1"` e `aria-hidden`,
      // clicado por código. Um botão que existe para não ser visto é ruído na
      // árvore de acessibilidade e na leitura de quem copia a story; a prova é
      // que o wrapper da fábrica não tem filho NENHUM.
      await expect(sheetEl.children).toHaveLength(0);
      await expect(sheetEl.querySelector('.nds-sr-only')).toBeNull();
      await expect(canvasElement.querySelector('[data-slot="sheet-trigger"]')).toBeNull();
      await expect(sheetEl.isOpen()).toBe(false);
    });

    // Lido ANTES de abrir: o que o fechamento tem de devolver é isto, e não a
    // string vazia — outro painel pode estar segurando a trava.
    const overflowAntes = document.body.style.overflow;

    await step('O comando externo abre o painel — e quem abre é `open()`', async () => {
      await userEvent.click(externo);
      const panel = await waitForPortal('dialog');
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('data-slot', 'sheet-content');
      // O callback devolveu o estado a quem é dono dele.
      await expect(externo).toHaveAttribute('data-open', 'true');
      // E o verbo de leitura concorda com a tela.
      await expect(sheetEl.isOpen()).toBe(true);
    });

    await step('`open()` com o painel aberto não empilha um segundo', async () => {
      // A guarda de reentrância mora na fábrica, e é ela que substitui o
      // espelho `let isOpen` que cada consumidor mantinha. Sem ela, o segundo
      // `open()` montaria outro painel, deixaria o primeiro órfão no `body` e
      // travaria a rolagem uma segunda vez sem o destravar correspondente.
      sheetEl.open();
      sheetEl.open();
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(1);
      await expect(
        document.body.querySelectorAll('[data-slot="sheet-overlay"]'),
      ).toHaveLength(1);
    });

    await step('Com o painel aberto, a página atrás não rola', async () => {
      // `aria-modal="true"` promete que o resto da página está fora de alcance.
      // Sem a trava a promessa é falsa: o leitor de tela não alcança o que está
      // atrás, mas o mouse e a roda alcançam.
      await expect(document.body.style.overflow).toBe('hidden');
    });

    await step('Escape fecha, devolve o estado e solta a rolagem', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('dialog');
      await expect(externo).toHaveAttribute('data-open', 'false');
      await expect(sheetEl.isOpen()).toBe(false);
      await expect(document.body.style.overflow).toBe(overflowAntes);
    });
  },
};

// ─── Limpeza de ouvintes ──────────────────────────────────────────────────────
//
// A fábrica registra ouvinte em `document`. Quem tira o nó da página com o
// componente nesse estado não passa por caminho de fechamento nenhum, e antes
// não havia o que chamar. A prova aqui NÃO é "`destroy()` rodou" — isso passaria
// com um `destroy()` vazio. É a contagem de ouvintes do livro-caixa fechando em
// zero, confirmada por uma bateria de eventos disparada no documento depois da
// saída. Ver `leak-probe.ts` para o que cada prova cobre e como pode falhar.

// ─── Dois painéis, e o mais novo manda ────────────────────────────────────────
//
// O Sheet é MODAL: um de cada vez. Abrir o segundo tira o primeiro da tela, e
// essa saída é um fechamento como qualquer outro — precisa dizer por quê. Até
// 2026-09-11 ela era muda: o painel que sumia da tela sumia também do analytics,
// e a série de abre/fecha da docs page não fechava a conta.

export const SecondPanelClosesFirst: Story = {
  parameters: {
    docs: {
      source: {
        transform: sheetSourceWith({
          triggerLabel: 'Abrir o primeiro',
          title: 'Primeiro painel',
          description: 'Este sai de cena quando o outro entra.',
          cancelLabel: false,
          applyLabel: false,
          onClose: true,
        }),
      },
      description: {
        story:
          'Dois painéis na mesma página. Abrir o segundo fecha o primeiro, que relata o motivo api — ninguém o dispensou, foi a modalidade do componente que o recolheu.',
      },
    },
  },
  render: () => {
    firstPanelReasons.length = 0;

    const first = createSheet({
      trigger: createButton({ variant: 'outline', label: 'Abrir o primeiro' }),
      side: 'left',
      title: 'Primeiro painel',
      description: 'Este sai de cena quando o outro entra.',
      content: makeBody('Abra o segundo painel e este aqui se recolhe.'),
      onClose: (reason) => {
        firstPanelReasons.push(reason);
      },
    });

    const second = createSheet({
      trigger: createButton({ variant: 'outline', label: 'Abrir o segundo' }),
      side: 'right',
      title: 'Segundo painel',
      description: 'O mais novo manda: dois painéis modais ao mesmo tempo deixariam um deles inalcançável.',
      content: makeBody('Este entrou por último, então é este que está na tela.'),
    });

    const wrap = document.createElement('div');
    wrap.className = 'nds-cluster';
    wrap.dataset.spacing = 'md';
    wrap.append(first, second);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const firstTrigger = canvas.getByRole('button', { name: 'Abrir o primeiro' });
    const secondTrigger = canvas.getByRole('button', { name: 'Abrir o segundo' });

    await step('O primeiro painel abre sozinho na tela', async () => {
      await userEvent.click(firstTrigger);
      const panel = await waitForPortal('dialog');
      await expect(panel).toHaveAccessibleName('Primeiro painel');
      await expect(firstPanelReasons).toEqual([]);
    });

    await step('Abrir o segundo recolhe o primeiro, e ele diz por quê', async () => {
      await userEvent.click(secondTrigger);
      await waitFor(() => {
        const abertos = document.querySelectorAll('[data-slot="sheet-content"]');
        if (abertos.length !== 1) {
          throw new Error(`esperava um painel na tela, achei ${abertos.length}`);
        }
      });
      const panel = document.querySelector<HTMLElement>('[data-slot="sheet-content"]')!;
      await expect(panel).toHaveAccessibleName('Segundo painel');
      // O painel que sai da TELA tem de sair também do analytics. `api` e não
      // `overlay`/`escape`/`close-button`: nenhum gesto da pessoa fechou este
      // painel — foi uma decisão de dentro do componente.
      await expect(firstPanelReasons).toEqual(['api']);
    });

    await step('O foco de retorno do segundo é o gatilho DELE', async () => {
      // A leitura do foco anterior passou a acontecer ANTES de recolher o
      // primeiro: o recolhimento devolve o foco ao gatilho do primeiro, e se
      // este painel lesse depois, adotaria aquele gatilho como alvo de retorno.
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('dialog');
      await waitFor(() => {
        if (document.activeElement !== secondTrigger) {
          throw new Error('o foco não voltou ao gatilho do segundo painel');
        }
      });
      // E o primeiro não relatou um segundo fechamento: ele já tinha saído.
      await expect(firstPanelReasons).toEqual(['api']);
    });
  },
};

export const ListenerCleanup: Story = {
  parameters: {
    controls: { disable: true },
    // A story existe para o que acontece DEPOIS da saída do nó: a foto seria
    // sempre a mesma legenda.
    chromatic: { disable: true },
    // O assunto é a limpeza: o snippet mostra a chamada que quem tira o painel
    // da página precisa fazer.
    docs: {
      source: {
        transform: sheetSourceWith({
          triggerLabel: 'Abrir',
          title: 'Título',
          description: 'Descrição do painel.',
          cancelLabel: false,
          applyLabel: false,
          mostrarDestroy: true,
        }),
      },
    },
  },
  render: () => probeHost(
    'Sonda de limpeza: o painel lateral é montado, aberto e removido da página pela play.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let probe!: ProbeResult;
    const teardownReasons: unknown[] = [];

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      probe = await sondarOuvintes({
        host: host as HTMLElement,
        montar: () => {
          const content = document.createElement('p');
          content.textContent = 'Conteúdo do painel.';
          return createSheet({
            trigger: createButton({ variant: 'outline', label: 'Abrir' }),
            title: 'Título',
            description: 'Descrição do painel.',
            content: content,
            onClose: (reason) => {
              teardownReasons.push(reason);
            },
          });
        },
        exercitar: (no) => no.querySelector<HTMLElement>('button')?.click(),
        seletorDePortal: '[data-slot="sheet-content"], [data-slot="sheet-overlay"]',
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await checkLimpeza(probe);
    });

    await step('Desmontar NÃO é fechar: nenhum motivo foi relatado', async () => {
      // A sonda monta o painel, ABRE e tira o nó da página — o estado exato em
      // que um desmonte silencioso é a diferença entre um relatório correto e um
      // `dialog_close` que ninguém provocou. Uma troca de idioma numa docs page
      // com o painel aberto é esse desmonte.
      await expect(teardownReasons).toEqual([]);
    });
  },
};
