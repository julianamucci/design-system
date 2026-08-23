import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor, fn } from 'storybook/test';
import { NDS_COLLAPSIBLE } from './collapsible';
import { NdsButton } from './button';
import { NdsCollapsibleDocs } from '@/components/docs/CollapsibleDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type CollapsibleArgs = {
  open: boolean;
  disabled: boolean;
  triggerLabel: string;
  onOpenChange: (open: boolean) => void;
};

/**
 * Chevron do lucide desenhado no próprio template.
 *
 * `NdsButtonIcon` não tem `chevron-down` no mapa, e o ícone aqui é decorativo —
 * o estado quem conta é o `aria-expanded`. A rotação de 180° é global:
 * `.nds-chevron` gira sob `[aria-expanded="true"]` e sob `[data-state="open"]`,
 * os dois presentes no trigger.
 */
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

/**
 * Ver a nota em separator.stories.ts: o painel Code imprime o `template` da
 * story literalmente, com os bindings ligados aos args. O `transform` devolve o
 * uso real, com os valores atuais dos controls.
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<CollapsibleArgs> }): string {
  const {
    open = false,
    disabled = false,
    triggerLabel = 'Exibir filtros avançados',
  } = ctx.args ?? {};

  // Só o que difere do default entra no snippet — documentação que repete valor
  // padrão ensina ruído.
  const root = ['<div ndsCollapsible class="nds-w-sm"', open ? '[defaultOpen]="true"' : '']
    .filter(Boolean)
    .join(' ');
  const trigger = [
    '<button ndsCollapsibleTrigger ndsButton variant="ghost"',
    'class="nds-cluster nds-w-full nds-px-4" data-justify="between"',
    disabled ? '[disabled]="true"' : '',
  ].filter(Boolean).join(' ');

  return `import { NDS_COLLAPSIBLE } from '@/components/ui/collapsible';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_COLLAPSIBLE, NdsButton],
  template: \`
    ${root}>
      ${trigger}>
        <span>${triggerLabel}</span>
        ${CHEVRON.replace(/\n/g, '\n  ')}
      </button>

      <div
        ndsCollapsiblePanel
        class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2"
        data-spacing="sm"
      >
        <p>Filtro avançado 1</p>
        <p>Filtro avançado 2</p>
      </div>
    </div>
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<CollapsibleArgs> = {
  title: 'UI/Collapsible',
  tags: ['autodocs', 'disclosure'],
  decorators: [moduleMetadata({ imports: [...NDS_COLLAPSIBLE, NdsButton] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsCollapsibleDocs) },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description:
        'Estado inicial do painel no modo não-controlado — chega ao componente como defaultOpen.',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o trigger. Mora no botão, que é quem tem o atributo nativo.',
    },
    triggerLabel: {
      control: 'text',
      description: 'Texto do trigger. Deve nomear a ação e o objeto, nunca "Ver mais".',
    },
    // Espião de output. Sem entrada aqui o renderer Angular não repassa a função
    // em `props` e o `(openChange)` do template fica ligado a nada — sem erro
    // nenhum (armadilha 5 do CLAUDE.md deste stack).
    onOpenChange: {
      control: false,
      description: 'Emitido a cada alternância, com o novo estado.',
      table: { type: { summary: '(open: boolean) => void' } },
    },
  },
  args: {
    open: false,
    disabled: false,
    triggerLabel: 'Exibir filtros avançados',
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<CollapsibleArgs>;

/** Abre só se estiver fechado — ver a nota de idempotência abaixo. */
async function open(trigger: HTMLElement): Promise<void> {
  if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
  await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
}

