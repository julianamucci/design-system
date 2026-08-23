import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './index';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  waitForPortal,
  FOCUS_RULE_GUARDA,
  LIST_RULE_SCROLL,
} from '@/lib/wait-for-portal';
import {
  selectWithLabelSource,
  selectWithSeparatorSource,
  selectControlledSource,
  formSelectSource,
} from './select.source';

const meta = {
  title: 'UI/Select/Compositions',
  component: Select,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: selectWithLabelSource },
      description: {
        component:
          'Composicoes reais: ComLabel (label externo associado), Controlado (modelValue + @update:modelValue), EmFormulario (Select dentro de form) e ComSeparator (grupos divididos por SelectSeparator).',
      },
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Label,
  Button,
};

export const WithLabel: Story = {
  parameters: {
    docs: {
      description: { story: 'Label externo associado ao trigger via aria-labelledby — padrão recomendado em formulários.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 280px;">
        <div class="nds-grid nds-w-2xs" data-spacing="sm">
          <!-- O aria-labelledby apontava para "comp-estado-label", um id que
               não existia em lugar nenhum: referência quebrada deixa o campo
               anônimo para o leitor de tela, sem erro nenhum na tela. -->
          <Label id="comp-estado-label" for="comp-estado">Estado</Label>
          <Select>
            <SelectTrigger id="comp-estado" aria-labelledby="comp-estado-label" class="nds-w-full">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sp">São Paulo</SelectItem>
              <SelectItem value="rj">Rio de Janeiro</SelectItem>
              <SelectItem value="mg">Minas Gerais</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('O rótulo externo nomeia o campo', async () => {
      // `role="combobox"` não tira nome do próprio conteúdo — o conteúdo é o
      // VALOR. Sem rótulo externo o campo ficaria anônimo, mesmo mostrando
      // texto.
      await expect(canvas.getByRole('combobox')).toHaveAccessibleName('Estado');
    });
  },
};

export const Controlled: Story = {
  parameters: {
    docs: {
      // O estado sai do componente: entram o `ref`, a prop de entrada e o
      // evento de saída, nenhum deles no snippet do meta.
      source: { transform: selectControlledSource },
      description: { story: 'Seleção controlada por estado externo via modelValue + @update:modelValue.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const value = ref<string>('');
      return { value };
    },
    template: `
      <div class="nds-grid nds-min-h-80 nds-w-2xs" data-spacing="sm" style="contain: layout">
        <div class="nds-stack" data-spacing="sm">
          <Label for="ctrl-estado">Estado</Label>
          <Select :model-value="value" @update:model-value="(v) => value = v">
            <SelectTrigger id="ctrl-estado" aria-label="Selecionar estado" class="nds-w-full">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sp">São Paulo</SelectItem>
              <SelectItem value="rj">Rio de Janeiro</SelectItem>
              <SelectItem value="mg">Minas Gerais</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p class="nds-text-caption nds-text-muted-foreground">Valor atual: <code>{{ value || '—' }}</code></p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Valor inicial vazio', async () => {
      await expect(canvas.getByText(/Valor atual:/i)).toBeVisible();
    });
    await step('Selecionar item atualiza valor exposto', async () => {
      const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
      // Idempotente: o clique só acontece com a lista fechada.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      const option = await waitForPortal('option', { name: /São Paulo/i });
      await userEvent.click(option);
      await waitFor(async () => {
        // O estado externo recebe o VALOR…
        await expect(canvasElement.querySelector('code')?.textContent).toBe('sp');
        // …e o campo passa a exibir o RÓTULO correspondente.
        await expect(trigger).toHaveTextContent(/São Paulo/);
      });
    });
  },
};

export const InForm: Story = {
  parameters: {
    docs: {
      // O formulário em volta e o `name` que leva o valor no envio.
      source: { transform: formSelectSource },
      description: { story: 'Select integrado em form HTML — prop name expõe o valor no submit.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 320px;">
        <form class="nds-grid nds-w-2xs" data-spacing="sm" @submit.prevent>
          <div class="nds-stack" data-spacing="sm">
            <Label for="form-estado">Estado</Label>
            <Select name="state">
              <SelectTrigger id="form-estado" aria-label="Selecionar estado" class="nds-w-full">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sp">São Paulo</SelectItem>
                <SelectItem value="rj">Rio de Janeiro</SelectItem>
                <SelectItem value="mg">Minas Gerais</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <!-- O primitivo Button, e não um button com classes soltas: a versão
               anterior pintava o fundo com nds-bg-primary e pedia o texto com
               text-primary-foreground, classe SEM prefixo nds- que não existe
               em folha nenhuma. O texto ficava na cor padrão sobre o fundo
               escuro — 1.1:1 de contraste, reprovado pelo axe. E a altura vinha
               cravada em --height-sm, que não cresce com a fonte do navegador. -->
          <Button type="submit">Enviar</Button>
        </form>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });

    await step('Escolher uma opção preenche o campo escondido do formulário', async () => {
      // Idempotente: o clique só acontece com a lista fechada.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      const option = await waitForPortal('option', { name: /Rio de Janeiro/i });
      await userEvent.click(option);
      await waitFor(async () => {
        await expect(trigger).toHaveTextContent(/Rio de Janeiro/);
      });
    });

    await step('O envio leva o valor no FormData', async () => {
      // Ler o `FormData` do formulário real é o que prova a integração: o
      // primitivo mantém um campo escondido com `name`, e é ele que a
      // serialização nativa enxerga. Espiar um callback provaria só o clique.
      const form = canvasElement.querySelector('form') as HTMLFormElement;
      await userEvent.click(canvas.getByRole('button', { name: /Enviar/i }));
      await waitFor(async () => {
        await expect(Object.fromEntries(new FormData(form).entries())).toEqual({
          state: 'rj',
        });
      });
    });
  },
};

export const WithSeparator: Story = {
  parameters: {
    // Termina ABERTA: o separador só existe dentro da lista. Quatro opções,
    // dois cabeçalhos e um traço — a lista transborda a caixa e ROLA. Os
    // motivos das duas regras estão em `wait-for-portal`.
    a11y: { config: { rules: [FOCUS_RULE_GUARDA, LIST_RULE_SCROLL] } },
    docs: {
      // Grupos, cabeçalhos e o traço entre eles — a lista inteira muda.
      source: { transform: selectWithSeparatorSource },
      description: { story: 'SelectSeparator entre grupos para divisão visual explícita — útil quando há muitas categorias.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 400px;">
        <Select>
          <SelectTrigger aria-label="Selecionar estado" class="nds-w-3xs">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sudeste</SelectLabel>
              <SelectItem value="sp">São Paulo</SelectItem>
              <SelectItem value="rj">Rio de Janeiro</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Sul</SelectLabel>
              <SelectItem value="rs">Rio Grande do Sul</SelectItem>
              <SelectItem value="sc">Santa Catarina</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });

    const abrir = async () => {
      // Idempotente: o clique só acontece com a lista fechada.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      return await waitForPortal('listbox', { timeout: 2000 });
    };

    await step('Os dois grupos aparecem nomeados pelos cabeçalhos', async () => {
      const listbox = await abrir();
      const grupos = within(listbox).getAllByRole('group');
      await expect(grupos).toHaveLength(2);
      await expect(grupos[0]).toHaveAccessibleName('Sudeste');
      await expect(grupos[1]).toHaveAccessibleName('Sul');
    });

    await step('A divisão entre grupos é decorativa', async () => {
      // Linha para o olho, silêncio para o leitor de tela — quem separa
      // semanticamente é o grupo.
      const listbox = await abrir();
      await expect(listbox.querySelectorAll('.nds-select-separator')).toHaveLength(1);
      await expect(within(listbox).getAllByRole('option')).toHaveLength(4);
    });
  },
};
