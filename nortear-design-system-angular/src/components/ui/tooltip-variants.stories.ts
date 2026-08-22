import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, waitFor } from 'storybook/test';
import { NDS_TOOLTIP } from './tooltip';
import { balaoDe } from './tooltip.fixtures';
import { NdsButton } from './button';

// As três variantes que o conteúdo compartilhado descreve — texto curto, texto
// com atalho e texto longo — mais os quatro lados de posicionamento. Todas
// nascem abertas: é o único jeito de a regressão visual capturar o balão, que
// só existe no DOM enquanto está aberto.

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

/** Luminância relativa da WCAG a partir de um `rgb(r, g, b)` computado. */
function luminancia(cor: string): number {
  const [r, g, b] = (cor.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map((v) => {
    const canal = Number(v) / 255;
    return canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste WCAG entre duas cores computadas. */
function contraste(a: string, b: string): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

const meta: Meta = {
  title: 'UI/Tooltip/Variants',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_TOOLTIP, NdsButton] })],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Default é texto curto. Com atalho acrescenta a tecla em <kbd>, que a folha ' +
          'compartilhada reconhece e usa para encurtar o respiro à direita. Texto longo ' +
          'quebra dentro do limite de largura do balão — passou disso, o caso é de Popover.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: { covers: ['visual.item1', 'accessibility.item2'] },
  render: () => ({
    template: `
      <div ndsTooltipProvider [delay]="0" class="nds-p-8">
        <span ndsTooltip [defaultOpen]="true">
          <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
            ${ICONE_SALVAR}
          </button>
          <ng-template ndsTooltipContent>Salvar</ng-template>
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const gatilho = within(canvasElement).getByRole('button');

    await step('Nasce aberto, com o texto curto no balão', async () => {
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      const balao = balaoDe(gatilho)!;
      await expect(balao).toHaveClass(/nds-tooltip-content/);
      await expect(balao.textContent?.trim()).toBe('Salvar');
    });

    await step('O texto do balão passa dos 4.5:1 exigidos', async () => {
      const balao = balaoDe(gatilho)!;
      // Medido no elemento real, não na tabela de tokens: é a combinação
      // aplicada (fundo --primary, texto --primary-foreground) que a pessoa lê,
      // e ela precisa valer em qualquer tema da toolbar.
      const estilo = getComputedStyle(balao);
      await expect(contraste(estilo.color, estilo.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const WithShortcut: Story = {
  parameters: { covers: ['visual.item2'] },
  render: () => ({
    template: `
      <div ndsTooltipProvider [delay]="0" class="nds-p-8">
        <span ndsTooltip [defaultOpen]="true">
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
    const gatilho = within(canvasElement).getByRole('button');

    await step('O atalho vai em <kbd>, não solto no texto', async () => {
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      const teclas = balaoDe(gatilho)!.querySelectorAll('kbd');
      await expect(teclas.length).toBe(2);
      await expect(teclas[0].textContent).toBe('Ctrl');
    });

    await step('A folha compartilhada reconhece a tecla e encurta o respiro', async () => {
      // `.nds-tooltip-content:has([data-slot="kbd"])` só casa se o data-slot
      // estiver na tecla — sem ele a regra existe e não pinta nada.
      const balao = balaoDe(gatilho)!;
      await expect(balao.querySelector('[data-slot="kbd"]')).not.toBeNull();
      await expect(getComputedStyle(balao).paddingInlineEnd).not.toBe(
        getComputedStyle(balao).paddingInlineStart,
      );
    });
  },
};

export const LongText: Story = {
  parameters: { covers: ['visual.item4'] },
  render: () => ({
    template: `
      <div ndsTooltipProvider [delay]="0" class="nds-p-8">
        <span ndsTooltip [defaultOpen]="true">
          <button ndsTooltipTrigger ndsButton variant="outline">Compartilhar</button>
          <ng-template ndsTooltipContent side="bottom"
            >Cria um link público de leitura — qualquer pessoa com o link vê o conteúdo</ng-template
          >
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const gatilho = within(canvasElement).getByRole('button');

    await step('O texto quebra dentro do limite de largura do balão', async () => {
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      const balao = balaoDe(gatilho)!;
      const limite = parseFloat(getComputedStyle(balao).maxWidth);
      // O limite vem da folha compartilhada; medir a largura real prova que o
      // texto respeitou o teto em vez de esticar o balão pela viewport.
      await expect(limite).toBeGreaterThan(0);
      await expect(balao.getBoundingClientRect().width).toBeLessThanOrEqual(limite + 1);
    });
  },
};

export const PlacementSides: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    template: `
      <div ndsTooltipProvider [delay]="0" class="nds-grid nds-p-8" data-cols="2" data-spacing="xl">
        @for (lado of lados; track lado) {
          <span ndsTooltip [defaultOpen]="true">
            <button ndsTooltipTrigger ndsButton variant="outline" [attr.aria-label]="lado">
              {{ lado }}
            </button>
            <ng-template ndsTooltipContent [side]="lado">Tooltip {{ lado }}</ng-template>
          </span>
        }
      </div>
    `,
    props: { lados: ['top', 'right', 'bottom', 'left'] },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const oposto: Record<string, string> = {
      top: 'bottom', bottom: 'top', left: 'right', right: 'left',
    };

    await step('Cada balão nasce do lado pedido, ou do oposto quando falta espaço', async () => {
      for (const lado of ['top', 'right', 'bottom', 'left']) {
        const gatilho = canvas.getByRole('button', { name: lado });
        // Esperar o `data-side`, e não só o elemento: o balão entra no DOM
        // antes de o posicionador medir, e nesse intervalo o atributo é nulo.
        await waitFor(async () => {
          await expect(balaoDe(gatilho)?.getAttribute('data-side')).toBeTruthy();
        });
        // O auto-flip por colisão é comportamento documentado: perto da borda o
        // balão troca para o lado oposto em vez de sair da tela.
        await expect([lado, oposto[lado]]).toContain(
          balaoDe(gatilho)!.getAttribute('data-side'),
        );
      }
    });
  },
};
