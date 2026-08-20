import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, waitFor } from 'storybook/test';
import { createTooltip, createTooltipProvider } from './tooltip';
import { balaoDe, limparPortal, wrap } from './tooltip.fixtures';
import { tooltipSource, tooltipSourceCom, tooltipSourceLados } from './tooltip.source';
import { createButton, createButtonIcon } from './button';

// As composições que o conteúdo compartilhado documenta, mais os quatro lados de
// posicionamento. Em todas, o Tooltip acrescenta contexto a um elemento que JÁ
// se explica sozinho — nunca é o único portador da informação.
//
// A moldura destas composições reserva 200px: são maiores que as stories de
// estados e variantes, que ficam no padrão de 180px do `wrap`.
const ALTURA_DA_COMPOSICAO = '200px';

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/Tooltip/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: tooltipSource },
      description: {
        component:
          'Botão de ação rápida com atalho, ajuda ao lado do rótulo de um campo, definição de sigla no cabeçalho de uma métrica e os quatro lados de posicionamento. O Tooltip NÃO substitui o aria-label: em touch não há hover, e o nome do botão precisa existir sem ele.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const IconButtonWithShortcut: Story = {
  parameters: {
    docs: {
      source: {
        transform: tooltipSourceCom({
          triggerVariant: 'ghost',
          triggerSize: 'icon',
          triggerLabel: '',
          triggerAriaLabel: 'Salvar',
          content: 'Salvar (Ctrl+S)',
          side: 'bottom',
        }),
      },
    },
  },
  render: () => {
    const iconWrap = document.createElement('span');
    iconWrap.setAttribute('aria-hidden', 'true');
    iconWrap.appendChild(createButtonIcon('download'));

    const trigger = createButton({
      variant: 'ghost',
      size: 'icon',
      'aria-label': 'Salvar',
      children: iconWrap,
    });

    const el = createTooltip({ trigger, content: 'Salvar (Ctrl+S)', side: 'bottom' });
    queueMicrotask(() => trigger.focus());
    return wrap(el, ALTURA_DA_COMPOSICAO);
  },
  play: async ({ canvasElement, step }) => {
    const gatilho = within(canvasElement).getByRole('button', { name: /salvar/i });

    await step('O nome acessível é do botão; o atalho é o extra', async () => {
      // A ordem importa: o `aria-label` sozinho já diz o que o botão faz. O
      // Tooltip acrescenta a tecla, que é conveniência, não requisito.
      await expect(gatilho).toHaveAttribute('aria-label', 'Salvar');
      gatilho.blur();
      gatilho.focus();
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      await expect(balaoDe(gatilho)!.textContent).toMatch(/Ctrl\+S/);
    });

    await step('Cleanup', async () => { limparPortal(); });
  },
};

export const HelpInFormField: Story = {
  name: 'Form field with help',
  parameters: {
    docs: {
      source: {
        transform: tooltipSourceCom({
          triggerVariant: 'ghost',
          triggerSize: 'icon-sm',
          triggerLabel: '?',
          triggerAriaLabel: 'Onde encontrar o Token de API',
          content: 'Gere em Configurações › Acesso › Tokens.',
          side: 'right',
        }),
      },
    },
  },
  render: () => {
    const root = document.createElement('div');
    root.className = 'nds-stack';
    root.dataset.spacing = 'sm';
    root.style.alignItems = 'flex-start';

    const labelRow = document.createElement('div');
    labelRow.className = 'nds-cluster';
    labelRow.dataset.spacing = 'sm';

    const label = document.createElement('label');
    label.className = 'nds-text-body nds-font-medium';
    label.textContent = 'Token de API';
    label.htmlFor = 'api-token-input';

    const help = createButton({
      variant: 'ghost',
      size: 'icon-sm',
      'aria-label': 'Onde encontrar o Token de API',
      label: '?',
    });

    const tooltip = createTooltip({
      trigger: help,
      content: 'Gere em Configurações › Acesso › Tokens.',
      side: 'right',
    });

    labelRow.append(label, tooltip);

    const input = document.createElement('input');
    input.id = 'api-token-input';
    input.type = 'text';
    input.className = 'nds-input';
    input.placeholder = 'ndsk_...';

    root.append(labelRow, input);
    queueMicrotask(() => help.focus());
    return wrap(root, ALTURA_DA_COMPOSICAO);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /Onde encontrar o Token de API/i });

    await step('O campo continua rotulado pelo label, não pelo Tooltip', async () => {
      // O `for`/`id` é o que nomeia o campo. O Tooltip explica ONDE achar o
      // valor — informação complementar, que pode faltar sem quebrar o form.
      const campo = canvas.getByLabelText('Token de API');
      await expect(campo).toHaveAttribute('id', 'api-token-input');
    });

    await step('O ícone de ajuda é um botão focável, com nome próprio', async () => {
      gatilho.blur();
      gatilho.focus();
      await expect(gatilho).toHaveFocus();
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      await expect(balaoDe(gatilho)!.textContent).toContain('Tokens');
    });

    await step('Cleanup', async () => { limparPortal(); });
  },
};

