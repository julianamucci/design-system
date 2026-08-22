import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, waitFor } from 'storybook/test';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Save } from 'lucide-vue-next';
import { balaoDe } from './tooltip.fixtures';
import {
  tooltipComAtalhoSource,
  tooltipTextoCurtoSource,
  tooltipTextoLongoSource,
} from './tooltip.source';

// As três variantes que o conteúdo compartilhado descreve — texto curto, texto
// com atalho e texto longo. Todas nascem abertas: é o único jeito de a regressão
// visual capturar o balão, que só existe no DOM enquanto está aberto.

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

const meta = {
  title: 'UI/Tooltip/Variants',
  component: Tooltip,
  tags: ['overlay'],
  decorators: [
    (story) => ({
      components: { TooltipProvider, story },
      template: '<TooltipProvider :delay-duration="0"><story /></TooltipProvider>',
    }),
  ],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: tooltipTextoCurtoSource },
      description: {
        component:
          'Default é texto curto. Com atalho acrescenta a tecla em Kbd, que a folha compartilhada reconhece e usa para encurtar o respiro à direita. Texto longo quebra dentro do limite de largura do balão — passou disso, o caso é de Popover.',
      },
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = { Tooltip, TooltipContent, TooltipTrigger, Button, Kbd, Save };

export const Default: Story = {
  parameters: {
    covers: ['visual.item1', 'accessibility.item2'],
    docs: {
      description: {
        story:
          'Default — texto curto explicativo, com o par de cores do balão medido contra o limite de 4.5:1.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout" class="nds-cluster nds-min-h-40" data-align="center" data-justify="center">
        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" class="nds-size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Salvar</TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const gatilho = within(canvasElement).getByRole('button', { name: /Salvar/i });

    await step('Nasce aberto, com o texto curto no balão', async () => {
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      const balao = balaoDe(gatilho)!;
      await expect(balao).toHaveClass(/nds-tooltip-content/);
      // `toContain` e não igualdade: a lib acrescenta uma cópia acessível do
      // texto dentro do balão, então `textContent` traz o rótulo duas vezes.
      await expect(balao.textContent).toContain('Salvar');
    });

    await step('O texto do balão passa dos 4.5:1 exigidos', async () => {
      // Medido no elemento real, não na tabela de tokens: é a combinação
      // aplicada (fundo --primary, texto --primary-foreground) que a pessoa lê,
      // e ela precisa valer em qualquer tema da toolbar.
      const estilo = getComputedStyle(balaoDe(gatilho)!);
      await expect(contraste(estilo.color, estilo.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const WithShortcut: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      // O balão deixa de ser texto corrido e ganha estrutura própria — o rótulo
      // e as teclas em Kbd, que a do meta esconderia numa linha só.
      source: { transform: tooltipComAtalhoSource },
      description: {
        story: 'Tooltip com atalho de teclado via componente Kbd. Útil para botões com hotkeys.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout" class="nds-cluster nds-min-h-40" data-align="center" data-justify="center">
        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" class="nds-size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span>Salvar</span>
            <Kbd>Ctrl</Kbd>
            <Kbd>S</Kbd>
          </TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const gatilho = within(canvasElement).getByRole('button', { name: /Salvar/i });

    await step('O atalho vai em Kbd, não solto no texto', async () => {
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
  parameters: {
    covers: ['visual.item4'],
    docs: {
      // O gatilho troca de forma: botão com rótulo visível em vez de icon-only,
      // e é o texto longo dele que a story existe para medir.
      source: { transform: tooltipTextoLongoSource },
      description: {
        story:
          'Tooltip com texto que quebra dentro do limite de largura do balão — útil para definições curtas.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout" class="nds-cluster nds-min-h-40" data-align="center" data-justify="center">
        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline">Compartilhar</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Cria um link público de leitura — qualquer pessoa com o link vê o conteúdo
          </TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const gatilho = within(canvasElement).getByRole('button', { name: /Compartilhar/i });

    await step('O texto quebra dentro do limite de largura do balão', async () => {
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      const balao = balaoDe(gatilho)!;
      await expect(balao.textContent).toContain('link público');
      // O limite vem da folha compartilhada; medir a largura real prova que o
      // texto respeitou o teto em vez de esticar o balão pela viewport.
      const limite = parseFloat(getComputedStyle(balao).maxWidth);
      await expect(limite).toBeGreaterThan(0);
      await expect(balao.getBoundingClientRect().width).toBeLessThanOrEqual(limite + 1);
    });
  },
};
