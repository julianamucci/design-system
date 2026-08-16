import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createPopover } from './popover';
import { createButton } from './button';
import { sondarOuvintes, hospedeiroDeSonda, conferirLimpeza, type ResultadoDaSonda } from './leak-probe';

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/Popover/States',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Popover: fechado (painel fora do DOM), aberto, ancorado acima, ' +
          'controlado por fora e com foco dentro do painel. Fechado o painel não é um ' +
          'elemento escondido — é um elemento que não existe.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrap(...children: HTMLElement[]): HTMLElement {
  const w = document.createElement('div');
  w.style.contain = 'layout';
  w.className = 'nds-stack nds-w-full';
  w.dataset.spacing = 'sm';
  w.dataset.align = 'center';
  w.style.minHeight = '280px';
  w.append(...children);
  return w;
}

function painel(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-slot="popover-content"]');
}

function buildSimpleContent(text: string): HTMLElement {
  const c = document.createElement('div');
  c.className = 'nds-stack';
  c.dataset.spacing = 'xs';

  const title = document.createElement('h4');
  title.className = 'nds-popover-title';
  title.dataset.slot = 'popover-title';
  title.textContent = 'Configuracoes de exibição';

  const p = document.createElement('p');
  p.className = 'nds-popover-description';
  p.dataset.slot = 'popover-description';
  p.textContent = text;

  c.append(title, p);
  return c;
}

/** Abre só se estiver fechado — a play REEXECUTA no mesmo DOM. */
async function abrir(gatilho: HTMLElement): Promise<HTMLElement> {
  if (gatilho.getAttribute('aria-expanded') !== 'true') await userEvent.click(gatilho);
  await waitFor(() => {
    if (!painel()) throw new Error('popover ainda fechado');
  }, { timeout: 1500 });
  return painel()!;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Closed: Story = {
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir popover' });
    const el = createPopover({ trigger, content: buildSimpleContent('Conteúdo desmontado enquanto fechado.') });
    return wrap(el);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /abrir popover/i });

    await step('Fechado, o painel não existe no DOM', async () => {
      // Desmontado, e não escondido: leitor de tela e busca do navegador não
      // encontram conteúdo que não está lá.
      await expect(painel()).toBeNull();
      await expect(gatilho).toBeVisible();
    });

    await step('E o gatilho declara o estado nos dois contratos', async () => {
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
      await expect(gatilho).toHaveAttribute('data-state', 'closed');
      // Sem painel não há id para apontar — o atributo some, senão o axe
      // reprovaria por aria-valid-attr-value.
      await expect(gatilho.getAttribute('aria-controls')).toBeNull();
    });
  },
};

export const Open: Story = {
  parameters: { covers: ['accessibility.item1', 'accessibility.item2'] },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir popover' });
    const el = createPopover({ trigger, content: buildSimpleContent('Ajuste a aparência do conteúdo da página.') });
    queueMicrotask(() => trigger.click());
    return wrap(el);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /abrir popover/i });

    // Story SEM interação de fechamento: termina aberta de propósito, porque é
    // este estado que o axe varre (contraste e ARIA do painel) e que o
    // Chromatic fotografa.
    await step('O painel está aberto e declarado nos dois contratos', async () => {
      const p = await abrir(gatilho);
      await expect(p).toBeVisible();
      await expect(p).toHaveAttribute('data-state', 'open');
      await expect(gatilho).toHaveAttribute('aria-expanded', 'true');
      await expect(gatilho).toHaveAttribute('data-state', 'open');
    });

    await step('E é nomeado pelo título que ele mesmo carrega', async () => {
      const id = painel()!.getAttribute('aria-labelledby');
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)?.textContent).toMatch(/Configuracoes de exibição/);
    });
  },
};