export const MetricDescription: Story = {
  parameters: {
    docs: {
      source: {
        transform: tooltipSourceCom({
          triggerVariant: 'ghost',
          triggerSize: 'icon-sm',
          triggerLabel: 'i',
          triggerAriaLabel: 'O que é LCP',
          content: 'LCP — Largest Contentful Paint',
        }),
      },
    },
  },
  render: () => {
    const root = document.createElement('div');
    root.className = 'nds-stack';
    root.dataset.spacing = 'xs';
    root.style.alignItems = 'flex-start';

    const headerRow = document.createElement('div');
    headerRow.className = 'nds-cluster';
    headerRow.dataset.spacing = 'sm';

    const title = document.createElement('p');
    title.className = 'nds-text-caption nds-font-medium nds-text-muted-foreground nds-uppercase nds-tracking-wider';
    title.textContent = 'LCP';

    const help = createButton({
      variant: 'ghost',
      size: 'icon-sm',
      'aria-label': 'O que é LCP',
      label: 'i',
    });

    const tooltip = createTooltip({
      trigger: help,
      content: 'LCP — Largest Contentful Paint',
      side: 'top',
    });

    headerRow.append(title, tooltip);

    const value = document.createElement('p');
    value.className = 'nds-text-h3 nds-font-semibold';
    value.textContent = '1,8 s';

    root.append(headerRow, value);
    queueMicrotask(() => help.focus());
    return wrap(root, ALTURA_DA_COMPOSICAO);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /O que é LCP/i });

    await step('A sigla fica visível; o Tooltip só a expande', async () => {
      await expect(canvasElement.textContent).toContain('LCP');
      gatilho.blur();
      gatilho.focus();
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      await expect(balaoDe(gatilho)!.textContent).toContain('Largest Contentful Paint');
    });

    await step('Cleanup', async () => { limparPortal(); });
  },
};

export const PlacementSides: Story = {
  parameters: {
    covers: ['visual.item3'],
    // Override: a story mostra os QUATRO lados, e um balão só não diria isso.
    docs: { source: { transform: tooltipSourceLados } },
  },
  render: () => {
    const grid = document.createElement('div');
    grid.style.contain = 'layout';
    grid.className = 'nds-grid nds-w-full nds-p-8';
    grid.dataset.cols = '2';
    grid.dataset.spacing = 'xl';
    grid.style.minHeight = '240px';

    const lados: Array<'top' | 'right' | 'bottom' | 'left'> = ['top', 'right', 'bottom', 'left'];

    for (const side of lados) {
      const trigger = createButton({ variant: 'outline', label: side, 'aria-label': side });
      grid.appendChild(createTooltip({ trigger, content: `Tooltip ${side}`, side }));
      queueMicrotask(() => {
        trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      });
    }

    return wrap(grid, '260px');
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const baloes = () =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-slot="tooltip-content"]'));

    await step('Os quatro balões abrem ao mesmo tempo', async () => {
      await waitFor(
        async () => {
          await expect(baloes().length).toBe(4);
        },
        { timeout: 3000 },
      );
    });

    await step('Cada balão nasce do lado pedido', async () => {
      for (const lado of ['top', 'right', 'bottom', 'left']) {
        const gatilho = canvas.getByRole('button', { name: lado });
        // A factory posiciona por JS e publica o lado escolhido em `data-side`
        // — o mesmo gancho que as outras stacks emitem.
        await expect(balaoDe(gatilho)).toHaveAttribute('data-side', lado);
        await expect(balaoDe(gatilho)!.textContent).toBe(`Tooltip ${lado}`);
      }
    });

    await step('Cleanup', async () => { limparPortal(); });
  },
};

