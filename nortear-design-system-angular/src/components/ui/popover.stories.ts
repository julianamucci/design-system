import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor, screen, fn } from 'storybook/test';
import { NDS_POPOVER } from './popover';
import { popoverPlaygroundSource, type PopoverArgs } from './popover.source';
import { open, panel } from './popover.fixtures';
import { NdsButton } from './button';
import { NdsPopoverDocs } from '@/components/docs/PopoverDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta: Meta<PopoverArgs> = {
  title: 'Components/Overlay/Popover',
  tags: ['autodocs', 'overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_POPOVER, NdsButton] })],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(NdsPopoverDocs) },
  },
  argTypes: {
    side: {
      control: 'radio',
      options: ['top', 'right', 'bottom', 'left'],
      description: 'Lado preferido em relação ao gatilho. Vira o oposto quando não há espaço.',
    },
    align: {
      control: 'radio',
      options: ['start', 'center', 'end'],
      description: 'Alinhamento ao longo do eixo do side.',
    },
    sideOffset: {
      control: { type: 'number', min: 0, max: 24, step: 1 },
      description: 'Distância em pixels entre o gatilho e o painel.',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial no modo não-controlado.',
    },
    triggerLabel: {
      control: 'text',
      description: 'Texto do gatilho. Verbo e objeto — nunca "Clique aqui".',
    },
    // Espião de output. Sem entrada aqui o renderer Angular não repassa a função
    // em `props` e o `(openChange)` do template fica ligado a nada — sem erro
    // nenhum (armadilha 5 do CLAUDE.md deste stack).
    onOpenChange: {
      control: false,
      description: 'Emitido a cada abertura e fechamento, com o novo estado.',
      table: { type: { summary: '(open: boolean) => void' } },
    },
  },
  args: {
    side: 'bottom',
    align: 'center',
    sideOffset: 4,
    defaultOpen: false,
    triggerLabel: 'Abrir popover',
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<PopoverArgs>;

/** Fecha só se estiver aberto. */
async function close(trigger: HTMLElement): Promise<void> {
  if (trigger.getAttribute('aria-expanded') === 'true') await userEvent.click(trigger);
  await waitFor(() => expect(panel()).toBeNull());
}

/** O lado oposto no MESMO eixo — o auto-flip troca de lado, nunca de eixo. */
const OPOSTO: Record<string, string> = {
  top: 'bottom', bottom: 'top', left: 'right', right: 'left',
  start: 'end', end: 'start', center: 'center',
};

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: popoverPlaygroundSource } },
    // `accessibility.item1` (axe no estado ABERTO) e `accessibility.item2`
    // (contraste) saíram daqui na revalidação do contrato: a play desta story
    // termina com o painel FECHADO, e é o estado final que o axe varre. Os dois
    // itens passaram para `States/Open`, que termina aberta.
    covers: [
      'functional.item1', 'functional.item2',
      'accessibility.item4', 'accessibility.item5',
    ],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <div ndsPopover [defaultOpen]="defaultOpen" (openChange)="onOpenChange($event)">
        <button ndsPopoverTrigger ndsButton variant="outline">{{ triggerLabel }}</button>

        <ng-template
          ndsPopoverContent
          [side]="side"
          [align]="align"
          [sideOffset]="sideOffset"
        >
          <div ndsPopoverHeader>
            <h3 ndsPopoverTitle>Configurações de exibição</h3>
            <p ndsPopoverDescription>Ajuste a aparência do conteúdo da página.</p>
          </div>

          <div class="nds-cluster" data-justify="end" data-spacing="sm">
            <button ndsPopoverClose ndsButton variant="ghost" size="sm">Cancelar</button>
            <button ndsPopoverClose ndsButton size="sm">Salvar</button>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="popover"]')!;
    const trigger = canvas.getByRole('button', { name: args.triggerLabel });

    await step('O markup é o mesmo das outras stacks', async () => {
      await expect(root.tagName).toBe('DIV');
      await expect(trigger.tagName).toBe('BUTTON');
      await expect(trigger).toHaveAttribute('data-slot', 'popover-trigger');
      // O gatilho ANUNCIA que abre um diálogo — é o que separa o popover de um
      // botão comum para quem usa leitor de tela.
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('type', 'button');
    });

    await step('O estado inicial vem do input', async () => {
      // Esta é a asserção que prova o binding de input: sob JIT o componente
      // renderiza no default e `aria-expanded` viria sempre "false" com o
      // control em true (armadilha 1 do CLAUDE.md deste stack).
      await expect(trigger.getAttribute('aria-expanded')).toBe(String(args.defaultOpen));
      await expect(trigger).toHaveAttribute('data-state', args.defaultOpen ? 'open' : 'closed');
    });

    await step('Clicar no gatilho abre o painel com role=dialog', async () => {
      await close(trigger);
      const callsBefore = (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length;
      await open(trigger);

      const dialogo = screen.getByRole('dialog');
      await expect(dialogo).toBeVisible();
      await expect(dialogo).toHaveClass(/nds-popover-content/);
      await expect(dialogo).toHaveAttribute('data-state', 'open');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(
        (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length,
      ).toBe(callsBefore + 1);
    });

    await step('side e align do template chegam ao posicionamento', async () => {
      // Contra o EIXO, não contra o valor exato: o auto-flip por colisão pode
      // trocar `bottom` por `top`, mas nunca o eixo escolhido. Se o input não
      // tivesse chegado, o painel cairia no padrão `bottom`/`center` e um
      // control em `left`/`start` reprovaria aqui.
      const dialogo = screen.getByRole('dialog');
      await expect([args.side, OPOSTO[args.side]]).toContain(dialogo.getAttribute('data-side'));
      await expect([args.align, OPOSTO[args.align]]).toContain(dialogo.getAttribute('data-align'));
    });

    await step('O painel é nomeado pelo título e descrito pela descrição', async () => {
      const dialogo = screen.getByRole('dialog');
      const idTitle = dialogo.getAttribute('aria-labelledby');
      const idDescription = dialogo.getAttribute('aria-describedby');
      await expect(idTitle).toBeTruthy();
      await expect(document.getElementById(idTitle!)).toHaveAttribute(
        'data-slot', 'popover-title',
      );
      await expect(idDescription).toBeTruthy();
      await expect(document.getElementById(idDescription!)).toHaveAttribute(
        'data-slot', 'popover-description',
      );
      // Com título não existe `aria-label`: dois contratos de nome no mesmo
      // elemento é ambiguidade, não redundância.
      await expect(dialogo).not.toHaveAttribute('aria-label');
    });

    await step('Aberto, aria-controls aponta para o id real do painel', async () => {
      // O primitivo só escreve `aria-controls` enquanto o painel existe: com o
      // painel desmontado o atributo apontaria para um id ausente e o axe
      // reprovaria por aria-valid-attr-value.
      const id = trigger.getAttribute('aria-controls');
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)).toBe(panel());
    });

    await step('O painel não é modal', async () => {
      // Popover não bloqueia o resto da página: `aria-modal` faria o leitor de
      // tela esconder tudo o que está fora dele, que é contrato de Dialog.
      await expect(panel()).not.toHaveAttribute('aria-modal');
    });

    await step('O foco entra no painel ao abrir', async () => {
      // É o que separa popover de tooltip: o conteúdo é interativo, então o
      // foco precisa alcançá-lo sem caçar com Tab pela página inteira.
      await waitFor(async () => {
        await expect(panel()!.contains(document.activeElement)).toBe(true);
      });
      // No PRIMEIRO focável, e não num qualquer: é o que a tabela de estados
      // promete e o que evita uma varredura por Tab dentro do painel.
      await expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    });

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      await open(trigger);
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(panel()).toBeNull();
      });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveAttribute('data-state', 'closed');
      // Fechado não há painel para apontar, e o atributo some junto.
      await expect(trigger.getAttribute('aria-controls')).toBeNull();
      await waitFor(async () => {
        await expect(trigger).toHaveFocus();
      });
    });

    await step('O botão de fechar dentro do painel também fecha', async () => {
      await open(trigger);
      const cancelar = screen.getByRole('button', { name: 'Cancelar' });
      await expect(cancelar).toHaveAttribute('data-slot', 'popover-close');
      await userEvent.click(cancelar);
      await waitFor(async () => {
        await expect(panel()).toBeNull();
      });
    });

    // A story termina ABERTA: é o estado que o axe varre e o Chromatic
    // fotografa. Terminar fechada era o que tornava falsa a declaração de
    // `accessibility.item1` que morava aqui.
    await step('Estado final: painel aberto', async () => {
      await open(trigger);
      await expect(screen.getByRole('dialog')).toBeVisible();
    });
  },
};
