import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './index';
import { waitForPortal, REGRA_GUARDA_DE_FOCO } from '@/lib/wait-for-portal';
import { medirAnelDeFoco, ESTADOS, ESTADOS_POR_VALOR } from '@shared/testing/select-probe';

const meta = {
  title: 'UI/Select/States',
  component: Select,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Vazio, preenchido, aberto, bloqueado, inválido e compacto. Teclado, foco e posicionamento vêm do primitivo — o que estas stories provam é que a composição não desfaz nada disso.',
      },
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
};

export const Default: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      description: { story: 'Nada escolhido: o campo mostra o placeholder, em cor secundária, e a lista não existe.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() { return { estados: ESTADOS }; },
    template: `
      <div style="contain: layout">
        <Select>
          <SelectTrigger aria-label="Selecionar estado" style="width: 14rem">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="e in estados" :key="e.value" :value="e.value">{{ e.label }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });

    await step('O campo anuncia estar vazio e fechado', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveTextContent(/Selecione/);
      // `data-placeholder` é o que faz a folha pintar o texto em cor
      // secundária; sem ele o placeholder teria o peso de um valor escolhido.
      await expect(canvasElement.querySelector('[data-placeholder]')).not.toBeNull();
    });

    await step('A lista não existe enquanto está fechada', async () => {
      // Fechado não é "escondido": o portal desmonta. Uma lista só escondida
      // continuaria no percurso do leitor de tela.
      await expect(within(document.body).queryAllByRole('listbox')).toHaveLength(0);
      await expect(within(document.body).queryAllByRole('option')).toHaveLength(0);
    });
  },
};

export const Selected: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      description: {
        story:
          'Valor pré-escolhido. O rótulo vem de um mapa local porque a lista ainda não foi aberta nenhuma vez — e é dela que o primitivo tira os rótulos. (Pré-selecionar serve para ver o estado; em formulário real, evite.)',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() { return { estados: ESTADOS, rotulos: ESTADOS_POR_VALOR }; },
    template: `
      <div style="contain: layout">
        <Select default-value="rj">
          <SelectTrigger aria-label="Selecionar estado" style="width: 14rem">
            <SelectValue placeholder="Selecione...">
              <template #default="{ modelValue }">
                {{ rotulos[modelValue] ?? 'Selecione...' }}
              </template>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="e in estados" :key="e.value" :value="e.value">{{ e.label }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });

    await step('O campo exibe o rótulo do valor escolhido', async () => {
      await waitFor(async () => {
        await expect(trigger).toHaveTextContent(/Rio de Janeiro/);
      });
      await expect(trigger).not.toHaveTextContent(/Selecione/);
    });

    await step('Ao abrir, a opção escolhida é a que nasce marcada', async () => {
      // Idempotente: o clique só acontece com a lista fechada.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      const listbox = await waitForPortal('listbox', { timeout: 2000 });
      const escolhida = within(listbox).getByRole('option', { name: /Rio de Janeiro/i });
      await expect(escolhida).toHaveAttribute('aria-selected', 'true');
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(within(document.body).queryAllByRole('listbox')).toHaveLength(0);
      });
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ['visual.item3'],
    // A story TERMINA aberta — é o estado que ela documenta e o que a
    // regressão visual precisa fotografar. Com a lista aberta o primitivo
    // marca o resto da página como escondido para o leitor de tela, e o axe lê
    // a combinação como armadilha de foco: ver o motivo em `wait-for-portal`.
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
    docs: {
      description: {
        story: 'Lista aberta, em portal. As setas andam item a item e o destaque acompanha.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() { return { estados: ESTADOS }; },
    template: `
      <div style="contain: layout; min-height: 280px;">
        <Select>
          <SelectTrigger aria-label="Selecionar estado" style="width: 14rem">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="e in estados" :key="e.value" :value="e.value">{{ e.label }}</SelectItem>
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

    await step('O campo e a lista concordam sobre estar aberta', async () => {
      const listbox = await abrir();
      await expect(listbox).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(within(listbox).getAllByRole('option')).toHaveLength(ESTADOS.length);
    });

    await step('A seta para baixo anda um item por vez, e a de cima volta', async () => {
      // O índice de partida vem MEDIDO, não suposto: umas libs já nascem com o
      // primeiro item destacado, outras só destacam quando o teclado entra. O
      // que o item do contrato promete é o passo de um, e é ele que se afirma.
      const listbox = await abrir();
      const destacada = () =>
        within(listbox)
          .getAllByRole('option')
          .findIndex((o) => o.hasAttribute('data-highlighted'));
      const ultimo = within(listbox).getAllByRole('option').length - 1;

      const partida = destacada();
      await userEvent.keyboard('{ArrowDown}');
      const primeiro = Math.min(partida + 1, ultimo);
      await waitFor(async () => {
        await expect(destacada()).toBe(primeiro);
      });

      await userEvent.keyboard('{ArrowDown}');
      const segundo = Math.min(primeiro + 1, ultimo);
      await waitFor(async () => {
        await expect(destacada()).toBe(segundo);
      });

      await userEvent.keyboard('{ArrowUp}');
      await waitFor(async () => {
        await expect(destacada()).toBe(segundo - 1);
      });
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: { story: 'Campo bloqueado: não abre, não responde ao clique e sai do percurso do Tab.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() { return { estados: ESTADOS }; },
    template: `
      <div style="contain: layout">
        <Select disabled>
          <SelectTrigger aria-label="Selecionar estado" style="width: 14rem" disabled>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="e in estados" :key="e.value" :value="e.value">{{ e.label }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });

    await step('O campo se anuncia bloqueado', async () => {
      // `disabled` nativo, e não só `aria-disabled`: é o atributo que tira o
      // botão do percurso do Tab e cancela o clique no próprio navegador.
      await expect(trigger).toBeDisabled();
    });

    await step('Clicar não abre a lista', async () => {
      await userEvent.click(trigger, { pointerEventsCheck: 0 });
      await expect(within(document.body).queryAllByRole('listbox')).toHaveLength(0);
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

export const Invalid: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: {
      description: {
        story:
          'Campo reprovado pela validação. A borda de perigo acompanha `aria-invalid` — a cor não é o aviso, é o reforço dele.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() { return { estados: ESTADOS }; },
    template: `
      <div class="nds-stack" data-spacing="sm" style="contain: layout">
        <Select>
          <SelectTrigger aria-label="Selecionar estado" aria-invalid="true" style="width: 14rem">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="e in estados" :key="e.value" :value="e.value">{{ e.label }}</SelectItem>
          </SelectContent>
        </Select>
        <p class="nds-text-body nds-text-destructive">Selecione um estado para continuar.</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });

    await step('O campo inválido se anuncia como tal', async () => {
      await expect(trigger).toHaveAttribute('aria-invalid', 'true');
      await expect(canvas.getByText(/Selecione um estado para continuar/)).toBeVisible();
    });

    await step('O anel de erro vem da folha compartilhada', async () => {
      // A story NÃO pinta nada: se a regra `[aria-invalid="true"]` sumir do CSS
      // compartilhado, isto reprova.
      await expect(getComputedStyle(trigger).boxShadow).not.toBe('none');
    });

    await step('Focar o campo inválido continua mostrando o foco', async () => {
      // O anel destrutivo é PERMANENTE e era declarado depois do
      // `:focus-visible` com a mesma especificidade: sem a regra de
      // aninhamento, focar um campo inválido não mudava nada na tela.
      // `boxShadow !== 'none'` passaria mesmo assim — só a MUDANÇA reprova.
      await expect(medirAnelDeFoco(trigger).mudou).toBe(true);
    });
  },
};

export const Sm: Story = {
  parameters: {
    docs: {
      description: { story: 'Densidade compacta para formulários densos: a altura menor vem do padding, não de um valor cravado.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() { return { estados: ESTADOS }; },
    template: `
      <div class="nds-stack" data-spacing="sm" style="contain: layout">
        <Select>
          <SelectTrigger aria-label="Selecionar estado" style="width: 14rem">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="e in estados" :key="e.value" :value="e.value">{{ e.label }}</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger aria-label="Selecionar cidade" size="sm" style="width: 14rem">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="campinas">Campinas</SelectItem>
          </SelectContent>
        </Select>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const padrao = canvas.getByRole('combobox', { name: /Selecionar estado/i });
    const compacto = canvas.getByRole('combobox', { name: /Selecionar cidade/i });

    await step('O campo compacto se declara pelo atributo de densidade', async () => {
      await expect(padrao).toHaveAttribute('data-size', 'default');
      await expect(compacto).toHaveAttribute('data-size', 'sm');
    });

    await step('A diferença de altura nasce do padding, não de altura cravada', async () => {
      // Altura cravada não cresce quando a pessoa aumenta a fonte do navegador
      // (WCAG 1.4.4). Comparar os dois tamanhos prova de onde a altura vem: o
      // padding encolhe, e a altura acompanha.
      const a = getComputedStyle(padrao);
      const b = getComputedStyle(compacto);
      await expect(Number.parseFloat(b.paddingBlockStart)).toBeLessThan(
        Number.parseFloat(a.paddingBlockStart),
      );
      await expect(compacto.getBoundingClientRect().height).toBeLessThan(
        padrao.getBoundingClientRect().height,
      );
    });
  },
};
