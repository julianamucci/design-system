import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NDS_COMMAND } from './command';
import { commandWithGroupsSource } from './command.source';
import { WRAPPER, NO_RESULT, waitForOptions, visibleSeparators } from './command.fixtures';

import { figmaDesign } from '@shared/figma/design-links';
/*
 * As VARIANTES da paleta são as entradas de `variants.items` do conteúdo
 * compartilhado — inline, command palette e com grupos. `inline` é o próprio
 * Playground e `palette` depende do Dialog, então mora em Compositions; o que
 * sobra para cá é a lista dividida em grupos.
 *
 * Havia aqui uma story `Inline` que repetia o Playground com um grupo a menos:
 * a mesma peça em dois lugares da barra lateral, e só nesta stack. O grupo sai
 * do ARQUIVO, e o arquivo sai do conteúdo: `-variants` espelha `variants.items`.
 */
const meta: Meta = {
  title: 'Components/Overlay/Command/Variants',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_COMMAND] })],
  parameters: {
    design: figmaDesign('command'),
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'A paleta não tem variante visual por prop — o que muda entre os arranjos é a ' +
          'composição. Aqui fica a lista dividida em grupos nomeados, com divisor entre eles.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Com grupos ───────────────────────────────────────────────────────────────

export const WithGroups: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: { source: { transform: commandWithGroupsSource } },
  },
  render: () => ({
    template: `
      <div class="${WRAPPER}">
        <nds-command>
          <input ndsCommandInput placeholder="Buscar componente..." />

          <div ndsCommandList>
            <div ndsCommandGroup heading="Componentes">
              <div ndsCommandItem value="button">Button</div>
              <div ndsCommandItem value="input">Input</div>
              <div ndsCommandItem value="badge">Badge</div>
              <div ndsCommandItem value="separator">Separator</div>
            </div>

            <div ndsCommandSeparator></div>

            <div ndsCommandGroup heading="Utilitários">
              <div ndsCommandItem value="cn">cn()</div>
              <div ndsCommandItem value="clsx">clsx()</div>
              <div ndsCommandItem value="twmerge">twMerge()</div>
            </div>
          </div>

          <div ndsCommandEmpty>${NO_RESULT}</div>
        </nds-command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    // Os itens se registram no render seguinte ao da montagem, e a play
    // REEXECUTA no mesmo DOM: a busca parte sempre do zero.
    await userEvent.clear(field);
    await waitForOptions(canvasElement, 7);

    await step('Cada grupo é nomeado pelo próprio cabeçalho', async () => {
      const headings = canvasElement.querySelectorAll<HTMLElement>('.nds-command-group-heading');
      await expect(headings).toHaveLength(2);
      // Sem o `aria-labelledby` o leitor anuncia "grupo" e a pessoa não sabe
      // de qual bloco se trata.
      await expect(canvas.getByRole('group', { name: 'Componentes' })).toBeVisible();
      await expect(canvas.getByRole('group', { name: 'Utilitários' })).toBeVisible();
      // O cabeçalho NÃO é uma opção — o erro clássico deste componente é
      // deixá-lo entrar na lista e virar destino de navegação.
      await expect(headings[0].getAttribute('role')).toBeNull();
      const names = canvas.getAllByRole('option').map((o) => o.textContent?.trim());
      await expect(names).not.toContain('Componentes');
    });

    await step('Um divisor separa os dois grupos, fora da árvore', async () => {
      await waitFor(async () => {
        await expect(visibleSeparators(canvasElement)).toHaveLength(1);
      });
      await expect(visibleSeparators(canvasElement)[0]).toHaveAttribute('aria-hidden', 'true');
      // Só `option` e `group` são filhos permitidos de um listbox.
      await expect(canvas.queryAllByRole('separator')).toHaveLength(0);
    });

    await step('Buscando "n" o filtro atravessa os dois grupos — sobram 3', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'n');
      // Button e Input (Componentes) + cn() (Utilitários).
      await waitForOptions(canvasElement, 3);
      await expect(canvas.getByRole('group', { name: 'Componentes' })).toBeVisible();
      await expect(canvas.getByRole('group', { name: 'Utilitários' })).toBeVisible();
      await expect(visibleSeparators(canvasElement)).toHaveLength(1);
    });

    await step('Buscando "badge" sobra 1 comando e nenhum divisor', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'badge');
      await waitForOptions(canvasElement, 1);
      // Um grupo só na tela: divisor sem nada de um dos lados seria ruído.
      await waitFor(async () => {
        await expect(visibleSeparators(canvasElement)).toHaveLength(0);
      });
      await expect(canvas.queryAllByRole('group')).toHaveLength(1);
    });

    await step('A story termina no estado padrão, com os 7 comandos', async () => {
      await userEvent.clear(field);
      await waitForOptions(canvasElement, 7);
      await waitFor(async () => {
        await expect(visibleSeparators(canvasElement)).toHaveLength(1);
      });
    });
  },
};
