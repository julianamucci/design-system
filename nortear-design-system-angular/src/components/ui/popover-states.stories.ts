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
  title: 'UI/Popover/States',
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
      const cancelar = screen.getByRole('button', { name: 'Cancelar' });
      const salvar = screen.getByRole('button', { name: 'Salvar' });
      cancelar.focus();
      await userEvent.tab();
      await expect(salvar).toHaveFocus();
    });

    await step('E o elemento focado por teclado mostra o anel de foco', async () => {
      // `:focus-visible` é a condição exata que o CSS compartilhado usa para
      // desenhar o anel — se o foco tivesse vindo do ponteiro, o navegador não
      // casaria a pseudo-classe e o anel não apareceria.
      const salvar = screen.getByRole('button', { name: 'Salvar' });
      await expect(salvar.matches(':focus-visible')).toBe(true);
      // O anel de `.nds-button` é box-shadow, não outline — medir a propriedade
      // errada daria verde em qualquer elemento.
      await expect(getComputedStyle(salvar).boxShadow).not.toBe('none');
    });
  },
};
