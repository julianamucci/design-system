import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NDS_COMMAND } from './command';

const meta: Meta = {
  title: 'Primitives/Overlay/Command/Variants',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_COMMAND] })],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'A paleta não tem variante visual por prop — o que muda entre os padrões é a ' +
          'composição. Aqui ficam os dois arranjos inline: lista corrida e lista dividida ' +
          'em grupos. O arranjo flutuante (command palette) está em Compositions, ' +
          'porque depende do Dialog.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Inline ───────────────────────────────────────────────────────────────────

export const Inline: Story = {
  render: () => ({
    template: `
      <div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
        <nds-command>
          <input ndsCommandInput placeholder="Buscar componente..." />

          <div ndsCommandList>
            <div ndsCommandGroup>
              <div ndsCommandItem value="button">Button</div>
              <div ndsCommandItem value="input">Input</div>
              <div ndsCommandItem value="separator">Separator</div>
            </div>
          </div>

          <div ndsCommandEmpty>Nenhum resultado encontrado.</div>
        </nds-command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;

    await step('Grupo único dispensa cabeçalho', async () => {
      // A guideline é essa: rótulo de grupo só quando há mais de um grupo,
      // senão ele repete o que o campo de busca já diz.
      await expect(root.querySelectorAll('.nds-command-group-heading')).toHaveLength(0);
      // Os itens se registram no render seguinte ao da montagem.
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(3);
      });
    });

    await step('A lista fica no fluxo da página, sem portal', async () => {
      // É o que separa o padrão inline dos outros dois: nada é teleportado
      // para o `body`, então a paleta rola junto com a seção onde vive.
      const list = canvas.getByRole('listbox');
      await expect(root.contains(list)).toBe(true);
      await expect(within(document.body).getAllByRole('listbox')).toHaveLength(1);
    });
  },
};

// ─── Com grupos ───────────────────────────────────────────────────────────────

export const WithGroups: Story = {
  parameters: { covers: ['visual.item1'] },
  render: () => ({
    template: `
      <div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
        <nds-command>
          <input ndsCommandInput placeholder="Buscar componente..." />

          <div ndsCommandList>
            <div ndsCommandGroup heading="Componentes">
              <div ndsCommandItem value="button">Button</div>
              <div ndsCommandItem value="input">Input</div>
              <div ndsCommandItem value="separator">Separator</div>
            </div>

            <div ndsCommandSeparator></div>

            <div ndsCommandGroup heading="Utilitários">
              <div ndsCommandItem value="cn">cn()</div>
              <div ndsCommandItem value="clsx">clsx()</div>
            </div>
          </div>

          <div ndsCommandEmpty>Nenhum resultado encontrado.</div>
        </nds-command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);

    await step('Cada grupo é nomeado pelo próprio cabeçalho', async () => {
      // Sem o `aria-labelledby` o leitor anuncia "grupo" e a pessoa não sabe
      // de qual bloco se trata.
      await expect(canvas.getByRole('group', { name: 'Componentes' })).toBeTruthy();
      await expect(canvas.getByRole('group', { name: 'Utilitários' })).toBeTruthy();
    });

    await step('O cabeçalho não é opção da lista', async () => {
      // Cabeçalho navegável seria pior que inútil: a seta pararia nele como se
      // fosse comando, e o filtro o traria como resultado.
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(5);
      });
    });

    await step('O divisor é desenho, não estrutura', async () => {
      const divisor = root.querySelector<HTMLElement>('[data-slot="command-separator"]')!;
      await expect(divisor).toHaveClass(/nds-command-separator/);
      // `role="separator"` não é filho permitido de um listbox; quem separa os
      // blocos para quem não vê a tela é o rótulo do grupo.
      await expect(divisor).toHaveAttribute('aria-hidden', 'true');
      await expect(canvas.queryAllByRole('separator')).toHaveLength(0);
    });

    await step('O filtro atravessa os grupos', async () => {
      await userEvent.type(field, 'n');

      await waitFor(async () => {
        // "Button", "Input" e "cn()" — dois grupos ao mesmo tempo.
        await expect(canvas.getAllByRole('option')).toHaveLength(3);
      });
      await expect(canvas.getByRole('group', { name: 'Componentes' })).toBeVisible();
      await expect(canvas.getByRole('group', { name: 'Utilitários' })).toBeVisible();

      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(5);
      });
    });
  },
};
