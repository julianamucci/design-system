import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import { Checkbox } from './index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  checkboxComDescricaoSource,
  checkboxComRotuloSource,
  checkboxEmFormularioSource,
  checkboxGrupoSource,
  checkboxSelecionarTodosSource,
} from './checkbox.source';

const meta = {
  title: 'UI/Checkbox/Compositions',
  component: Checkbox,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: checkboxComRotuloSource },
      description: {
        component:
          'Padrões de composição do Checkbox: com label, com descrição auxiliar, grupo em fieldset e integração em formulário.',
      },
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLabel: Story = {
  render: () => ({
    components: { Checkbox },
    setup() { return {}; },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Checkbox id="with-label" />
        <label for="with-label" class="nds-label">
          Aceito os termos e condições
        </label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox está presente e associado à label', async () => {
      const checkbox = canvas.getByRole('checkbox', { name: 'Aceito os termos e condições' });
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Label está visível no DOM', async () => {
      const label = canvas.getByText('Aceito os termos e condições');
      await expect(label).toBeVisible();
    });

    await step('Clicar na label marca o checkbox', async () => {
      // O painel Interactions reexecuta a play no mesmo DOM: cada clique
      // checa o estado atual antes de disparar, então nunca é "clique cego"
      // que inverte o resultado no replay (par abrir/fechar).
      const checkbox = canvas.getByRole('checkbox');
      const label = canvas.getByText('Aceito os termos e condições');

      if (checkbox.getAttribute('aria-checked') !== 'false') await userEvent.click(checkbox);
      await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'false'));

      if (checkbox.getAttribute('aria-checked') !== 'true') await userEvent.click(label);
      await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'true'));
    });
  },
};

export const WithDescription: Story = {
  // O texto auxiliar entra por `aria-describedby`, fora do rótulo, e o par muda
  // de alinhamento por causa dele — a do meta mostraria só a caixa e o rótulo.
  parameters: { docs: { source: { transform: checkboxComDescricaoSource } } },
  render: () => ({
    components: { Checkbox },
    setup() { return {}; },
    template: `
      <div class="nds-cluster" data-align="start" data-spacing="sm">
        <Checkbox id="with-description" class="nds-mt-0-5" aria-describedby="desc-help" />
        <div class="nds-stack" data-spacing="xs">
          <label for="with-description" class="nds-label">
            Receber novidades por email
          </label>
          <p id="desc-help" class="nds-text-body">
            Enviaremos atualizações mensais sobre o produto.
          </p>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox está presente e associado à label', async () => {
      const checkbox = canvas.getByRole('checkbox', { name: 'Receber novidades por email' });
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Texto de descrição auxiliar está visível', async () => {
      const desc = canvas.getByText('Enviaremos atualizações mensais sobre o produto.');
      await expect(desc).toBeVisible();
    });

    await step('Checkbox tem aria-describedby apontando para a descrição', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toHaveAttribute('aria-describedby', 'desc-help');
    });
  },
};

export const FieldsetGroup: Story = {
  // O `fieldset` com `legend` é o que nomeia o conjunto: sem ele no snippet, a
  // lição do grupo se perde.
  parameters: { docs: { source: { transform: checkboxGrupoSource } } },
  render: () => ({
    components: { Checkbox },
    setup() { return {}; },
    template: `
      <fieldset class="nds-border-default nds-rounded-lg nds-p-4 nds-stack" data-spacing="sm">
        <legend class="nds-text-body nds-font-semibold nds-px-1">Preferências de notificação</legend>
        <div class="nds-cluster" data-spacing="sm">
          <Checkbox id="notif-email" />
          <label for="notif-email" class="nds-label">
            Receber novidades por email
          </label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <Checkbox id="notif-push" />
          <label for="notif-push" class="nds-label">
            Receber notificações push
          </label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <Checkbox id="notif-session" />
          <label for="notif-session" class="nds-label">
            Manter sessão ativa
          </label>
        </div>
      </fieldset>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Fieldset com legend está renderizado', async () => {
      const legend = canvas.getByText('Preferências de notificação');
      await expect(legend).toBeVisible();
    });

    await step('Três checkboxes estão presentes', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      await expect(checkboxes).toHaveLength(3);
    });

    await step('Cada checkbox está associado à sua label', async () => {
      await expect(canvas.getByRole('checkbox', { name: 'Receber novidades por email' })).toBeInTheDocument();
      await expect(canvas.getByRole('checkbox', { name: 'Receber notificações push' })).toBeInTheDocument();
      await expect(canvas.getByRole('checkbox', { name: 'Manter sessão ativa' })).toBeInTheDocument();
    });
  },
};

