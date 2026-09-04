import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor, screen } from 'storybook/test';
import { NDS_POPOVER } from './popover';
import { open, panel } from './popover.fixtures';
import { NdsButton } from './button';

// Os quatro estados que o conteúdo compartilhado descreve: fechado (painel fora
// do DOM), aberto, controlado por fora e foco dentro do painel. O estado
// "transitioning" não vira story própria — ele é o intervalo entre dois destes,
// e o que o prova é o `data-ending-style` que a folha compartilhada anima.

const meta: Meta = {
  title: 'Components/Overlay/Popover/States',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_POPOVER, NdsButton] })],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Fechado, aberto, controlado por fora e com foco interno. Fechado o painel ' +
          'sai do DOM — não é um elemento escondido, é um elemento que não existe.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const SIMPLE_PANEL = `
        <ng-template ndsPopoverContent>
          <div ndsPopoverHeader>
            <h3 ndsPopoverTitle>Configurações de exibição</h3>
            <p ndsPopoverDescription>Ajuste a aparência do conteúdo da página.</p>
          </div>

          <div class="nds-cluster" data-justify="end" data-spacing="sm">
            <button ndsPopoverClose ndsButton variant="ghost" size="sm">Cancelar</button>
            <button ndsPopoverClose ndsButton size="sm">Salvar</button>
          </div>
        </ng-template>`;

export const Closed: Story = {
  render: () => ({
    template: `
      <div ndsPopover>
        <button ndsPopoverTrigger ndsButton variant="outline">Abrir popover</button>
        ${SIMPLE_PANEL}
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Abrir popover' });

    await step('Fechado, o painel não existe no DOM', async () => {
      // Desmontado, e não escondido: leitor de tela e busca do navegador não
      // encontram conteúdo que não está lá, que é o comportamento desejado.
      await expect(panel()).toBeNull();
      await expect(screen.queryByRole('dialog')).toBeNull();
    });

    await step('E o gatilho declara o estado nos dois contratos', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveAttribute('data-state', 'closed');
      // Sem painel não há id para apontar — o atributo some, senão o axe
      // reprovaria por aria-valid-attr-value.
      await expect(trigger.getAttribute('aria-controls')).toBeNull();
    });
  },
};

