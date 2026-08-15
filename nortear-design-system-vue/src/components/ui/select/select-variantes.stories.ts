import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './index';
import { Globe } from 'lucide-vue-next';
import {
  waitForPortal,
  REGRA_GUARDA_DE_FOCO,
  REGRA_ROLAGEM_DA_LISTA,
} from '@/lib/wait-for-portal';

const REGIOES = {
  Sudeste: [
    { value: 'sp', label: 'São Paulo' },
    { value: 'rj', label: 'Rio de Janeiro' },
    { value: 'mg', label: 'Minas Gerais' },
    { value: 'es', label: 'Espírito Santo' },
  ],
  Sul: [
    { value: 'rs', label: 'Rio Grande do Sul' },
    { value: 'sc', label: 'Santa Catarina' },
    { value: 'pr', label: 'Paraná' },
  ],
} as const;

const meta = {
  title: 'UI/Select/Variants',
  component: Select,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    // As três terminam ABERTAS: é a lista que muda entre as variantes, não o
    // campo fechado, e é ela que a regressão visual precisa fotografar. Com a
    // lista aberta o primitivo marca o resto da página como escondido para o
    // leitor de tela, e o axe lê a combinação como armadilha de foco — o motivo
    // completo está em `wait-for-portal`.
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
    docs: {
      description: {
        component:
          'Variantes do Select: lista plana, lista agrupada por categoria e opção com ícone inline antes do texto.',
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
  SelectTrigger,
  SelectValue,
  Globe,
};

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Lista simples — apenas SelectItem dentro do SelectContent. Use para 3–9 opções fixas sem agrupamento.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 260px;">
        <Select>
          <SelectTrigger aria-label="Selecionar estado" class="" style="width: 14rem">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sp">São Paulo</SelectItem>
            <SelectItem value="rj">Rio de Janeiro</SelectItem>
            <SelectItem value="mg">Minas Gerais</SelectItem>
            <SelectItem value="es">Espírito Santo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });

    await step('Campo exibe o placeholder e o nome acessível', async () => {
      await expect(trigger).toHaveTextContent(/Selecione/);
      await expect(trigger).toHaveAttribute('aria-label', 'Selecionar estado');
    });

    await step('Abrir mostra uma lista plana, sem cabeçalho de grupo', async () => {
      // Idempotente: o clique só acontece com a lista fechada.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      const listbox = await waitForPortal('listbox', { timeout: 2000 });
      await expect(listbox).toBeVisible();
      const opcoes = within(listbox).getAllByRole('option');
      await expect(opcoes).toHaveLength(4);
      await expect(opcoes[0]).toHaveAccessibleName('São Paulo');
      // Nada escolhido ainda: nenhuma opção se anuncia selecionada. A conta é
      // por PAPEL, não por atributo — em lista de escolha única a marca só é
      // exigida na opção escolhida, e cada lib decide se escreve a negativa.
      await expect(
        within(listbox).queryAllByRole('option', { selected: true }),
      ).toHaveLength(0);
      await expect(within(listbox).queryAllByRole('group')).toHaveLength(0);
    });
  },
};

export const WithGroups: Story = {
  parameters: {
    // Sete opções mais dois cabeçalhos: esta lista transborda a caixa e ROLA.
    // O motivo de a regra sair está em `wait-for-portal`.
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO, REGRA_ROLAGEM_DA_LISTA] } },
    docs: {
      description: {
        story: 'SelectGroup + SelectLabel agrupam opções por categoria. Útil quando há mais de uma dimensão lógica (regiões, tipos, etc.).',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 360px;">
        <Select>
          <SelectTrigger aria-label="Selecionar estado por região" class="" style="width: 14rem">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sudeste</SelectLabel>
              <SelectItem value="sp">São Paulo</SelectItem>
              <SelectItem value="rj">Rio de Janeiro</SelectItem>
              <SelectItem value="mg">Minas Gerais</SelectItem>
              <SelectItem value="es">Espírito Santo</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Sul</SelectLabel>
              <SelectItem value="rs">Rio Grande do Sul</SelectItem>
              <SelectItem value="sc">Santa Catarina</SelectItem>
              <SelectItem value="pr">Paraná</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar estado por região/i });

    const abrir = async () => {
      // Idempotente: o clique só acontece com a lista fechada.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      return await waitForPortal('listbox', { timeout: 2000 });
    };

    await step('Cada categoria vira um grupo nomeado pelo cabeçalho', async () => {
      const listbox = await abrir();
      const grupos = within(listbox).getAllByRole('group');
      await expect(grupos).toHaveLength(Object.keys(REGIOES).length);
      // O nome do grupo depende de o `aria-labelledby` apontar para um id que
      // EXISTE — sem isso o grupo ficaria anônimo e a referência, quebrada.
      for (const [i, nome] of Object.keys(REGIOES).entries()) {
        await expect(grupos[i]).toHaveAccessibleName(nome);
      }
    });

    await step('As opções continuam todas na mesma lista', async () => {
      const listbox = await abrir();
      const total = Object.values(REGIOES).reduce((soma, g) => soma + g.length, 0);
      await expect(within(listbox).getAllByRole('option')).toHaveLength(total);
    });
  },
};

export const WithIcon: Story = {
  parameters: {
    docs: {
      description: {
        story: 'SelectItem com ícone inline antes do texto — composição via children diretos do item.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 280px;">
        <Select>
          <SelectTrigger aria-label="Selecionar idioma" class="" style="width: 14rem">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pt-BR">
              <Globe class="nds-size-4" aria-hidden="true" />
              <span>Português (BR)</span>
            </SelectItem>
            <SelectItem value="en">
              <Globe class="nds-size-4" aria-hidden="true" />
              <span>English</span>
            </SelectItem>
            <SelectItem value="es">
              <Globe class="nds-size-4" aria-hidden="true" />
              <span>Español</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar idioma/i });

    const abrir = async () => {
      // Idempotente: o clique só acontece com a lista fechada.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      return await waitForPortal('listbox', { timeout: 2000 });
    };

    await step('O ícone entra na opção e fica fora do nome acessível', async () => {
      const listbox = await abrir();
      const opcoes = within(listbox).getAllByRole('option');
      await expect(opcoes).toHaveLength(3);
      await expect(opcoes[0].querySelector('svg')).toBeTruthy();
      // Ícone decorativo: o nome acessível continua sendo só o rótulo, sem eco.
      await expect(opcoes[0]).toHaveAccessibleName('Português (BR)');
    });

    await step('O ícone é dimensionado pela folha do componente', async () => {
      const listbox = await abrir();
      const icone = within(listbox)
        .getAllByRole('option')[0]
        .querySelector('svg') as SVGElement;
      await expect(getComputedStyle(icone).width).toBe('16px');
    });
  },
};
