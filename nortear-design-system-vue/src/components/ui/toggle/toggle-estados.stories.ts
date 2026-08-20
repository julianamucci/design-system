import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
import {
  contrasteDoToggleNosDoisTemas,
  descreverFalhasDeContraste,
  medirAnelDeFoco,
} from '@shared/testing/toggle-probe';
import { Toggle } from './index';
import { Bold, Italic } from 'lucide-vue-next';
import {
  toggleAtivoSource,
  toggleDesabilitadoSource,
  toggleFocoSource,
  toggleIconeSource,
  toggleInvalidoSource,
} from './toggle.source';

const meta = {
  title: 'UI/Toggle/States',
  component: Toggle,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    // Sem argTypes neste arquivo: o painel Controls ficaria vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: toggleIconeSource },
      description: {
        component:
          'Estados do Toggle: off, on, foco por teclado, desabilitado e inválido (aria-invalid).',
      },
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  parameters: { covers: ['visual.item1'] },
  render: () => ({
    components: { Toggle, Bold },
    template: `
      <Toggle aria-label="Negrito">
        <Bold aria-hidden="true" />
      </Toggle>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Negrito' });

    await step('Estado inativo em aria-pressed e data-state', async () => {
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
      await expect(toggle).toHaveAttribute('data-state', 'off');
    });

    await step('Fundo transparente — o estado inativo não pinta nada', async () => {
      await expect(getComputedStyle(toggle).backgroundColor).toMatch(
        /rgba\(0, 0, 0, 0\)|transparent/,
      );
    });
  },
};

export const On: Story = {
  parameters: {
    covers: ['visual.item2', 'accessibility.item2'],
    // O estado de partida é prop escrita à mão, e só se lê contra o desligado
    // ao lado — o meta mostra apenas o desligado.
    docs: { source: { transform: toggleAtivoSource } },
  },
  render: () => ({
    components: { Toggle, Bold },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Toggle aria-label="Negrito inativo">
          <Bold aria-hidden="true" />
        </Toggle>
        <Toggle :default-value="true" aria-label="Negrito ativo">
          <Bold aria-hidden="true" />
        </Toggle>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const off = canvas.getByRole('button', { name: 'Negrito inativo' });
    const on = canvas.getByRole('button', { name: 'Negrito ativo' });

    await step('O estado inicial nasce refletido nos dois atributos', async () => {
      await expect(on).toHaveAttribute('aria-pressed', 'true');
      await expect(on).toHaveAttribute('data-state', 'on');
      await expect(off).toHaveAttribute('aria-pressed', 'false');
    });

    await step('O estado ativo tem fundo próprio, não só atributo', async () => {
      const fundoOn = getComputedStyle(on).backgroundColor;
      await expect(fundoOn).not.toBe(getComputedStyle(off).backgroundColor);
      await expect(fundoOn).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    });

    await step('O contraste do estado ATIVO passa de 4.5:1 nos DOIS temas', async () => {
      // Contraste é aritmética, não olhômetro: o axe não mede ícone (não é
      // texto) e só enxerga o tema claro. Sem esta conta o item de contraste do
      // contrato ficava declarado e nunca verificado. Mede só o estado ativo —
      // é o único par de cores que o componente define; em repouso ele herda
      // as da página.
      const falhas = contrasteDoToggleNosDoisTemas(canvasElement);
      await expect(falhas.length === 0 ? '' : `\n${descreverFalhasDeContraste(falhas)}`).toBe('');
    });
  },
};

export const FocusVisible: Story = {
  parameters: {
    covers: ['accessibility.item3'],
    // O anel precisa ser visto nas DUAS variantes: a com borda já tem sombra em
    // repouso, e é o par que mostra isso.
    docs: { source: { transform: toggleFocoSource } },
  },
  render: () => ({
    components: { Toggle, Bold, Italic },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Toggle aria-label="Negrito">
          <Bold aria-hidden="true" />
        </Toggle>
        <Toggle variant="outline" aria-label="Itálico">
          <Italic aria-hidden="true" />
        </Toggle>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const padrao = canvas.getByRole('button', { name: 'Negrito' });
    const contorno = canvas.getByRole('button', { name: 'Itálico' });

    await step('Tab leva o foco ao toggle, na ordem natural do DOM', async () => {
      // userEvent.tab() e não .focus(): o documentado é "recebe foco na ordem
      // natural". Forçar o foco passaria até com tabindex="-1".
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(padrao).toHaveFocus();
    });

    await step('O anel de foco aparece nas DUAS variantes', async () => {
      // Medir `boxShadow !== 'none'` era o que escondia o defeito: a variante
      // outline tem sombra de elevação o tempo todo, e a asserção passava com
      // zero anel. O que prova o anel é a sombra MUDAR ao focar.
      for (const btn of [padrao, contorno]) {
        await expect(medirAnelDeFoco(btn).mudou).toBe(true);
      }
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ['visual.item4', 'functional.item4'],
    // Desabilitado ligado e desligado desenham diferente: os dois entram.
    docs: { source: { transform: toggleDesabilitadoSource } },
  },
  render: () => ({
    components: { Toggle, Bold, Italic },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Toggle :disabled="true" aria-label="Negrito">
          <Bold aria-hidden="true" />
        </Toggle>
        <Toggle :disabled="true" :default-value="true" aria-label="Itálico ativo e desabilitado">
          <Italic aria-hidden="true" />
        </Toggle>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const off = canvas.getByRole('button', { name: 'Negrito' });
    const on = canvas.getByRole('button', { name: 'Itálico ativo e desabilitado' });

    await step('É o disabled NATIVO, não um aria-disabled', async () => {
      // `disabled` nativo é a forma forte: além de anunciar o estado, tira o
      // elemento da ordem de tabulação. Um `aria-disabled` sozinho anunciaria
      // e deixaria o foco entrar.
      await expect(off).toBeDisabled();
      await expect(on).toBeDisabled();
      await expect(on).toHaveAttribute('data-state', 'on');
    });

    await step('O clique não altera o estado', async () => {
      // Elemento desabilitado não muda de estado em rodada nenhuma — este é o
      // caso em que o clique cego é idempotente por natureza.
      const antes = off.getAttribute('aria-pressed');
      await userEvent.click(off, { pointerEventsCheck: 0 });
      await expect(off.getAttribute('aria-pressed')).toBe(antes);
    });

    await step('O teclado também não alcança o controle', async () => {
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(off).not.toHaveFocus();
    });
  },
};

export const Invalid: Story = {
  parameters: {
    docs: {
      // O erro traz a mensagem e o vínculo que a alcança: uma composição
      // inteira, não um atributo a mais no botão.
      source: { transform: toggleInvalidoSource },
    },
  },
  render: () => ({
    components: { Toggle, Bold },
    template: `
      <div class="nds-stack" data-spacing="xs">
        <Toggle aria-label="Negrito" aria-invalid="true" aria-describedby="toggle-invalid-err">
          <Bold aria-hidden="true" />
        </Toggle>
        <p id="toggle-invalid-err" class="nds-text-body nds-text-destructive">
          Selecione ao menos uma formatação.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Negrito' });

    await step('O erro é anunciado pelo par aria-invalid + aria-describedby', async () => {
      await expect(toggle).toHaveAttribute('aria-invalid', 'true');
      await expect(toggle).toHaveAttribute('aria-describedby', 'toggle-invalid-err');
      await expect(canvas.getByText('Selecione ao menos uma formatação.')).toBeVisible();
    });

    await step('O anel destrutivo vem do CSS do componente, não da story', async () => {
      // A story NÃO pinta nada: se a regra `[aria-invalid="true"]` sumir da
      // folha compartilhada, isto reprova.
      await expect(getComputedStyle(toggle).boxShadow).not.toBe('none');
    });

    await step('Focar o inválido continua mostrando o foco', async () => {
      await expect(medirAnelDeFoco(toggle).mudou).toBe(true);
    });
  },
};
