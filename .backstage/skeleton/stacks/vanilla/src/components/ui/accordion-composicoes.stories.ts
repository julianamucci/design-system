import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createAccordion, type AccordionOptions } from './accordion';
import { createBadge } from './badge';
import { Info, AlertTriangle, CheckCircle2 } from 'lucide';

const meta: Meta = {
  title: 'UI/Accordion/Composições',
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type LucideIconNode = [string, Record<string, string>];

function createIcon(nodes: LucideIconNode[]): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'h-4 w-4 shrink-0');
  for (const [tag, attrs] of nodes) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

function makeIconTrigger(nodes: LucideIconNode[], text: string): HTMLElement {
  const span = document.createElement('span');
  span.className = 'flex items-center gap-2';
  span.appendChild(createIcon(nodes));
  const label = document.createElement('span');
  label.textContent = text;
  span.appendChild(label);
  return span;
}

// ─── Com Ícone no Trigger ─────────────────────────────────────────────────────

export const ComIconeNoTrigger: Story = {
  render: () => {
    const root = document.createElement('div');
    root.className = 'w-full max-w-lg';

    const iconItems = [
      { value: 'info',    nodes: Info as unknown as LucideIconNode[],          label: 'Informação',   content: 'Ícones facilitam a identificação rápida do tipo de conteúdo. Adicione aria-hidden="true" no ícone.' },
      { value: 'warning', nodes: AlertTriangle as unknown as LucideIconNode[],  label: 'Aviso',        content: 'Sinalize categorias distintas com ícones semânticos. O texto do trigger já descreve para leitores de tela.' },
      { value: 'success', nodes: CheckCircle2 as unknown as LucideIconNode[],   label: 'Confirmação',  content: 'Use ícones consistentes entre itens do mesmo accordion para criar padrão visual.' },
    ];

    const accordion = createAccordion({
      type: 'single',
      collapsible: true,
      items: iconItems.map(({ value, label, content }) => ({ value, trigger: label, content })),
    });

    // Replace plain trigger text with icon+text
    iconItems.forEach(({ value, nodes, label }) => {
      const trigger = accordion.querySelector<HTMLButtonElement>(`[data-value="${value}"]`);
      if (!trigger) return;
      const span = trigger.querySelector('span');
      if (!span) return;
      const wrapper = makeIconTrigger(nodes, label);
      span.replaceWith(wrapper);
    });

    root.appendChild(accordion);
    return root;
  },
  parameters: {
    docs: {
      description: {
        story: 'Ícones no trigger. Adicione aria-hidden="true" no ícone — o texto do trigger já descreve o item para leitores de tela.',
      },
    },
  },
};

// ─── Com Badge no Trigger ────────────────────────────────────────────────────

export const ComBadgeNoTrigger: Story = {
  render: () => {
    const root = document.createElement('div');
    root.className = 'w-full max-w-lg';

    const badgeItems = [
      { value: 'novo',  label: 'Novidades da versão 3.0',  badge: 'Novo',  variant: 'default' as const,    content: 'Conteúdo das novidades. Use badges para sinalizar status sem alterar o trigger textual.' },
      { value: 'beta',  label: 'Funcionalidades em beta',   badge: 'Beta',  variant: 'secondary' as const,  content: 'Funcionalidades beta podem mudar. Feedback é bem-vindo.' },
    ];

    const accordion = createAccordion({
      type: 'single',
      collapsible: true,
      items: badgeItems.map(({ value, label, content }) => ({ value, trigger: label, content })),
    });

    // Replace plain trigger spans with label+badge
    badgeItems.forEach(({ value, label, badge, variant }) => {
      const trigger = accordion.querySelector<HTMLButtonElement>(`[data-value="${value}"]`);
      if (!trigger) return;
      const span = trigger.querySelector('span');
      if (!span) return;
      const wrapper = document.createElement('span');
      wrapper.className = 'flex items-center gap-2';
      wrapper.textContent = label;
      const badgeEl = createBadge({ text: badge, variant, className: 'text-[10px] h-4' });
      wrapper.appendChild(badgeEl);
      span.replaceWith(wrapper);
    });

    root.appendChild(accordion);
    return root;
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge no trigger para sinalizar status (Novo, Beta). O badge é decorativo — o texto do trigger deve ser autoexplicativo.',
      },
    },
  },
};