export const SelectAll: Story = {
  // A caixa mestra separada dos itens por uma linha é a composição inteira —
  // ela não existe em nenhuma outra story.
  parameters: { docs: { source: { transform: checkboxSelecionarTodosSource } } },
  render: () => ({
    components: { Checkbox },
    setup() { return {}; },
    template: `
      <fieldset class="nds-border-default nds-rounded-lg nds-p-4 nds-stack" data-spacing="sm">
        <legend class="nds-text-body nds-font-semibold nds-px-1">Preferências</legend>
        <div class="nds-cluster nds-border-b nds-pb-2" data-align="center" data-spacing="sm">
          <Checkbox id="select-all" />
          <label for="select-all" class="nds-label">
            Selecionar todos os itens
          </label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <Checkbox id="item-email" />
          <label for="item-email" class="nds-label">
            Receber novidades por email
          </label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <Checkbox id="item-push" />
          <label for="item-push" class="nds-label">
            Receber notificações push
          </label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <Checkbox id="item-session" />
          <label for="item-session" class="nds-label">
            Manter sessão ativa
          </label>
        </div>
      </fieldset>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox "Selecionar todos" está presente', async () => {
      const selectAll = canvas.getByRole('checkbox', { name: 'Selecionar todos os itens' });
      await expect(selectAll).toBeInTheDocument();
    });

    await step('Quatro checkboxes estão presentes (1 select-all + 3 itens)', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      await expect(checkboxes).toHaveLength(4);
    });

    await step('Itens individuais estão associados às suas labels', async () => {
      await expect(canvas.getByRole('checkbox', { name: 'Receber novidades por email' })).toBeInTheDocument();
      await expect(canvas.getByRole('checkbox', { name: 'Receber notificações push' })).toBeInTheDocument();
      await expect(canvas.getByRole('checkbox', { name: 'Manter sessão ativa' })).toBeInTheDocument();
    });
  },
};

export const InForm: Story = {
  parameters: {
    covers: ['functional.item5'],
    // O formulário inteiro é a composição: `name`/`value` no submit, `required`
    // e os outros componentes do design system em volta.
    docs: { source: { transform: checkboxEmFormularioSource } },
  },
  render: () => ({
    // Componentes reais do design system em vez de markup cru: reimplementar
    // <button>/<input> perde o que Button/Input já garantem (WCAG 1.4.4 — sem
    // altura cravada — e as classes .nds-* corretas), e diverge de silêncio.
    components: { Checkbox, Button, Input, Label },
    setup() { return {}; },
    template: `
      <form class="nds-stack" data-spacing="md" style="width: 18rem" @submit.prevent>
        <div class="nds-stack" data-spacing="sm">
          <Label for="form-name">Nome</Label>
          <Input id="form-name" type="text" placeholder="Seu nome" />
        </div>
        <div class="nds-stack" data-spacing="sm">
          <Label for="form-email">Email</Label>
          <Input id="form-email" type="email" placeholder="seu@email.com" />
        </div>
        <div class="nds-cluster" data-align="start" data-spacing="sm">
          <Checkbox id="form-terms" name="terms" value="accepted" required class="nds-mt-0-5" />
          <div class="nds-stack" data-spacing="xs">
            <Label for="form-terms">Aceito os termos e condições</Label>
            <p class="nds-text-caption nds-text-muted-foreground">
              Campo obrigatório para criar a conta.
            </p>
          </div>
        </div>
        <Button type="submit" class="nds-w-full">Criar conta</Button>
      </form>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox de termos está presente no formulário', async () => {
      const checkbox = canvas.getByRole('checkbox', { name: 'Aceito os termos e condições' });
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Checkbox é obrigatório (required)', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toBeRequired();
    });

    await step('Texto auxiliar do campo está visível', async () => {
      const hint = canvas.getByText('Campo obrigatório para criar a conta.');
      await expect(hint).toBeVisible();
    });

    await step('Botão de submit está presente', async () => {
      const button = canvas.getByRole('button', { name: 'Criar conta' });
      await expect(button).toBeInTheDocument();
    });

    await step('Marcar o checkbox inclui name/value no FormData do submit', async () => {
      // reka-ui só renderiza o <input> oculto quando há `name` E o Root está
      // dentro de um <form> real — daí o form de verdade neste template.
      const checkbox = canvas.getByRole('checkbox');
      if (checkbox.getAttribute('aria-checked') !== 'true') await userEvent.click(checkbox);
      await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'true'));

      const form = canvasElement.querySelector('form') as HTMLFormElement;
      await waitFor(() => {
        const data = new FormData(form);
        expect(data.get('terms')).toBe('accepted');
      });
    });
  },
};
