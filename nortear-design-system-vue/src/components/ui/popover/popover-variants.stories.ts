import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, userEvent } from 'storybook/test';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { waitForPortal } from '@/lib/wait-for-portal';
import { panel } from './popover.fixtures';
import {
  popoverWithTitleSource,
  popoverContentLivreSource,
  popoverFormSource,
} from './popover.source';

const meta = {
  title: 'Components/Overlay/Popover/Variants',
  component: Popover,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: popoverContentLivreSource },
      description: {
        component:
          'Conteúdo livre, cabeçalho com título e descrição, e formulário inline. O painel sempre precisa de nome acessível: com título ele vem do aria-labelledby, sem título ele herda o texto do gatilho.',
      },
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Button,
  Input,
  Label,
};

export const Default: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      description: {
        story:
          'Conteúdo livre — apenas PopoverContent com texto. Sem título, o painel herda o nome acessível do gatilho.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div class="nds-min-h-60" style="contain: layout">
        <Popover :default-open="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Ver atalhos</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom">
            <p class="nds-text-body">Use Ctrl+K para abrir a busca em qualquer tela.</p>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
  play: async ({ step }) => {
    await step('Sem título, o painel herda o nome acessível do gatilho', async () => {
      // `role="dialog"` sem nome reprova na regra aria-dialog-name do axe.
      const dialog = await waitForPortal('dialog');
      await expect(dialog).toHaveAccessibleName('Ver atalhos');
    });

    await step('E carrega a classe do design system com o conteúdo livre', async () => {
      await expect(panel()).toHaveClass(/nds-popover-content/);
      await expect(panel()!.textContent).toMatch(/Ctrl\+K/);
    });
  },
};

export const WithTitle: Story = {
  parameters: {
    covers: [
      'visual.item2', 'accessibility.item5', 'accessibility.item3', 'functional.item4',
    ],
    docs: {
      // Entram três peças que o meta não tem — Header, Title e Description —, e
      // é o título que passa a nomear o painel.
      source: { transform: popoverWithTitleSource },
      description: {
        story: 'Header completo — PopoverHeader com Title + Description e botões de ação (Cancelar / Salvar).',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div class="nds-min-h-70" style="contain: layout">
        <Popover :default-open="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Configuracoes</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom">
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
      </div>
    `,
  }),
  play: async ({ step }) => {
    await step('O título nomeia o painel por aria-labelledby', async () => {
      const dialog = await waitForPortal('dialog');
      const id = dialog.getAttribute('aria-labelledby');
      await expect(id).toBeTruthy();
      const title = document.getElementById(id!)!;
      await expect(title).toHaveAttribute('data-slot', 'popover-title');
      await expect(title).toHaveClass(/nds-popover-title/);
      await expect(dialog).toHaveAccessibleName(/Configuracoes de exibição/i);
    });

    await step('E a descrição usa a classe própria', async () => {
      const desc = panel()!.querySelector('[data-slot="popover-description"]')!;
      await expect(desc).toHaveClass(/nds-popover-description/);
    });

    await step('Tab caminha entre os controles internos', async () => {
      const ctx = within(panel()!);
      const cancelar = ctx.getByRole('button', { name: /Cancelar/i });
      const salvar = ctx.getByRole('button', { name: /Salvar/i });
      cancelar.focus();
      await userEvent.tab();
      await expect(salvar).toHaveFocus();
    });

    await step('E o elemento focado por teclado mostra o anel de foco', async () => {
      // `:focus-visible` é a condição exata que o CSS compartilhado usa para
      // desenhar o anel — se o foco tivesse vindo do ponteiro, o navegador não
      // casaria a pseudo-classe e o anel não apareceria.
      const salvar = within(panel()!).getByRole('button', { name: /Salvar/i });
      await expect(salvar.matches(':focus-visible')).toBe(true);
      // O anel de `.nds-button` é box-shadow, não outline — medir a propriedade
      // errada daria verde em qualquer elemento.
      await expect(getComputedStyle(salvar).boxShadow).not.toBe('none');
    });
  },
};

export const Form: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      // O painel passa a guardar conteúdo interativo com estado próprio: campos,
      // rótulos e submit não aparecem em nenhuma outra story do arquivo.
      source: { transform: popoverFormSource },
      description: {
        story: 'Formulário inline — Inputs e botão submit dentro do PopoverContent.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div class="nds-min-h-90" style="contain: layout">
        <Popover :default-open="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Editar perfil</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom">
            <PopoverHeader>
              <PopoverTitle>Editar perfil</PopoverTitle>
            </PopoverHeader>
            <form class="nds-stack" data-spacing="sm" @submit.prevent>
              <Label for="popover-var-name" class="nds-text-caption">Nome</Label>
              <Input id="popover-var-name" model-value="Ana Ribeiro" />
              <Label for="popover-var-email" class="nds-text-caption">Email</Label>
              <Input id="popover-var-email" type="email" model-value="ana@nortear.com.br" />
              <Button type="submit" size="sm">Atualizar</Button>
            </form>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
  play: async ({ step }) => {
    await step('Os campos existem e estão associados aos rótulos', async () => {
      await waitForPortal('dialog');
      const ctx = within(panel()!);
      await expect(ctx.getByLabelText(/Nome/i)).toHaveValue('Ana Ribeiro');
      await expect(ctx.getByRole('button', { name: /Atualizar/i })).toBeInTheDocument();
    });

    await step('E aceitam digitação — o painel não é inerte', async () => {
      // Conteúdo interativo dentro do painel é a razão de existir do popover.
      const name = within(panel()!).getByLabelText(/Nome/i);
      await userEvent.clear(name);
      await userEvent.type(name, 'Bruno Lima');
      await expect(name).toHaveValue('Bruno Lima');
    });
  },
};
