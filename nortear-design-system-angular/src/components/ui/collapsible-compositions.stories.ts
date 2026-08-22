import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NDS_COLLAPSIBLE } from './collapsible';
import { NdsButton } from './button';
import { NdsCheckbox } from './checkbox';
import { NdsLabel } from './label';

// Combinações canônicas: ícone no trigger, chevron rotativo e conteúdo rico.
// Nenhuma acrescenta API — todas são arranjo de conteúdo dentro do trigger e do
// painel, que é justamente o ponto do Collapsible não ter visual próprio.

const CHEVRON = `<svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            class="nds-icon nds-shrink-0 nds-transition-transform nds-chevron"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>`;

// lucide `filter` e `settings`, desenhados no template: o mapa do NdsButtonIcon
// não tem estes dois, e o ícone aqui é decorativo — quem nomeia a ação é o
// texto ao lado.
const FILTER = `<svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            class="nds-icon nds-shrink-0"
          >
            <path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z" />
          </svg>`;

const ENGRENAGEM = `<svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            class="nds-icon nds-shrink-0"
          >
            <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
            <circle cx="12" cy="12" r="3" />
          </svg>`;

const PANEL_CLASSES =
  'nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2';

const meta: Meta = {
  title: 'UI/Collapsible/Compositions',
  decorators: [
    moduleMetadata({ imports: [...NDS_COLLAPSIBLE, NdsButton, NdsCheckbox, NdsLabel] }),
  ],
  parameters: {
    layout: 'padded',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Arranjos de conteúdo dentro do trigger e do painel. O ícone é sempre decorativo — ' +
          'o texto descreve a ação e o estado sai do aria-expanded.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const IconInTrigger: Story = {
  render: () => ({
    template: `
      <div ndsCollapsible class="nds-w-sm">
        <button ndsCollapsibleTrigger ndsButton variant="outline">
          ${FILTER}
          Filtros avançados
        </button>

        <div ndsCollapsiblePanel class="${PANEL_CLASSES}" data-spacing="sm">
          <p>Filtro por categoria</p>
          <p>Filtro por data</p>
          <p>Filtro por status</p>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Filtros avançados' });

    await step('O ícone não entra no nome acessível', async () => {
      // Se o SVG não fosse aria-hidden, o leitor anunciaria o gráfico junto do
      // texto — e o `getByRole` acima já não acharia por este nome.
      await expect(trigger.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    await step('O trigger continua alternando o painel', async () => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(
        canvasElement.querySelector('[data-slot="collapsible-content"]'),
      ).toBeInTheDocument();
    });
  },
};

export const RotatingChevron: Story = {
  parameters: { covers: ['visual.item4', 'accessibility.item4'] },
  render: () => ({
    template: `
      <div ndsCollapsible class="nds-w-sm">
        <button
          ndsCollapsibleTrigger
          ndsButton
          variant="outline"
          class="nds-cluster nds-w-full nds-px-4"
          data-justify="between"
        >
          <span>Configurações avançadas</span>
          ${CHEVRON}
        </button>

        <div ndsCollapsiblePanel class="${PANEL_CLASSES}" data-spacing="sm">
          <div class="nds-cluster" data-justify="between">
            <span class="nds-text-muted-foreground">Notificações</span>
            <span class="nds-font-medium">Ativadas</span>
          </div>
          <div class="nds-cluster" data-justify="between">
            <span class="nds-text-muted-foreground">Privacidade</span>
            <span class="nds-font-medium">Modo estrito</span>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Configurações avançadas' });
    const chevron = trigger.querySelector<SVGElement>('svg')!;

    await step('O chevron é decorativo e carrega a classe da rotação', async () => {
      await expect(chevron).toHaveAttribute('aria-hidden', 'true');
      await expect(chevron.getAttribute('class')).toContain('nds-chevron');
    });

    await step('Fechado, o ícone não está girado', async () => {
      if (trigger.getAttribute('aria-expanded') !== 'false') await userEvent.click(trigger);
      // `waitFor` porque a classe tem `transition: transform`: medido no
      // primeiro quadro depois de fechar, o valor computado ainda é a matriz da
      // animação em curso, não o repouso. A rotação é 100% CSS — nada no
      // componente escreve style.
      await waitFor(async () => {
        await expect(getComputedStyle(chevron).transform).toBe('none');
      });
    });

    await step('Aberto, o CSS gira 180° a partir do estado no trigger', async () => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('data-state', 'open');
      // matrix(-1, 0, 0, -1, 0, 0) é a forma computada de rotate(180deg).
      await waitFor(async () => {
        await expect(getComputedStyle(chevron).transform).toBe('matrix(-1, 0, 0, -1, 0, 0)');
      });
    });
  },
};

export const RichContent: Story = {
  render: () => ({
    template: `
      <div ndsCollapsible class="nds-w-sm">
        <button ndsCollapsibleTrigger ndsButton variant="outline">
          ${ENGRENAGEM}
          Configurações do sistema
        </button>

        <div ndsCollapsiblePanel class="${PANEL_CLASSES}" data-spacing="sm">
          <p class="nds-text-muted-foreground nds-text-caption">
            Altere as configurações abaixo com cuidado. As mudanças são aplicadas imediatamente.
          </p>
          <div class="nds-cluster" data-spacing="sm">
            <button ndsCheckbox id="comp-depuracao"></button>
            <label ndsLabel for="comp-depuracao">Habilitar modo de depuração</label>
          </div>
          <div class="nds-cluster" data-spacing="sm">
            <button ndsCheckbox id="comp-cache"></button>
            <label ndsLabel for="comp-cache">Limpar cache ao sair</label>
          </div>
          <div class="nds-cluster" data-spacing="sm">
            <button ndsCheckbox id="comp-logs"></button>
            <label ndsLabel for="comp-logs">Exportar logs automaticamente</label>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Configurações do sistema' });

    await step('O painel aceita controles de formulário completos', async () => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      await expect(canvas.getAllByRole('checkbox')).toHaveLength(3);
    });

    await step('E os controles de dentro continuam operáveis', async () => {
      // O painel só existe no DOM enquanto aberto: se o conteúdo fosse
      // renderizado inerte, o clique abaixo não mudaria nada.
      const primeiro = canvas.getAllByRole('checkbox')[0];
      const antes = primeiro.getAttribute('aria-checked');
      await userEvent.click(primeiro);
      await expect(primeiro.getAttribute('aria-checked')).not.toBe(antes);
    });
  },
};
