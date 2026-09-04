import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import {
  createPopover,
  createPopoverDescription,
  createPopoverTitle,
} from './popover';
import { open, empilharCentrado, panel } from './popover.fixtures';
import { popoverSource, popoverSourceActions, popoverSourceWith } from './popover.source';
import { createButton } from './button';
import { sondarOuvintes, probeHost, checkLimpeza, type ProbeResult } from './leak-probe';

const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/Popover/States',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: popoverSource },
      description: {
        component:
          'Estados do Popover: fechado (painel fora do DOM), aberto, ' +
          'controlado por fora e com foco dentro do painel. Fechado o painel não é um ' +
          'elemento escondido — é um elemento que não existe.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSimpleContent(text: string): HTMLElement {
  const c = document.createElement('div');
  c.className = 'nds-stack';
  c.dataset.spacing = 'xs';

  // As sub-fábricas emitem a classe E o `data-slot` que o conteúdo
  // compartilhado documenta — escrever os dois à mão era o que fazia o contrato
  // divergir quando um dos lados mudava.
  c.append(
    createPopoverTitle({ text: 'Configuracoes de exibição' }),
    createPopoverDescription({ text }),
  );
  return c;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Closed: Story = {
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir popover' });
    const el = createPopover({ trigger, content: buildSimpleContent('Conteúdo desmontado enquanto fechado.') });
    return empilharCentrado([el]);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /abrir popover/i });

    await step('Fechado, o painel não existe no DOM', async () => {
      // Desmontado, e não escondido: leitor de tela e busca do navegador não
      // encontram conteúdo que não está lá.
      await expect(panel()).toBeNull();
      await expect(trigger).toBeVisible();
    });

    await step('E o gatilho declara o estado nos dois contratos', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveAttribute('data-state', 'closed');
      // Sem painel não há id para apontar — o atributo some, senão o axe
      // reprovaria por aria-valid-attr-value.
      await expect(trigger.getAttribute('aria-controls')).toBeNull();
    });
  },
};

export const Open: Story = {
  parameters: { covers: ['accessibility.item1', 'accessibility.item2'] },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir popover' });
    const el = createPopover({ trigger, content: buildSimpleContent('Ajuste a aparência do conteúdo da página.') });
    queueMicrotask(() => trigger.click());
    return empilharCentrado([el]);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /abrir popover/i });

    // Story SEM interação de fechamento: termina aberta de propósito, porque é
    // este estado que o axe varre (contraste e ARIA do painel) e que o
    // Chromatic fotografa.
    await step('O painel está aberto e declarado nos dois contratos', async () => {
      const p = await open(trigger);
      await expect(p).toBeVisible();
      await expect(p).toHaveAttribute('data-state', 'open');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(trigger).toHaveAttribute('data-state', 'open');
    });

    await step('E é nomeado pelo título que ele mesmo carrega', async () => {
      const id = panel()!.getAttribute('aria-labelledby');
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)?.textContent).toMatch(/Configuracoes de exibição/);
    });
  },
};

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item3'],
    // Override de story: quem observa o estado por fora é `onOpenChange`, e é
    // essa linha que o snippet do meta não teria como adivinhar.
    docs: {
      source: { transform: popoverSourceWith({ onOpenChange: '(aberto) => mostrarEstado(aberto)' }) },
    },
  },
  render: () => {
    const status = document.createElement('span');
    status.className = 'nds-text-caption nds-font-mono nds-text-muted-foreground';
    status.dataset.testid = 'estado';
    status.textContent = 'open=false';

    const trigger = createButton({ variant: 'outline', label: 'Abrir popover' });
    // Sem `size: 'sm'`: o botão pequeno mede 23px de altura e reprova na regra
    // target-size do axe (mínimo 24px). O alvo aqui é externo ao painel e fica
    // sozinho na coluna — não há motivo para encolhê-lo.
    const externalBtn = createButton({ variant: 'secondary', label: 'Toggle externo' });

    const el = createPopover({
      trigger,
      content: buildSimpleContent('Estado observado por fora via onOpenChange.'),
      onOpenChange: (open) => {
        status.textContent = `open=${open}`;
      },
    });

    const externo = document.createElement('p');
    externo.className = 'nds-text-body nds-text-muted-foreground';
    externo.dataset.testid = 'area-externa';
    externo.textContent = 'Área externa';

    externalBtn.addEventListener('click', () => trigger.click());

    return empilharCentrado([status, externalBtn, el, externo]);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /abrir popover/i });
    const externo = canvas.getByRole('button', { name: /toggle externo/i });

    await step('O botão externo abre o painel e o estado sai por onOpenChange', async () => {
      if (trigger.getAttribute('aria-expanded') === 'true') await userEvent.click(externo);
      await userEvent.click(externo);
      await waitFor(() => {
        if (!panel()) throw new Error('popover ainda fechado');
      }, { timeout: 1500 });
      await expect(canvas.getByTestId('estado')).toHaveTextContent('open=true');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Clicar fora do painel fecha o popover', async () => {
      await open(trigger);
      await userEvent.click(canvas.getByTestId('area-externa'));
      await waitFor(() => {
        if (panel()) throw new Error('popover ainda aberto');
      }, { timeout: 1500 });
      await expect(canvas.getByTestId('estado')).toHaveTextContent('open=false');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Estado final: painel aberto', async () => {
      await expect(await open(trigger)).toBeVisible();
    });
  },
};

