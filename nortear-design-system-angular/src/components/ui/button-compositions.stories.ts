import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsButton, NdsButtonIcon } from './button';

const meta: Meta = {
  title: 'UI/Button/Compositions',
  decorators: [moduleMetadata({ imports: [NdsButton, NdsButtonIcon] })],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const WithIconAndIconOnly: Story = {
  parameters: { covers: ['functional.item6', 'accessibility.item4', 'visual.item5'] },
  render: () => ({
    template: `
      <div class="nds-cluster" data-spacing="md">
        <button ndsButton>
          <svg ndsButtonIcon kind="download"></svg>
          Baixar relatório
        </button>
        <button ndsButton variant="outline" size="icon" aria-label="Editar título">
          <svg ndsButtonIcon kind="pencil"></svg>
        </button>
        <button ndsButton variant="ghost" size="icon" aria-label="Excluir item">
          <svg ndsButtonIcon kind="trash"></svg>
        </button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O ícone do botão com texto é decorativo', async () => {
      // Com rótulo visível, o ícone não acrescenta informação — anunciá-lo
      // faria o leitor ler duas vezes a mesma ação.
      const btn = canvas.getByRole('button', { name: 'Baixar relatório' });
      await expect(btn.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Os botões icon-only têm nome próprio e específico', async () => {
      // "Editar" e "Excluir" soltos viram uma fileira de botões idênticos para
      // quem navega por leitor; o nome precisa dizer sobre o quê.
      await expect(canvas.getByRole('button', { name: 'Editar título' })).toBeTruthy();
      await expect(canvas.getByRole('button', { name: 'Excluir item' })).toBeTruthy();
    });

    await step('O botão icon-only não expõe o texto do ícone', async () => {
      const btn = canvas.getByRole('button', { name: 'Editar título' });
      await expect(btn.textContent?.trim()).toBe('');
    });
  },
};

export const AsLink: Story = {
  parameters: { covers: ['functional.item5', 'accessibility.item1'] },
  render: () => ({
    // O seletor do NdsButton aceita `a[ndsButton]`: quando a ação NAVEGA, o
    // elemento tem que ser um <a>, senão o leitor anuncia "botão" para algo
    // que muda de página e o Ctrl+clique deixa de funcionar.
    template: `
      <div class="nds-cluster" data-spacing="md">
        <a ndsButton href="#relatorios">Ver relatórios</a>
        <button ndsButton variant="secondary">Gerar agora</button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A ação de navegar é um link, não um botão', async () => {
      const link = canvas.getByRole('link', { name: 'Ver relatórios' });
      await expect(link.tagName).toBe('A');
      await expect(link).toHaveClass(/nds-button/);
    });

    await step('A ação que executa continua sendo <button>', async () => {
      const btn = canvas.getByRole('button', { name: 'Gerar agora' });
      await expect(btn.tagName).toBe('BUTTON');
    });

    await step('Os dois compartilham a aparência', async () => {
      // É o ponto da composição: mesma classe, semântica diferente. Se o link
      // perdesse o estilo, a diferença apareceria como bug visual.
      const link = canvas.getByRole('link', { name: 'Ver relatórios' });
      const btn = canvas.getByRole('button', { name: 'Gerar agora' });
      await expect(getComputedStyle(link).borderRadius).toBe(getComputedStyle(btn).borderRadius);
    });

    await step('O link entra na ordem de tabulação', async () => {
      // O <a> com aparência de botão precisa ser ALCANÇÁVEL por teclado, e
      // isso nenhuma das cinco stacks verificava: as asserções paravam em
      // papel e destino. Um tabindex negativo herdado, ou a perda do
      // atributo de destino, deixariam papel e destino intactos e a ação
      // inalcançável por teclado.
      const link = canvas.getByRole('link', { name: 'Ver relatórios' });
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(link).toHaveFocus();
    });
  },
};
