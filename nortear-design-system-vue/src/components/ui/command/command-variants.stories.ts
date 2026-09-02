import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, waitFor, expect } from 'storybook/test';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { commandWithGroupsSource } from './command.source';

/*
 * As VARIANTES da paleta são as entradas de `variants.items` do conteúdo
 * compartilhado — inline, command palette e com grupos. `inline` é o próprio
 * Playground e `palette` depende do Dialog, então mora em Compositions; o que
 * sobra para cá é a lista dividida em grupos.
 *
 * Antes esta story morava em Compositions em quatro stacks e em Variants numa
 * quinta — a mesma peça em dois lugares da barra lateral, conforme a stack que
 * a pessoa estivesse lendo. O grupo sai do ARQUIVO, e o arquivo sai do
 * conteúdo: `-variants` espelha `variants.items`, `-states` espelha `states`.
 */
const meta = {
  title: 'Primitives/Overlay/Command/Variants',
  component: Command,
  tags: ['overlay'],
  parameters: {
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: commandWithGroupsSource },
      description: {
        component:
          'A paleta não tem variante visual por prop — o que muda entre os arranjos é a '
          + 'composição. Aqui fica a lista dividida em grupos nomeados, com divisor entre eles.',
      },
    },
  },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Grupos e divisor ─────────────────────────────────────────────────────────

export const WithGroups: Story = {
  parameters: { covers: ['visual.item1'] },
  render: () => ({
    components: {
      Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
    },
    template: `
      <div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
        <Command>
          <CommandInput placeholder="Buscar componente..." />

          <CommandList>
            <CommandGroup heading="Componentes">
              <CommandItem value="button">Button</CommandItem>
              <CommandItem value="input">Input</CommandItem>
              <CommandItem value="select">Select</CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Utilitários">
              <CommandItem value="separator">Separator</CommandItem>
              <CommandItem value="badge">Badge</CommandItem>
              <CommandItem value="avatar">Avatar</CommandItem>
            </CommandGroup>
          </CommandList>

          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        </Command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);
    await waitFor(async () => {
      // Com o campo vazio, os seis comandos dos dois grupos aparecem.
      await expect(canvas.getAllByRole('option')).toHaveLength(6);
    });

    await step('Cada grupo é um grupo nomeado pelo próprio cabeçalho', async () => {
      const groups = canvas.getAllByRole('group');
      await expect(groups).toHaveLength(2);
      await expect(canvas.getByRole('group', { name: 'Componentes' })).toBeVisible();
      await expect(canvas.getByRole('group', { name: 'Utilitários' })).toBeVisible();

      const cabecalhos = root.querySelectorAll<HTMLElement>('.nds-command-group-heading');
      await expect(cabecalhos).toHaveLength(2);
      await expect(cabecalhos[0]).toHaveAttribute('data-slot', 'command-group-heading');
      // Cabeçalho não é comando: ele nomeia o grupo, não executa nada.
      await expect(cabecalhos[0].getAttribute('role')).not.toBe('option');
    });

    await step('O divisor não é um comando nem um filho do listbox', async () => {
      const divisor = root.querySelector<HTMLElement>('[data-slot="command-separator"]')!;
      await expect(divisor).toHaveClass(/nds-command-separator/);
      // ARIA só admite `option` e `group` dentro de um listbox; o divisor sai da
      // árvore em vez de virar filho ilegal.
      await expect(divisor).toHaveAttribute('aria-hidden', 'true');
      await expect(divisor.getAttribute('role')).not.toBe('separator');
    });

    await step('O filtro atravessa os dois grupos', async () => {
      await userEvent.type(field, 'a');

      // Buscando "a": Separator, Badge e Avatar (Utilitários) e nada de
      // Componentes — o filtro não respeita fronteira de grupo.
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(3);
      });
      const groups = root.querySelectorAll<HTMLElement>('[data-slot="command-group"]');
      await expect(groups[0]).not.toBeVisible();
      await expect(groups[1]).toBeVisible();
    });

    await step('A story termina no estado padrão — é o quadro documentado', async () => {
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(6);
      });
      const groups = root.querySelectorAll<HTMLElement>('[data-slot="command-group"]');
      await expect(groups[0]).toBeVisible();
      await expect(groups[1]).toBeVisible();
    });
  },
};
