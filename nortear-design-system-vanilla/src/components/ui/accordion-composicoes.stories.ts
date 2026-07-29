import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect , waitFor } from 'storybook/test';
import DOMPurify from 'dompurify';
import { createAccordion, type AccordionOptions } from './accordion';
import { createBadge } from './badge';
import { Info, AlertTriangle, CheckCircle2 } from 'lucide';

const meta: Meta = {
  tags: ['disclosure'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Accordion/Composicoes',
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type LucideIconNode = [string, Record<string, string>];

function createIcon(nodes: LucideIconNode[], tone: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  // nds-icon (16px) e não nds-icon-sm (14px): fica na mesma linha do chevron,
  // que é 16px — ver .nds-accordion-icon.
  svg.setAttribute('class', `nds-icon ${tone} nds-shrink-0`);
  for (const [tag, attrs] of nodes) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

function makeIconTrigger(nodes: LucideIconNode[], text: string, tone: string): HTMLElement {
  const span = document.createElement('span');
  span.className = 'nds-cluster';
  span.dataset.spacing = 'sm';
  span.appendChild(createIcon(nodes, tone));
  const label = document.createElement('span');
  label.textContent = text;
  span.appendChild(label);
  return span;
}

// ─── Com Ícone no Trigger ─────────────────────────────────────────────────────

export const ComIconeNoTrigger: Story = {
  render: () => {
    const root = document.createElement('div');
    root.className = 'nds-w-full nds-max-w-lg';

    const iconItems = [
      { value: 'info',    nodes: Info as unknown as LucideIconNode[],          tone: 'nds-text-info',    label: 'Informação',   content: 'Ícones facilitam a identificação rápida do tipo de conteúdo. Adicione aria-hidden="true" no ícone.' },
      { value: 'warning', nodes: AlertTriangle as unknown as LucideIconNode[],  tone: 'nds-text-warning', label: 'Aviso',        content: 'Sinalize categorias distintas com ícones semânticos. O texto do trigger já descreve para leitores de tela.' },
      { value: 'success', nodes: CheckCircle2 as unknown as LucideIconNode[],   tone: 'nds-text-success', label: 'Confirmação',  content: 'Use ícones consistentes entre itens do mesmo accordion para criar padrão visual.' },
    ];

    const accordion = createAccordion({
      type: 'single',
      collapsible: true,
      items: iconItems.map(({ value, label, content }) => ({ value, trigger: label, content })),
    });

    // Replace plain trigger text with icon+text
    iconItems.forEach(({ value, nodes, label, tone }) => {
      const trigger = accordion.querySelector<HTMLButtonElement>(`[data-value="${value}"]`);
      if (!trigger) return;
      const span = trigger.querySelector('span');
      if (!span) return;
      const wrapper = makeIconTrigger(nodes, label, tone);
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Trigger é acessível pelo texto (não pelo ícone)', async () => {
      const trigger = canvas.getAllByRole('button')[0];
      await expect(trigger).toBeInTheDocument();
      await expect(trigger.textContent?.trim()).not.toBe('');
    });

    await step('Clicar no trigger abre o item correspondente', async () => {
      const trigger = canvas.getAllByRole('button')[0];
      await userEvent.click(trigger);
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    });
  },
};

// ─── Com Badge no Trigger ────────────────────────────────────────────────────

export const ComBadgeNoTrigger: Story = {
  render: () => {
    const root = document.createElement('div');
    root.className = 'nds-w-full nds-max-w-lg';

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
      wrapper.className = 'nds-cluster';
      wrapper.dataset.spacing = 'sm';
      wrapper.textContent = label;
      const badgeEl = createBadge({ text: badge, variant });
      badgeEl.style.fontSize = '10px';
      badgeEl.style.height = '1rem';
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Trigger contém label e badge visíveis', async () => {
      const trigger = canvas.getAllByRole('button')[0];
      await expect(trigger).toBeInTheDocument();
      await expect(trigger.textContent).toContain('Novo');
    });

    await step('Clicar abre o item correspondente', async () => {
      const trigger = canvas.getAllByRole('button')[0];
      await userEvent.click(trigger);
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    });
  },
};

// ─── Conteúdo Rico ────────────────────────────────────────────────────────────

export const ConteudoRico: Story = {
  render: () => {
    const root = document.createElement('div');
    root.className = 'nds-w-full nds-max-w-lg';

    const accordion = createAccordion({
      type: 'multiple',
      items: [
        { value: 'specs',  trigger: 'Especificações técnicas', content: '' },
        { value: 'inclui', trigger: 'O que está incluso',      content: '' },
      ],
    });

    // Conteúdo rico substitui o texto simples. Tabela de verdade, não grid:
    // `.nds-grid[data-cols="2"]` exige 18rem por coluna e colapsa dentro do
    // accordion. Mesmo exemplo da docs page.
    const specsContent = accordion.querySelector<HTMLElement>('[data-content-for="specs"] div');
    if (specsContent) {
      specsContent.innerHTML = DOMPurify.sanitize(`
        <table class="nds-w-full nds-text-body nds-border-collapse">
          <tbody>
            <tr class="nds-border-b"><td class="nds-py-1" style="padding-right:1rem">CPU</td><td class="nds-py-1">Intel Core i7-12700</td></tr>
            <tr class="nds-border-b"><td class="nds-py-1" style="padding-right:1rem">RAM</td><td class="nds-py-1">16GB DDR5</td></tr>
            <tr><td class="nds-py-1" style="padding-right:1rem">SSD</td><td class="nds-py-1">512GB NVMe</td></tr>
          </tbody>
        </table>`);
    }

    const incluiContent = accordion.querySelector<HTMLElement>('[data-content-for="inclui"] div');
    if (incluiContent) {
      incluiContent.innerHTML = DOMPurify.sanitize(`
        <ul class="nds-stack nds-text-body nds-list-disc" data-spacing="xs">
          <li>Cabo de alimentação</li>
          <li>Manual do usuário</li>
          <li>Garantia de 24 meses</li>
        </ul>`);
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Abrir o item renderiza o conteúdo rico (especificações)', async () => {
      const triggers = canvas.getAllByRole('button');
      await userEvent.click(triggers[0]);
      await waitFor(() => expect(triggers[0]).toHaveAttribute('aria-expanded', 'true'));
      await expect(canvasElement.textContent).toContain('Intel Core i7-12700');
    });

    await step('Modo múltiplo: segundo item abre sem fechar o primeiro', async () => {
      const triggers = canvas.getAllByRole('button');
      await userEvent.click(triggers[1]);
      await waitFor(() => expect(triggers[1]).toHaveAttribute('aria-expanded', 'true'));
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ_ITEMS: AccordionOptions['items'] = [
  { value: 'senha',        trigger: 'Como faço para redefinir minha senha?',   content: 'Acesse a tela de login e clique em "Esqueci minha senha". Você receberá um link de redefinição no email cadastrado, válido por 24 horas.' },
  { value: 'pagamento',    trigger: 'Quais formas de pagamento são aceitas?',   content: 'Aceitamos cartão de crédito, Pix e boleto bancário. Parcelamento disponível em até 12 vezes sem juros no cartão.' },
  { value: 'cancelamento', trigger: 'Como cancelo minha assinatura?',          content: 'Você pode cancelar a qualquer momento em Configuracoes → Assinatura. O acesso permanece ativo até o fim do período já pago.' },
  { value: 'dados',        trigger: 'Onde encontro meus dados de acesso?',     content: 'Seus dados de acesso estão disponíveis em Configuracoes → Conta.' },
];

export const FAQ: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack nds-w-full nds-max-w-lg';
    wrapper.dataset.spacing = 'sm';

    const heading = document.createElement('h2');
    heading.className = 'nds-text-h4 nds-font-semibold';
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