export const Focused: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item3'],
    // Override de story: o assunto é o foco entrar no primeiro focável, e o
    // snippet do meta mostra um painel só de texto, sem nenhum.
    docs: { source: { transform: popoverSourceActions({ title: 'Confirmar alteração' }) } },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir popover' });

    const content = document.createElement('div');
    content.className = 'nds-stack';
    content.dataset.spacing = 'sm';

    const title = document.createElement('h4');
    title.className = 'nds-popover-title';
    title.dataset.slot = 'popover-title';
    title.textContent = 'Confirmar alteração';
    content.appendChild(title);

    const actions = document.createElement('div');
    actions.className = 'nds-cluster';
    actions.dataset.spacing = 'sm';
    actions.dataset.justify = 'end';
    actions.append(
      createButton({ variant: 'ghost', size: 'sm', label: 'Cancelar' }),
      createButton({ variant: 'default', size: 'sm', label: 'Confirmar' }),
    );
    content.appendChild(actions);

    // Esta story NÃO abre na renderização: quem abre é a play, por clique. O
    // foco entra no painel em resposta ao gesto — abrir antes de o canvas estar
    // montado põe o foco num painel que o Storybook ainda vai reposicionar, e a
    // medição não veria a política, veria a corrida.
    const el = createPopover({ trigger, content });
    return empilharCentrado([el]);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /abrir popover/i });

    await step('O foco entra no painel, no primeiro elemento focável', async () => {
      const p = await open(trigger);
      await waitFor(() => {
        if (!p.contains(document.activeElement)) throw new Error('foco não entrou no painel');
      });
      await expect(within(p).getByRole('button', { name: /cancelar/i })).toHaveFocus();
    });

    await step('Tab caminha entre os controles internos', async () => {
      const p = panel()!;
      const cancelar = within(p).getByRole('button', { name: /cancelar/i });
      const confirmar = within(p).getByRole('button', { name: /confirmar/i });
      cancelar.focus();
      await userEvent.tab();
      await expect(confirmar).toHaveFocus();
    });

    await step('E do ÚLTIMO focável o Tab SAI do painel — este é o não-modal', async () => {
      // ─── O outro lado do controle negativo ──────────────────────────────
      //
      // Este é o par da asserção da story Modal, e é o que dá dentes às duas:
      // a MESMA tecla, no MESMO lugar, com resultado oposto conforme o modo.
      // Aqui, sem `modal`, o foco tem de SAIR; lá, com `modal`, tem de VOLTAR
      // ao primeiro. Uma asserção que passasse nos dois modos não estaria
      // medindo o modo — foi assim que "Modal prende o foco" ficou verde por
      // meses provando `painel.contains(activeElement)`, que é verdade sempre.
      const p = panel()!;
      const confirmar = within(p).getByRole('button', { name: /confirmar/i });
      confirmar.focus();
      await userEvent.tab();
      await expect(p.contains(document.activeElement)).toBe(false);
    });

    await step('E o elemento focado por teclado mostra o anel de foco', async () => {
      // `:focus-visible` é a condição exata que o CSS compartilhado usa para
      // desenhar o anel — se o foco tivesse vindo do ponteiro, o navegador não
      // casaria a pseudo-classe e o anel não apareceria.
      //
      // O passo CHEGA ao botão por teclado, em vez de herdar o foco do passo
      // anterior: aquele passo é justamente o que manda o foco para FORA do
      // painel, então herdar dele era afirmar o anel de um botão que já não
      // estava focado. Reprovou com `expected false to be true`, e o defeito
      // era a precondição, não o anel.
      const p = panel()!;
      const cancelar = within(p).getByRole('button', { name: /cancelar/i });
      const confirmar = within(p).getByRole('button', { name: /confirmar/i });
      cancelar.focus();
      await userEvent.tab();
      await expect(confirmar).toHaveFocus();
      await expect(confirmar.matches(':focus-visible')).toBe(true);
      // O anel de `.nds-button` é box-shadow, não outline — medir a propriedade
      // errada daria verde em qualquer elemento.
      await expect(getComputedStyle(confirmar).boxShadow).not.toBe('none');
    });
  },
};

