import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, waitFor } from 'storybook/test';
import { NDS_TOOLTIP } from './tooltip';
import { NdsButton } from './button';
import { NdsInput } from './input';
import { NdsLabel } from './label';
import { NdsCard, NdsCardContent, NdsCardHeader, NdsCardTitle } from './card';

// As três composições que o conteúdo compartilhado documenta. Todas repetem a
// mesma regra: o Tooltip acrescenta contexto a um elemento que JÁ se explica
// sozinho — nunca é o único portador da informação.

const ICONE_SALVAR = `<svg
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
          <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
          <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
          <path d="M7 3v4a1 1 0 0 0 1 1h7" />
        </svg>`;

const ICONE_AJUDA = `<svg
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
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>`;

const ICONE_INFO = `<svg
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
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>`;

function balaoDe(gatilho: HTMLElement): HTMLElement | null {
  const id = gatilho.getAttribute('aria-describedby');
  return id ? document.getElementById(id) : null;
}

const meta: Meta = {
  title: 'UI/Tooltip/Compositions',
  tags: ['overlay'],
  decorators: [
    moduleMetadata({
      imports: [
        ...NDS_TOOLTIP, NdsButton, NdsInput, NdsLabel,
        NdsCard, NdsCardContent, NdsCardHeader, NdsCardTitle,
      ],
    }),
  ],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Botão de ação rápida com atalho, ajuda ao lado do rótulo de um campo e definição ' +
          'de sigla no cabeçalho de uma métrica. Nos três, o elemento continua compreensível ' +
          'sem o Tooltip — em touch não há hover, e o conteúdo obrigatório não pode morar aqui.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const IconButtonWithShortcut: Story = {
  render: () => ({
    template: `
      <div ndsTooltipProvider [delay]="0" class="nds-cluster nds-p-8" data-spacing="sm">
        <span ndsTooltip>
          <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
            ${ICONE_SALVAR}
          </button>
          <ng-template ndsTooltipContent
            ><span>Salvar</span
            ><kbd class="nds-kbd" data-slot="kbd">Ctrl</kbd
            ><kbd class="nds-kbd" data-slot="kbd">S</kbd
          ></ng-template>
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const gatilho = within(canvasElement).getByRole('button', { name: 'Salvar' });

    await step('O nome acessível é do botão; o atalho é o extra', async () => {
      // A ordem importa: o `aria-label` sozinho já diz o que o botão faz. O
      // Tooltip acrescenta a tecla, que é conveniência, não requisito.
      await expect(gatilho).toHaveAttribute('aria-label', 'Salvar');
      gatilho.focus();
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      await expect(balaoDe(gatilho)!.querySelectorAll('kbd').length).toBe(2);
    });
  },
};

export const HelpInFormField: Story = {
  render: () => ({
    template: `
      <div ndsTooltipProvider [delay]="0" class="nds-stack nds-p-8 nds-w-sm" data-spacing="sm">
        <div class="nds-cluster" data-spacing="xs">
          <label ndsLabel for="token-api">Token da API</label>
          <span ndsTooltip>
            <button
              ndsTooltipTrigger
              ndsButton
              variant="ghost"
              size="icon-sm"
              aria-label="Onde encontrar o token da API"
            >
              ${ICONE_AJUDA}
            </button>
            <ng-template ndsTooltipContent side="right"
              >Gere em Configurações › Acesso › Tokens</ng-template
            >
          </span>
        </div>
        <input ndsInput id="token-api" placeholder="ndsk_..." />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: 'Onde encontrar o token da API' });

    await step('O campo continua rotulado pelo label, não pelo Tooltip', async () => {
      // O `for`/`id` é o que nomeia o campo. O Tooltip explica ONDE achar o
      // valor — informação complementar, que pode faltar sem quebrar o
      // formulário.
      const campo = canvas.getByLabelText('Token da API');
      await expect(campo).toHaveAttribute('id', 'token-api');
    });

    await step('O ícone de ajuda é um botão focável, com nome próprio', async () => {
      gatilho.focus();
      await expect(gatilho).toHaveFocus();
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      await expect(balaoDe(gatilho)!.textContent).toContain('Tokens');
    });
  },
};

export const MetricDescription: Story = {
  render: () => ({
    template: `
      <div ndsTooltipProvider [delay]="0" class="nds-p-8">
        <div ndsCard class="nds-p-4 nds-w-sm">
          <div ndsCardHeader>
            <div class="nds-cluster" data-spacing="xs">
              <span ndsCardTitle>LCP</span>
              <span ndsTooltip>
                <button
                  ndsTooltipTrigger
                  ndsButton
                  variant="ghost"
                  size="icon-sm"
                  aria-label="O que é LCP"
                >
                  ${ICONE_INFO}
                </button>
                <ng-template ndsTooltipContent
                  >LCP — Largest Contentful Paint</ng-template
                >
              </span>
            </div>
          </div>
          <div ndsCardContent>
            <p class="nds-text-h3 nds-m-0">1,8 s</p>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: 'O que é LCP' });

    await step('A sigla fica visível; o Tooltip só a expande', async () => {
      await expect(canvasElement.textContent).toContain('LCP');
      gatilho.focus();
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      await expect(balaoDe(gatilho)!.textContent).toContain('Largest Contentful Paint');
    });
  },
};