/** Fecha só se estiver aberto. */
async function close(trigger: HTMLElement): Promise<void> {
  if (trigger.getAttribute('aria-expanded') !== 'false') await userEvent.click(trigger);
  await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
}

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    // `visual.item2` (aberto por padrão) saiu daqui: o Playground monta com o
    // control `open` em false, e nenhum quadro dele é "aberto por padrão" —
    // quem cobre esse item é a story OpenByDefault, que monta expandida. Item
    // declarado e não cumprido faz o auditor mentir.
    covers: [
      'functional.item1', 'functional.item2',
      'accessibility.item1', 'accessibility.item2',
      'accessibility.item3', 'accessibility.item4',
      'visual.item1',
    ],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <div
        ndsCollapsible
        class="nds-w-sm"
        [defaultOpen]="open"
        (openChange)="onOpenChange($event)"
      >
        <button
          ndsCollapsibleTrigger
          ndsButton
          variant="ghost"
          class="nds-cluster nds-w-full nds-px-4"
          data-justify="between"
          [disabled]="disabled"
        >
          <span>{{ triggerLabel }}</span>
          ${CHEVRON}
        </button>

        <div
          ndsCollapsiblePanel
          class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2"
          data-spacing="sm"
        >
          <p>Filtro avançado 1</p>
          <p>Filtro avançado 2</p>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="collapsible"]')!;
    const trigger = canvas.getByRole('button');
    const panel = () => canvasElement.querySelector<HTMLElement>('[data-slot="collapsible-content"]');

    await step('O markup é o mesmo das outras stacks', async () => {
      // A raiz é um <div> com a classe do design system, não um elemento
      // próprio: é o que faz o CSS `.nds-collapsible` casar sem wrapper.
      await expect(root.tagName).toBe('DIV');
      await expect(root).toHaveClass(/nds-collapsible/);
      await expect(trigger.tagName).toBe('BUTTON');
      await expect(trigger).toHaveAttribute('data-slot', 'collapsible-trigger');
    });

    await step('O estado inicial vem do input, e aparece nos dois contratos', async () => {
      // Esta é a asserção que prova o binding de input: sob JIT o componente
      // renderiza no default e `aria-expanded` viria sempre "false" com o
      // control em true (armadilha 1 do CLAUDE.md deste stack).
      await expect(trigger.getAttribute('aria-expanded')).toBe(String(args.open));
      // `data-state` é o contrato de markup do Vanilla, que este componente
      // emite de propósito — o primitivo só entrega data-open/data-closed.
      await expect(trigger).toHaveAttribute('data-state', args.open ? 'open' : 'closed');
      await expect(panel() !== null).toBe(args.open);
    });

    await step('O chevron é decorativo', async () => {
      // O estado é comunicado por aria-expanded; o ícone repetido no leitor
      // seria ruído.
      await expect(trigger.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    if (args.disabled) {
      await step('Desabilitado, o trigger não responde ao clique', async () => {
        const antes = trigger.getAttribute('aria-expanded');
        await userEvent.click(trigger, { pointerEventsCheck: 0 });
        await expect(trigger.getAttribute('aria-expanded')).toBe(antes);
      });
      return;
    }

    await step('Clicar com o painel fechado expande o conteúdo', async () => {
      // O par abrir/fechar em vez do clique cego: o painel Interactions
      // REEXECUTA a play no mesmo DOM, e um clique absoluto partiria do estado
      // que a rodada anterior deixou, invertendo o resultado.
      await close(trigger);
      const callsBefore = (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length;
      await open(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(trigger).toHaveAttribute('data-state', 'open');
      await expect(panel()).toBeInTheDocument();
      await expect(
        (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length,
      ).toBe(callsBefore + 1);
    });

    await step('Aberto, aria-controls aponta para o id real do painel', async () => {
      // O primitivo só escreve `aria-controls` enquanto o painel existe: com o
      // painel desmontado, o atributo apontaria para um id ausente e o axe
      // reprovaria por aria-valid-attr-value.
      const id = trigger.getAttribute('aria-controls');
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)).toBe(panel());
    });

    await step('Clicar com o painel aberto recolhe o conteúdo', async () => {
      await open(trigger);
      await close(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveAttribute('data-state', 'closed');
      // `waitFor` e não asserção seca: o painel continua no DOM enquanto a
      // transição de saída roda — é o que dá o que animar no fechamento. Só
      // depois dela o primitivo desmonta o elemento.
      await waitFor(async () => {
        await expect(panel()).toBeNull();
      });
      // Fechado não há painel para apontar, e o atributo some junto.
      await expect(trigger.getAttribute('aria-controls')).toBeNull();
    });

    await step('Enter alterna o painel', async () => {
      await close(trigger);
      trigger.focus();
      await userEvent.keyboard('{Enter}');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Space alterna o painel, idêntico a Enter', async () => {
      await close(trigger);
      trigger.focus();
      await userEvent.keyboard(' ');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('E a story volta ao estado que ela declara', async () => {
      // Último passo de propósito. A story cobre visual.item1 — "estado fechado
      // por padrão" — e o quadro que o Chromatic fotografa e o axe varre é o
      // FINAL da play, não o da montagem. Sem isto a foto saía aberta e o item
      // do contrato ficava declarado sem nunca ter sido capturado.
      await close(trigger);
      await waitFor(async () => {
        await expect(panel()).toBeNull();
      });
    });
  },
};
