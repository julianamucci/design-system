import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, userEvent, fn } from 'storybook/test';
import { reprovasDoDesabilitado } from '@shared/testing/checkbox-probe';
import { Checkbox } from './index';

// Ferramentas de teclado/ponteiro entregues ao contrato compartilhado. Iguais
// nas cinco stacks — o que muda entre elas é o componente, não a medição.
const FERRAMENTAS = {
  tab: () => userEvent.tab(),
  teclar: (sequencia: string) => userEvent.keyboard(sequencia),
  // `pointerEventsCheck: 0`: a caixa desabilitada mantém `cursor: not-allowed`,
  // e a checagem do userEvent reprovaria antes de o clique chegar ao componente
  // — que é justamente o que se quer testar.
  clicar: (el: HTMLElement) => userEvent.click(el, { pointerEventsCheck: 0 }),
};

const meta = {
  title: 'UI/Checkbox/States',
  component: Checkbox,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Estados do Checkbox: unchecked (padrão), checked, indeterminate, disabled e error (aria-invalid). O indeterminado é o terceiro valor do próprio estado (checked="indeterminate"), não uma propriedade dedicada.',
      },
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// Story de estado visual — não interage; o Chromatic fotografa o final.
export const Unchecked: Story = {
  parameters: { covers: ['visual.item1', 'accessibility.item2'] },
  render: () => ({
    components: { Checkbox },
    setup() { return {}; },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Checkbox id="unchecked" />
        <label for="unchecked" class="nds-label">
          Aceito os termos e condições
        </label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox presente e desmarcado', async () => {
      await expect(checkbox).toBeInTheDocument();
      await expect(checkbox).not.toBeChecked();
    });

    await step('aria-checked é false', async () => {
      await expect(checkbox).toHaveAttribute('aria-checked', 'false');
    });
  },
};

// Story de estado visual — não interage; cobre functional.item6 (estado
// inicial marcado sem controle externo) pela própria montagem.
export const Checked: Story = {
  parameters: { covers: ['visual.item2', 'functional.item6'] },
  render: () => ({
    components: { Checkbox },
    setup() { return {}; },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Checkbox id="checked" :checked="true" />
        <label for="checked" class="nds-label">
          Aceito os termos e condições
        </label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox presente e marcado — estado inicial sem controle externo', async () => {
      await expect(checkbox).toBeInTheDocument();
      await expect(checkbox).toBeChecked();
    });

    await step('aria-checked é true', async () => {
      await expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });
  },
};

// Story de estado visual — não interage. O indeterminado é o terceiro valor
// do próprio checked (:checked="'indeterminate'"), não um atributo HTML: a
// asserção correta é aria-checked="mixed" (ou data-state), nunca
// toHaveAttribute('indeterminate').
export const Indeterminate: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    components: { Checkbox },
    setup() { return {}; },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Checkbox id="indeterminate" :checked="'indeterminate'" />
        <label for="indeterminate" class="nds-label">
          Selecionar todos os itens
        </label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox presente com estado indeterminado (aria-checked=mixed)', async () => {
      await expect(checkbox).toBeInTheDocument();
      await expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    });
  },
};

export const Disabled: Story = {
  parameters: { covers: ['functional.item4', 'accessibility.item6'] },
  args: {
    'onUpdate:modelValue': fn(),
  } as never,
  render: (args) => ({
    components: { Checkbox },
    setup() { return { args }; },
    // data-disabled="true" no contêiner do par é o que esmaece o rótulo de
    // verdade — .nds-label não tem equivalente a peer-disabled, e a raiz do
    // Checkbox nunca é um <input disabled> (então .nds-peer:disabled fica inerte aqui).
    template: `
      <div class="nds-cluster" data-spacing="sm" data-disabled="true">
        <Checkbox id="disabled" :disabled="true" v-bind="args" />
        <label for="disabled" class="nds-label">
          Manter sessão ativa
        </label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');
    const onUpdate = (args as { 'onUpdate:modelValue': ReturnType<typeof fn> })['onUpdate:modelValue'];

    await step(
      'Alcançável pelo Tab, anunciada como desabilitada, e nem clique nem Espaço alternam',
      async () => {
        // Contrato compartilhado — a mesma lista nas cinco stacks. `toBeDisabled()`
        // saiu daqui: ele lê o atributo nativo e ignora `aria-disabled`, então
        // afirmaria o contrário da decisão (peça fora da tabulação) e a forma
        // negada nem poderia falhar.
        onUpdate.mockClear();
        await expect(await reprovasDoDesabilitado(checkbox, FERRAMENTAS)).toEqual([]);
      },
    );

    await step('O callback de mudança não disparou em nenhuma das tentativas', async () => {
      await expect(onUpdate).not.toHaveBeenCalled();
    });
  },
};

// Interage, mas o estado final é o mesmo do inicial: uma caixa desabilitada não
// alterna em rodada nenhuma, então a foto do Chromatic continua sendo a do
// estado marcado e a play sobrevive ao REPLAY sem par idempotente.
export const DisabledChecked: Story = {
  parameters: { covers: ['visual.item4'] },
  render: () => ({
    components: { Checkbox },
    setup() { return {}; },
    template: `
      <div class="nds-cluster" data-spacing="sm" data-disabled="true">
        <Checkbox id="disabled-checked" :disabled="true" :checked="true" />
        <label for="disabled-checked" class="nds-label">
          Receber notificações push
        </label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step(
      'Alcançável pelo Tab, anunciada como desabilitada, e nem clique nem Espaço alternam',
      async () => {
        await expect(await reprovasDoDesabilitado(checkbox, FERRAMENTAS)).toEqual([]);
      },
    );

    await step('Checkbox continua marcado — desabilitado não é o mesmo que vazio', async () => {
      await expect(checkbox).toBeChecked();
    });
  },
};

// Story de estado visual — não interage.
export const Error: Story = {
  parameters: { covers: ['visual.item5'] },
  render: () => ({
    components: { Checkbox },
    setup() { return {}; },
    template: `
      <div class="nds-stack" data-spacing="xs">
        <div class="nds-cluster" data-spacing="sm">
          <Checkbox id="error" aria-invalid="true" aria-describedby="error-msg" />
          <label for="error" class="nds-label">
            Aceito os termos e condições
          </label>
        </div>
        <p id="error-msg" class="nds-text-body nds-text-destructive" style="padding-left: 1.5rem">
          Você precisa aceitar os termos para continuar.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox com aria-invalid presente', async () => {
      await expect(checkbox).toBeInTheDocument();
      await expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    });

    await step('aria-describedby aponta para mensagem de erro', async () => {
      await expect(checkbox).toHaveAttribute('aria-describedby', 'error-msg');
    });

    await step('Mensagem de erro visível', async () => {
      await expect(canvas.getByText(/precisa aceitar/)).toBeVisible();
    });
  },
};

export const FocusVisible: Story = {
  parameters: {
    covers: ['accessibility.item4'],
    docs: {
      description: {
        story:
          'Estado de foco via teclado. Use Tab para navegar e verificar o ring de foco --ring.',
      },
    },
  },
  render: () => ({
    components: { Checkbox },
    setup() { return {}; },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Checkbox id="focus" />
        <label for="focus" class="nds-label">
          Foco visível via teclado
        </label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox recebe foco via teclado', async () => {
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(checkbox).toHaveFocus();
    });

    await step('Anel de foco visível após navegação por teclado', async () => {
      const style = getComputedStyle(checkbox);
      const anelVisivel = style.outlineStyle !== 'none' || style.boxShadow !== 'none';
      await expect(anelVisivel).toBe(true);
    });
  },
};