export const SideTop: Story = {
  parameters: { covers: ['visual.item4'] },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir acima' });
    const el = createPopover({
      trigger,
      content: buildSimpleContent('Sem espaço acima, o painel vira para baixo sozinho.'),
      side: 'top',
    });
    queueMicrotask(() => trigger.click());
    const w = wrap(el);
    // Espaço acima do gatilho, senão o painel não caberia e a story mediria o
    // recurso oposto ao que documenta.
    w.style.paddingTop = 'var(--spacing-8)';
    return w;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /abrir acima/i });

    await step('O painel é posicionado acima do gatilho', async () => {
      const p = await abrir(gatilho);
      const rg = gatilho.getBoundingClientRect();
      const rp = p.getBoundingClientRect();
      await expect(rp.bottom).toBeLessThanOrEqual(rg.top + 1);
    });

    await step('E continua alinhado ao gatilho no outro eixo', async () => {
      const rg = gatilho.getBoundingClientRect();
      const rp = painel()!.getBoundingClientRect();
      const centroGatilho = rg.left + rg.width / 2;
      const centroPainel = rp.left + rp.width / 2;
      await expect(Math.abs(centroGatilho - centroPainel)).toBeLessThanOrEqual(2);
    });
  },
};

export const Controlled: Story = {
  parameters: { covers: ['functional.item3'] },
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

    return wrap(status, externalBtn, el, externo);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /abrir popover/i });
    const externo = canvas.getByRole('button', { name: /toggle externo/i });

    await step('O botão externo abre o painel e o estado sai por onOpenChange', async () => {
      if (gatilho.getAttribute('aria-expanded') === 'true') await userEvent.click(externo);
      await userEvent.click(externo);
      await waitFor(() => {
        if (!painel()) throw new Error('popover ainda fechado');
      }, { timeout: 1500 });
      await expect(canvas.getByTestId('estado')).toHaveTextContent('open=true');
      await expect(gatilho).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Clicar fora do painel fecha o popover', async () => {
      await abrir(gatilho);
      await userEvent.click(canvas.getByTestId('area-externa'));
      await waitFor(() => {
        if (painel()) throw new Error('popover ainda aberto');
      }, { timeout: 1500 });
      await expect(canvas.getByTestId('estado')).toHaveTextContent('open=false');
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Estado final: painel aberto', async () => {
      await expect(await abrir(gatilho)).toBeVisible();
    });
  },
};

export const Focused: Story = {
  parameters: { covers: ['functional.item4', 'accessibility.item3'] },
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
    return wrap(el);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /abrir popover/i });

    await step('O foco entra no painel, no primeiro elemento focável', async () => {
      const p = await abrir(gatilho);
      await waitFor(() => {
        if (!p.contains(document.activeElement)) throw new Error('foco não entrou no painel');
      });
      await expect(within(p).getByRole('button', { name: /cancelar/i })).toHaveFocus();
    });

    await step('Tab caminha entre os controles internos', async () => {
      const p = painel()!;
      const cancelar = within(p).getByRole('button', { name: /cancelar/i });
      const confirmar = within(p).getByRole('button', { name: /confirmar/i });
      cancelar.focus();
      await userEvent.tab();
      await expect(confirmar).toHaveFocus();
    });

    await step('E o elemento focado por teclado mostra o anel de foco', async () => {
      // `:focus-visible` é a condição exata que o CSS compartilhado usa para
      // desenhar o anel — se o foco tivesse vindo do ponteiro, o navegador não
      // casaria a pseudo-classe e o anel não apareceria.
      const confirmar = within(painel()!).getByRole('button', { name: /confirmar/i });
      await expect(confirmar.matches(':focus-visible')).toBe(true);
      // O anel de `.nds-button` é box-shadow, não outline — medir a propriedade
      // errada daria verde em qualquer elemento.
      await expect(getComputedStyle(confirmar).boxShadow).not.toBe('none');
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
  },
  render: () => hospedeiroDeSonda(
    'Sonda de limpeza: o popover é montado, aberto e removido da página pela play.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let sonda!: ResultadoDaSonda;

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      sonda = await sondarOuvintes({
        host: host as HTMLElement,
        montar: () => {
          const conteudo = document.createElement('p');
          conteudo.textContent = 'Conteúdo do popover.';
          return createPopover({
            trigger: createButton({ variant: 'outline', label: 'Abrir' }),
            content: conteudo,
          });
        },
        exercitar: (no) => no.querySelector<HTMLElement>('button')?.click(),
        seletorDePortal: '[data-slot="popover-content"]',
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await conferirLimpeza(sonda);
    });
  },
};