export const Modal: Story = {
  parameters: {
    // Override de story: o assunto é o modo modal, e o snippet do meta mostra
    // um painel só de texto — sem focável nenhum, não haveria prisão para ver.
    docs: {
      source: {
        transform: popoverSourceActions({ title: 'Popover modal', modal: true, defaultOpen: true }),
      },
      description: {
        story:
          'Modo modal — o foco fica preso no painel, a rolagem da página trava e o painel se anuncia como diálogo modal. As três coisas andam juntas: anunciar inércia sem prender o foco engana quem navega por leitor de tela.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir modal' });

    const content = document.createElement('div');
    content.className = 'nds-stack';
    content.dataset.spacing = 'sm';
    content.appendChild(createPopoverTitle({ text: 'Popover modal' }));

    // DOIS focáveis de propósito: com um só, "o Tab do último volta ao
    // primeiro" seria verdade sem laço nenhum — primeiro e último seriam o
    // mesmo elemento, e a asserção nasceria sem dentes.
    const actions = document.createElement('div');
    actions.className = 'nds-cluster';
    actions.dataset.spacing = 'sm';
    actions.dataset.justify = 'end';
    actions.append(
      createButton({ variant: 'ghost', size: 'sm', label: 'Cancelar' }),
      createButton({ variant: 'default', size: 'sm', label: 'Confirmar' }),
    );
    content.appendChild(actions);

    const el = createPopover({ trigger, content, modal: true });
    return empilharCentrado([el]);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /abrir modal/i });

    await step('O painel abre em modo modal e anuncia aria-modal', async () => {
      const p = await open(trigger);
      await expect(p).toBeVisible();
      // Tem dentes nos DOIS sentidos: reprova se alguém anunciar `aria-modal`
      // sem prender o foco e reprova se o modo modal deixar de anunciar.
      await expect(p).toHaveAttribute('aria-modal', 'true');
    });

    await step('Tab a partir do último focável NÃO sai do painel', async () => {
      // ─── A asserção com CONTROLE NEGATIVO ───────────────────────────────
      //
      // Provar a prisão com `painel.contains(document.activeElement)` SEM
      // tabular não mede nada: o foco está dentro do painel no modo não-modal
      // também, nas cinco stacks — é o contrato `functional.item1`. Essa
      // asserção não pode reprovar, e é a forma exata da asserção que guarda o
      // bug; foi encontrada assim em duas stacks desta família.
      //
      // O par desta asserção está na story Focused, que é a não-modal: lá a
      // MESMA tecla, no MESMO lugar, tem de tirar o foco do painel.
      const p = panel()!;
      const cancelar = within(p).getByRole('button', { name: /cancelar/i });
      const confirmar = within(p).getByRole('button', { name: /confirmar/i });

      confirmar.focus();
      await expect(confirmar).toHaveFocus();

      await userEvent.tab();

      await expect(p.contains(document.activeElement)).toBe(true);
      await expect(cancelar).toHaveFocus();
    });

    await step('E Shift+Tab a partir do primeiro volta ao último', async () => {
      const p = panel()!;
      const cancelar = within(p).getByRole('button', { name: /cancelar/i });
      const confirmar = within(p).getByRole('button', { name: /confirmar/i });

      cancelar.focus();
      await userEvent.tab({ shift: true });

      await expect(p.contains(document.activeElement)).toBe(true);
      await expect(confirmar).toHaveFocus();
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

export const ListenerCleanup: Story = {
  parameters: {
    controls: { disable: true },
    // A story existe para o que acontece DEPOIS da saída do nó: a foto seria
    // sempre a mesma legenda.
    chromatic: { disable: true },
    // Override de story: o assunto é a limpeza, e a linha de `destroy()` é
    // justamente o que o snippet do meta não mostra.
    docs: {
      source: {
        transform: popoverSourceWith({
          triggerLabel: 'Abrir',
          text: 'Conteúdo do popover.',
          destroy: true,
        }),
      },
    },
  },
  render: () => probeHost(
    'Sonda de limpeza: o popover é montado, aberto e removido da página pela play.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let probe!: ProbeResult;

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      probe = await sondarOuvintes({
        host: host as HTMLElement,
        montar: () => {
          const content = document.createElement('p');
          content.textContent = 'Conteúdo do popover.';
          return createPopover({
            trigger: createButton({ variant: 'outline', label: 'Abrir' }),
            content: content,
          });
        },
        exercitar: (no) => no.querySelector<HTMLElement>('button')?.click(),
        seletorDePortal: '[data-slot="popover-content"]',
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await checkLimpeza(probe);
    });
  },
};