export const Open: Story = {
  // Story SEM interação de fechamento: termina aberta de propósito, porque é
  // este estado que o axe varre (ARIA e contraste do painel) e que o Chromatic
  // fotografa. Os dois itens vieram do Playground na revalidação do contrato —
  // lá a play termina com o painel fechado.
  parameters: { covers: ['accessibility.item1', 'accessibility.item2'] },
  render: () => ({
    template: `
      <div ndsPopover [defaultOpen]="true">
        <button ndsPopoverTrigger ndsButton variant="outline">Abrir popover</button>
        ${SIMPLE_PANEL}
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Abrir popover' });

    await step('defaultOpen abre o painel já na primeira renderização', async () => {
      // Prova o binding de input: sob JIT o componente cairia no valor padrão
      // do próprio componente e nasceria fechado, sem erro nenhum.
      await waitFor(async () => {
        await expect(screen.getByRole('dialog')).toBeVisible();
      });
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(trigger).toHaveAttribute('data-state', 'open');
      await expect(panel()).toHaveAttribute('data-state', 'open');
    });
  },
};

export const Controlled: Story = {
  parameters: { covers: ['functional.item3'] },
  render: () => ({
    props: { isOpen: false },
    template: `
      <div class="nds-cluster" data-spacing="md">
        <div ndsPopover [open]="isOpen" (openChange)="isOpen = $event">
          <button ndsPopoverTrigger ndsButton variant="outline">Abrir popover</button>
          ${SIMPLE_PANEL}
        </div>

        <button ndsButton variant="ghost" (click)="isOpen = !isOpen">
          Alternar por fora
        </button>

        <p class="nds-text-body nds-text-muted-foreground" data-testid="area-externa">
          Área externa
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Abrir popover' });
    const externo = canvas.getByRole('button', { name: 'Alternar por fora' });

    await step('O estado externo abre e fecha o painel', async () => {
      if (trigger.getAttribute('aria-expanded') === 'true') await userEvent.click(externo);
      await userEvent.click(externo);
      await waitFor(async () => {
        await expect(screen.getByRole('dialog')).toBeVisible();
      });
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Clicar fora do painel fecha o popover', async () => {
      await open(trigger);
      // Um elemento inerte fora do gatilho e fora do painel. O primitivo fecha
      // no pointerdown de fora — é o comportamento nativo que o conteúdo
      // compartilhado promete, e o `open` controlado acompanha.
      await userEvent.click(canvas.getByTestId('area-externa'));
      await waitFor(async () => {
        await expect(panel()).toBeNull();
      });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    // Termina ABERTA: é o estado que o Chromatic fotografa.
    await step('Estado final: painel aberto', async () => {
      await open(trigger);
      await expect(screen.getByRole('dialog')).toBeVisible();
    });
  },
};

export const Focus: Story = {
  parameters: { covers: ['functional.item4', 'accessibility.item3'] },
  render: () => ({
    template: `
      <div ndsPopover>
        <button ndsPopoverTrigger ndsButton variant="outline">Abrir popover</button>
        ${SIMPLE_PANEL}
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Abrir popover' });

    await step('O foco entra no painel ao abrir', async () => {
      await open(trigger);
      await waitFor(async () => {
        await expect(panel()!.contains(document.activeElement)).toBe(true);
      });
    });

    await step('Tab caminha entre os controles internos', async () => {
      const cancel = screen.getByRole('button', { name: 'Cancelar' });
      const save = screen.getByRole('button', { name: 'Salvar' });
      cancel.focus();
      await userEvent.tab();
      await expect(save).toHaveFocus();
    });

    await step('E o elemento focado por teclado mostra o anel de foco', async () => {
      // `:focus-visible` é a condição exata que o CSS compartilhado usa para
      // desenhar o anel — se o foco tivesse vindo do ponteiro, o navegador não
      // casaria a pseudo-classe e o anel não apareceria.
      const save = screen.getByRole('button', { name: 'Salvar' });
      await expect(save.matches(':focus-visible')).toBe(true);
      // O anel de `.nds-button` é box-shadow, não outline — medir a propriedade
      // errada daria verde em qualquer elemento.
      await expect(getComputedStyle(save).boxShadow).not.toBe('none');
    });
  },
};

export const Modal: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Modo modal — o foco fica preso no painel, a rolagem da página trava e o painel se anuncia como diálogo modal. As três coisas andam juntas: anunciar inércia sem prender o foco engana quem navega por leitor de tela.',
      },
    },
  },
  render: () => ({
    // O painel NÃO traz botão de fechar de propósito. O primitivo desta stack só
    // trapeia com `modal === true` quando existe um `ndsPopoverClose`
    // registrado dentro dele (`hasPopupClose()`), e é exatamente esse buraco que
    // o laço de tabulação do `NdsPopover` fecha: sem ele, `modal` prometeria
    // prisão de foco e entregaria só a trava de rolagem. Com um botão de fechar
    // aqui, a story passaria pela lib e não mediria o nosso laço.
    //
    // DOIS focáveis, também de propósito: com um só, "o Tab do último volta ao
    // primeiro" seria verdade sem laço nenhum.
    template: `
      <div ndsPopover [defaultOpen]="true" [modal]="true">
        <button ndsPopoverTrigger ndsButton variant="outline">Abrir modal</button>

        <ng-template ndsPopoverContent>
          <div ndsPopoverHeader>
            <h3 ndsPopoverTitle>Popover modal</h3>
            <p ndsPopoverDescription>O foco fica preso no painel enquanto ele está aberto.</p>
          </div>

          <div class="nds-cluster" data-justify="end" data-spacing="sm">
            <button ndsButton variant="ghost" size="sm">Cancelar</button>
            <button ndsButton size="sm">Confirmar</button>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ step }) => {
    await step('O painel abre em modo modal e anuncia aria-modal', async () => {
      const dialog = await waitFor(() => screen.getByRole('dialog'), { timeout: 2000 });
      await expect(dialog).toBeVisible();
      // Tem dentes nos DOIS sentidos: reprova se alguém anunciar `aria-modal`
      // sem prender o foco e reprova se o modo modal deixar de anunciar.
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    await step('Tab a partir do último focável NÃO sai do painel', async () => {
      // ─── A asserção com CONTROLE NEGATIVO ───────────────────────────────
      //
      // Provar a prisão com `dialog.contains(document.activeElement)` SEM
      // tabular não mede nada: o foco está dentro do painel no modo não-modal
      // também, nas cinco stacks — é o contrato `functional.item1`. Essa
      // asserção não pode reprovar, e é a forma exata da asserção que guarda o
      // bug; foi encontrada assim em duas stacks desta família.
      //
      // O controle negativo de verdade é este: partir do ÚLTIMO focável e
      // apertar Tab. Não-modal, o foco SAI do painel e esta asserção reprova;
      // modal, ele volta ao primeiro.
      const dialog = panel()!;
      const inside = within(dialog);
      const cancel = inside.getByRole('button', { name: /Cancelar/i });
      const confirm = inside.getByRole('button', { name: /Confirmar/i });

      confirm.focus();
      await expect(confirm).toHaveFocus();

      await userEvent.tab();

      await expect(dialog.contains(document.activeElement)).toBe(true);
      await expect(cancel).toHaveFocus();
    });

    await step('E Shift+Tab a partir do primeiro volta ao último', async () => {
      const dialog = panel()!;
      const inside = within(dialog);
      const cancel = inside.getByRole('button', { name: /Cancelar/i });
      const confirm = inside.getByRole('button', { name: /Confirmar/i });

      cancel.focus();
      await userEvent.tab({ shift: true });

      await expect(dialog.contains(document.activeElement)).toBe(true);
      await expect(confirm).toHaveFocus();
    });
  },
};