// ─── Grupo com espera compartilhada e conteúdo com marcação ───────────────────
//
// Duas faltas de uma vez. A espera era constante de MÓDULO: a página inteira
// tinha de concordar com 300ms, e ajustar a barra de ícones significava ajustar
// todo balão do produto. E `content` era só `string`, então um atalho em `<kbd>`
// não tinha como entrar — a alternativa seria HTML em string, que a guideline
// 09 fecha.

export const ProviderWithMarkup: Story = {
  parameters: {
    docs: {
      source: {
        transform: tooltipSourceCom({
          provider: { delayDuration: 3000, skipDelayDuration: 5000 },
          triggerLabel: 'Copiar',
          content: 'Copiar',
          contentComMarcacao: true,
          side: 'bottom',
        }),
      },
      description: {
        story:
          'Uma barra de ícones com espera própria: o provedor guarda o padrão do grupo, e o ' +
          'balão seguinte abre na hora enquanto a janela de dispensa dura. O conteúdo entra ' +
          'como elemento, que é como a tecla do atalho ganha desenho próprio.',
      },
    },
  },
  render: () => {
    const barra = document.createElement('div');
    barra.className = 'nds-cluster';
    barra.dataset.spacing = 'xs';

    // Espera longa de propósito: é ela que torna a dispensa MENSURÁVEL. Sem a
    // janela do grupo, o segundo balão levaria três segundos para aparecer, e a
    // asserção da play falha por tempo. Uma espera por chamada é justamente o
    // que a constante de módulo não permitia.
    const grupo = createTooltipProvider({ delayDuration: 3000, skipDelayDuration: 5000 });

    for (const [acao, tecla] of [['Copiar', 'C'], ['Colar', 'V']] as const) {
      const trigger = createButton({ variant: 'outline', label: acao, 'aria-label': acao });

      const conteudo = document.createElement('span');
      conteudo.append(`${acao} `);
      const kbd = document.createElement('kbd');
      kbd.textContent = `Ctrl+${tecla}`;
      conteudo.appendChild(kbd);

      barra.appendChild(grupo.createTooltip({ trigger, content: conteudo, side: 'bottom' }));
    }

    return wrap(barra, ALTURA_DA_COMPOSICAO);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const copiar = canvas.getByRole('button', { name: 'Copiar' });
    const colar = canvas.getByRole('button', { name: 'Colar' });

    await step('A marcação chega ao balão como marcação, não como texto', async () => {
      copiar.focus();
      await waitFor(async () => {
        await expect(balaoDe(copiar)).not.toBeNull();
      });
      const balao = balaoDe(copiar)!;
      // Uma string teria virado o literal "<kbd>Ctrl+C</kbd>" na tela.
      await expect(balao.querySelector('kbd')?.textContent).toBe('Ctrl+C');
      await expect(balao.textContent).toMatch(/Copiar Ctrl\+C/);
    });

    await step('Dentro da janela do grupo, o balão seguinte abre sem esperar', async () => {
      copiar.blur();
      await waitFor(async () => {
        await expect(balaoDe(copiar)).toBeNull();
      });
      // `mouseenter` e não `focus`: o foco já abria na hora antes de existir
      // grupo nenhum, e provaria a coisa errada. Quem espera é o ponteiro.
      //
      // O prazo é a prova: a espera do grupo é de 3s, então um balão que
      // aparece dentro de 1s só pode ter pulado a fila.
      colar.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await waitFor(
        async () => {
          await expect(balaoDe(colar)).not.toBeNull();
        },
        { timeout: 1000 },
      );
      await expect(balaoDe(colar)!.querySelector('kbd')?.textContent).toBe('Ctrl+V');
    });

    await step('Cleanup', async () => { limparPortal(); });
  },
};
