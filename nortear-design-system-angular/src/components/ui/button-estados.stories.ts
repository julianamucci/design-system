import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, fn } from 'storybook/test';
import { NdsButton, NdsButtonIcon } from './button';

const meta: Meta<ButtonEstadosArgs> = {
  title: 'UI/Button/Estados',
  decorators: [moduleMetadata({ imports: [NdsButton, NdsButtonIcon] })],
  parameters: { layout: 'padded', controls: { disable: true } },
  // `onClick` precisa de argType: sem ele o renderer Angular do Storybook não
  // repassa a função em `props`, e o `(click)` do template fica ligado a nada —
  // o teste falha sem erro visível, como se o botão não respondesse.
  argTypes: {
    onClick: { control: false, table: { disable: true } },
  },
};

export default meta;
type ButtonEstadosArgs = { onClick: (e: MouseEvent) => void };
type Story = StoryObj<ButtonEstadosArgs>;

export const Desabilitado: Story = {
  parameters: { covers: ['functional.item2', 'visual.item4'] },
  args: { onClick: fn() },
  render: (args) => ({
    props: { ...args },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <button ndsButton [disabled]="true" (click)="onClick($event)">Salvar</button>
        <button ndsButton variant="destructive" [disabled]="true">Excluir</button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('O clique não dispara o callback', async () => {
      const btn = canvas.getByRole('button', { name: 'Salvar' });
      await userEvent.click(btn, { pointerEventsCheck: 0 });
      await expect(args.onClick).not.toHaveBeenCalled();
    });

    await step('Sai da ordem de tabulação', async () => {
      // `disabled` nativo já tira do Tab; a asserção protege contra alguém
      // trocar por `aria-disabled`, que mantém o foco alcançável.
      const btn = canvas.getByRole('button', { name: 'Salvar' }) as HTMLButtonElement;
      await expect(btn.disabled).toBe(true);
    });
  },
};

export const Teclado: Story = {
  parameters: { covers: ['functional.item3', 'functional.item4', 'accessibility.item3'] },
  args: { onClick: fn() },
  render: (args) => ({
    props: { ...args },
    template: `<button ndsButton (click)="onClick($event)">Enviar</button>`,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button', { name: 'Enviar' });

    await step('Tab leva o foco ao botão', async () => {
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(btn).toHaveFocus();
    });

    await step('Enter aciona', async () => {
      // Refoca dentro do step: o instrumenter do Storybook trata cada step
      // como uma unidade que pode re-executar, e o foco obtido no step
      // anterior não sobrevive a isso. Sem refocar, a tecla vai para o body.
      btn.focus();
      (args.onClick as ReturnType<typeof fn>).mockClear();
      await userEvent.keyboard('{Enter}');
      await expect(args.onClick).toHaveBeenCalled();
    });

    await step('Space aciona', async () => {
      btn.focus();
      (args.onClick as ReturnType<typeof fn>).mockClear();
      await userEvent.keyboard(' ');
      await expect(args.onClick).toHaveBeenCalled();
    });

    await step('O foco por teclado deixa anel visível', async () => {
      const estilo = getComputedStyle(btn);
      await expect(estilo.outlineStyle !== 'none' || estilo.boxShadow !== 'none').toBe(true);
    });
  },
};