// ─── Conteúdo Rico ────────────────────────────────────────────────────────────

export const ConteudoRico: Story = {
  render: () => {
    const root = document.createElement('div');
    root.className = 'w-full max-w-lg';

    const accordion = createAccordion({
      type: 'multiple',
      items: [
        { value: 'layout',   trigger: 'Layout e Espaçamento', content: '' },
        { value: 'tipografia', trigger: 'Tipografia',         content: '' },
      ],
    });

    // Replace plain text content with rich HTML
    const layoutContent = accordion.querySelector<HTMLElement>('[data-content-for="layout"] div');
    if (layoutContent) {
      layoutContent.innerHTML = `
        <div class="space-y-2 text-sm">
          <div class="grid grid-cols-2 gap-2 font-medium">
            <span class="text-muted-foreground">Propriedade</span>
            <span class="text-muted-foreground">Valor</span>
          </div>
          <div class="grid grid-cols-2 gap-2 border-t pt-2"><span>Gutter</span><code class="text-xs bg-muted px-1 rounded">24px</code></div>
          <div class="grid grid-cols-2 gap-2 border-t pt-2"><span>Margem mobile</span><code class="text-xs bg-muted px-1 rounded">16px</code></div>
          <div class="grid grid-cols-2 gap-2 border-t pt-2"><span>Colunas</span><code class="text-xs bg-muted px-1 rounded">12</code></div>
        </div>`;
    }

    const tipoContent = accordion.querySelector<HTMLElement>('[data-content-for="tipografia"] div');
    if (tipoContent) {
      tipoContent.innerHTML = `
        <ul class="space-y-1 text-sm list-none p-0">
          <li class="flex items-center gap-2"><code class="text-xs bg-muted px-1 rounded">text-xs</code><span>12px — legendas e labels</span></li>
          <li class="flex items-center gap-2"><code class="text-xs bg-muted px-1 rounded">text-sm</code><span>14px — corpo principal</span></li>
          <li class="flex items-center gap-2"><code class="text-xs bg-muted px-1 rounded">text-base</code><span>16px — títulos de seção</span></li>
        </ul>`;
    }

    root.appendChild(accordion);
    return root;
  },
  parameters: {
    docs: {
      description: {
        story: 'AccordionContent aceita qualquer HTML. Use para tabelas de dados, parágrafos ou listas estruturadas.',
      },
    },
  },
};

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ_ITEMS: AccordionOptions['items'] = [
  { value: 'senha',        trigger: 'Como faço para redefinir minha senha?',   content: 'Acesse a tela de login e clique em "Esqueci minha senha". Você receberá um link de redefinição no email cadastrado, válido por 24 horas.' },
  { value: 'pagamento',    trigger: 'Quais formas de pagamento são aceitas?',   content: 'Aceitamos cartão de crédito, Pix e boleto bancário. Parcelamento disponível em até 12 vezes sem juros no cartão.' },
  { value: 'cancelamento', trigger: 'Como cancelo minha assinatura?',          content: 'Você pode cancelar a qualquer momento em Configurações → Assinatura. O acesso permanece ativo até o fim do período já pago.' },
  { value: 'dados',        trigger: 'Onde encontro meus dados de acesso?',     content: 'Seus dados de acesso estão disponíveis em Configurações → Conta.' },
];

export const FAQ: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'w-full max-w-lg space-y-2';

    const heading = document.createElement('h2');
    heading.className = 'text-base font-semibold';
    heading.textContent = 'Perguntas frequentes';

    wrapper.append(heading, createAccordion({ type: 'single', collapsible: true, items: FAQ_ITEMS }));
    return wrapper;
  },
  parameters: {
    docs: {
      description: {
        story: 'Padrão FAQ canônico. Perguntas interrogativas completas no trigger. Respostas objetivas em 2–3 linhas no content.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Todos os triggers estão fechados por padrão', async () => {
      for (const trigger of triggers) {
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      }
    });

    await step('Clicar no primeiro abre apenas ele', async () => {
      await userEvent.click(triggers[0]);
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
