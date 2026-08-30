import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect, fn, waitFor } from 'storybook/test';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import PopoverDocs from '@/components/docs/PopoverDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { waitForPortal } from '@/lib/wait-for-portal';
import { panel } from './popover.fixtures';
import { popoverSource } from './popover.source';

const meta = {
  title: 'Primitives/Overlay/Popover',
  component: Popover,
  tags: ['autodocs', 'overlay'],
  parameters: {
    docs: {
      page: withAutoDocsTab(PopoverDocs),
      source: { transform: popoverSource },
      description: {
        component:
          'Popover é um overlay flutuante ativado por clique, renderizado em portal com role=dialog. Sempre forneça PopoverTitle para a11y. Use para conteúdo interativo curto — formulários, filtros, configurações contextuais.',
      },
    },
  },
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não-controlado.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    modal: {
      control: 'boolean',
      description: 'Quando true, foca trap e bloqueia scroll do body.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    // Vue não tem argTypesRegex — declarar handlers manualmente
    onOpenChange: {
      control: false,
      description: 'Callback disparado a cada abertura e fechamento, com o novo estado.',
      table: { category: 'events', type: { summary: '(open: boolean) => void' } },
    },
  },
  args: {
    defaultOpen: false,
    modal: false,
    // Sem valor inicial o control aparece vazio e a aba Actions nunca recebe
    // nada — regra `argtype_without_arg`.
    onOpenChange: fn(),
  },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<Meta<any>>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3',
      'accessibility.item4',
    ],
  },
  argTypes: {
    side: {
      control: { type: 'select' },
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Lado preferido do Content em relação ao trigger.',
      table: { type: { summary: '"top" | "bottom" | "left" | "right"' }, defaultValue: { summary: '"bottom"' } },
    },
    align: {
      control: { type: 'select' },
      options: ['start', 'center', 'end'],
      description: 'Alinhamento do Content ao longo do eixo do side.',
      table: { type: { summary: '"start" | "center" | "end"' }, defaultValue: { summary: '"center"' } },
    },
  },
  args: {
    side: 'bottom',
    align: 'center',
  },
  render: (args) => ({
    components: {
      Popover,
      PopoverContent,
      PopoverDescription,
      PopoverHeader,
      PopoverTitle,
      PopoverTrigger,
      Button,
    },
    setup() {
      return { args };
    },
    template: `
      <div style="contain: layout; min-height: 300px;" class="nds-stack" data-align="center" data-spacing="md">
        <Popover
          :key="String(args.defaultOpen) + String(args.modal)"
          :default-open="args.defaultOpen"
          :modal="args.modal"
          @update:open="args.onOpenChange"
        >
          <PopoverTrigger as-child>
            <Button variant="outline">Abrir popover</Button>
          </PopoverTrigger>
          <PopoverContent :side="args.side" :align="args.align">
            <PopoverHeader>
              <PopoverTitle>Configuracoes de exibição</PopoverTitle>
              <PopoverDescription>
                Ajuste a aparência do conteúdo da página.
              </PopoverDescription>
            </PopoverHeader>
            <div class="nds-cluster" data-justify="end" data-spacing="sm">
              <Button variant="ghost" size="sm">Cancelar</Button>
              <Button size="sm">Salvar</Button>
            </div>
          </PopoverContent>
        </Popover>

        <!-- Alvo inerte para a dispensa por clique fora: clicar em
             \`document.body\` depende da geometria da página e do ponto exato
             do clique sintético. -->
        <p class="nds-text-body nds-text-muted-foreground" data-testid="area-externa">
          Área externa
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir popover/i });
    // O tipo dos args de uma story com `Meta<any>` chega vazio; o espião é
    // declarado no meta e existe em runtime.
    const spy = (args as { onOpenChange: ReturnType<typeof fn> }).onOpenChange;

    const open = async () => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      return await waitForPortal('dialog', { timeout: 2000 });
    };
    const closed = async () => {
      await waitFor(() => {
        if (panel()) throw new Error('popover ainda aberto');
      }, { timeout: 2000 });
    };
    const close = async () => {
      if (trigger.getAttribute('aria-expanded') === 'true') await userEvent.click(trigger);
      await closed();
    };

    await step('O gatilho anuncia que abre um diálogo', async () => {
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger.tagName).toBe('BUTTON');
    });

    await step('Clicar no gatilho abre o painel com role=dialog', async () => {
      await close();
      const antes = spy.mock.calls.length;
      const p = await open();
      await expect(p).toBeVisible();
      await expect(p).toHaveClass(/nds-popover-content/);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(
        spy.mock.calls.length,
      ).toBe(antes + 1);
    });

    await step('O painel é nomeado pelo título que ele carrega', async () => {
      // E não pelo texto do gatilho: com título, o nome do diálogo é o título.
      const p = panel()!;
      const id = p.getAttribute('aria-labelledby');
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)).toHaveAttribute('data-slot', 'popover-title');
      await expect(p).toHaveAccessibleName(/Configuracoes de exibição/i);
    });

    await step('O painel não é modal', async () => {
      // Popover não bloqueia o resto da página: `aria-modal` faria o leitor de
      // tela esconder tudo o que está fora dele, que é contrato de Dialog.
      await expect(panel()).not.toHaveAttribute('aria-modal');
    });

    await step('O foco entra no painel ao abrir', async () => {
      await waitFor(() => {
        if (!panel()!.contains(document.activeElement)) {
          throw new Error('foco não entrou no painel');
        }
      });
    });

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      await open();
      await userEvent.keyboard('{Escape}');
      await closed();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    await step('Clicar fora fecha o painel', async () => {
      await open();
      await userEvent.click(canvas.getByTestId('area-externa'));
      await closed();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    // A story termina ABERTA: é o estado que o axe varre e o Chromatic fotografa.
    await step('Estado final: painel aberto', async () => {
      await expect(await open()).toBeVisible();
    });
  },
};
