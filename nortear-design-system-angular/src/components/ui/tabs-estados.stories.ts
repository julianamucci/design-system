import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NDS_TABS } from './tabs';

const meta: Meta = {
  title: 'UI/Tabs/Estados',
  tags: ['navigation'],
  decorators: [moduleMetadata({ imports: [...NDS_TABS] })],
  parameters: {
    layout: 'padded',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Teclado, foco e aba desabilitada. A navegação por setas, o percurso do Tab e o ' +
          'bloqueio da aba desabilitada vêm do primitivo — o que estas stories provam é que ' +
          'a composição não desfaz nada disso.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const TRES_ABAS = `
  <div ndsTabs class="nds-max-w-lg" defaultValue="overview">
    <div ndsTabsList aria-label="Seções do componente">
      <button ndsTabsTrigger value="overview">Visão geral</button>
      <button ndsTabsTrigger value="properties">Propriedades</button>
      <button ndsTabsTrigger value="examples">Exemplos</button>
    </div>
    <div ndsTabsContent value="overview" class="nds-text-body">Conteúdo da visão geral</div>
    <div ndsTabsContent value="properties" class="nds-text-body">Lista de propriedades</div>
    <div ndsTabsContent value="examples" class="nds-text-body">Exemplos de uso</div>
  </div>
`;

/**
 * Ativação automática — a seta já troca de aba.
 *
 * É o padrão do sistema, e é por isso que esta story existe: o primitivo do
 * Radix NG nasce com ativação MANUAL, e o modo automático é ligado por este
 * stack (ver o `effect` em `NdsTabsList`). Se essa ligação parar de valer, a
 * aba deixa de acompanhar a seta e nenhuma outra prova cai.
 */
export const Teclado: Story = {
  parameters: { covers: ['functional.item2', 'functional.item3', 'accessibility.item5'] },
  render: () => ({ template: TRES_ABAS }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const abas = canvas.getAllByRole('tab');

    await step('Só a aba ativa está no percurso do Tab', async () => {
      // Roving tabindex: as inativas saem do percurso para que Tab passe da
      // fileira inteira para o painel, e não aba por aba.
      await expect(abas[0].getAttribute('tabindex')).toBe('0');
      await expect(abas[1].getAttribute('tabindex')).toBe('-1');
      await expect(abas[2].getAttribute('tabindex')).toBe('-1');
    });

    await step('ArrowRight anda para a próxima aba e já a ativa', async () => {
      abas[0].focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(canvasElement.ownerDocument.activeElement).toBe(abas[1]);
      });
      await waitFor(async () => {
        await expect(abas[1].getAttribute('aria-selected')).toBe('true');
      });
      await expect(canvas.getByRole('tabpanel').textContent).toContain('Lista de propriedades');
    });

    await step('End vai à última e Home volta à primeira', async () => {
      // Idempotente: repetir a dupla End/Home termina sempre na primeira aba,
      // que é o estado com que a story começou.
      await userEvent.keyboard('{End}');
      await waitFor(async () => {
        await expect(abas[2].getAttribute('aria-selected')).toBe('true');
      });
      await userEvent.keyboard('{Home}');
      await waitFor(async () => {
        await expect(abas[0].getAttribute('aria-selected')).toBe('true');
      });
    });
  },
};

/**
 * Ativação manual — a seta move o foco e o conteúdo só troca no Enter/Space.
 *
 * Vale quando o painel custa caro (uma requisição por aba, por exemplo): passar
 * por três abas com a seta faria três buscas que ninguém pediu.
 */
export const ManualActivation: Story = {
  parameters: { covers: ['functional.item2'] },
  render: () => ({
    template: `
      <div ndsTabs class="nds-max-w-lg" defaultValue="overview">
        <div ndsTabsList activationMode="manual" aria-label="Seções do componente">
          <button ndsTabsTrigger value="overview">Visão geral</button>
          <button ndsTabsTrigger value="properties">Propriedades</button>
          <button ndsTabsTrigger value="examples">Exemplos</button>
        </div>
        <div ndsTabsContent value="overview" class="nds-text-body">Conteúdo da visão geral</div>
        <div ndsTabsContent value="properties" class="nds-text-body">Lista de propriedades</div>
        <div ndsTabsContent value="examples" class="nds-text-body">Exemplos de uso</div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const abas = canvas.getAllByRole('tab');

    await step('A seta move o foco sem trocar a aba', async () => {
      abas[0].focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(canvasElement.ownerDocument.activeElement).toBe(abas[1]);
      });
      await expect(abas[1].getAttribute('aria-selected')).toBe('false');
      await expect(canvas.getByRole('tabpanel').textContent).toContain('Conteúdo da visão geral');
    });

    await step('Enter confirma a aba focada', async () => {
      // Idempotente: com o foco já na segunda aba, repetir o Enter mantém a
      // mesma aba ativa.
      await userEvent.keyboard('{Enter}');
      await waitFor(async () => {
        await expect(abas[1].getAttribute('aria-selected')).toBe('true');
      });
      await expect(canvas.getByRole('tabpanel').textContent).toContain('Lista de propriedades');
    });
  },
};

/**
 * Aba desabilitada.
 *
 * O primitivo NÃO usa o atributo `disabled` nativo: o padrão WAI-ARIA manda a
 * seta poder pousar numa aba desabilitada para que ela seja anunciada, e um
 * `<button disabled>` sai do alcance do foco. O bloqueio do clique vem do
 * `pointer-events: none` que o CSS aplica em `[aria-disabled="true"]`.
 */
export const DisabledTab: Story = {
  parameters: { covers: ['visual.item4'] },
  render: () => ({
    template: `
      <div ndsTabs class="nds-max-w-lg" defaultValue="overview">
        <div ndsTabsList aria-label="Seções do componente">
          <button ndsTabsTrigger value="overview">Visão geral</button>
          <button ndsTabsTrigger value="properties" disabled>Propriedades</button>
          <button ndsTabsTrigger value="examples">Exemplos</button>
        </div>
        <div ndsTabsContent value="overview" class="nds-text-body">Conteúdo da visão geral</div>
        <div ndsTabsContent value="properties" class="nds-text-body">Lista de propriedades</div>
        <div ndsTabsContent value="examples" class="nds-text-body">Exemplos de uso</div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const desabilitada = canvas.getByRole('tab', { name: 'Propriedades' });

    await step('A aba se anuncia desabilitada', async () => {
      await expect(desabilitada.getAttribute('aria-disabled')).toBe('true');
      await expect(desabilitada.getAttribute('data-disabled')).toBe('');
    });

    await step('E fica visualmente apagada e fora do alcance do ponteiro', async () => {
      const estilo = getComputedStyle(desabilitada);
      await expect(Number(estilo.opacity)).toBeLessThan(1);
      await expect(estilo.pointerEvents).toBe('none');
    });

    await step('O clique não a ativa', async () => {
      // `pointerEventsCheck: 0` porque o alvo tem `pointer-events: none`: sem
      // isso o userEvent recusa o clique e o teste passaria sem exercitar nada.
      await userEvent.click(desabilitada, { pointerEventsCheck: 0 });
      await expect(desabilitada.getAttribute('aria-selected')).toBe('false');
      await expect(canvas.getByRole('tabpanel').textContent).toContain('Conteúdo da visão geral');
    });
  },
};

/**
 * Foco visível e o caminho do Tab até o conteúdo.
 */
export const Foco: Story = {
  parameters: { covers: ['functional.item4', 'accessibility.item3'] },
  render: () => ({ template: TRES_ABAS }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const abas = canvas.getAllByRole('tab');

    await step('A aba focada por teclado ganha anel visível', async () => {
      // O foco chega por Tab, não por `.focus()`: `:focus-visible` é estado de
      // foco por TECLADO, e o foco programático não o dispara — o anel ficaria
      // ausente e a asserção reprovaria um CSS que está certo.
      await userEvent.tab();
      await waitFor(async () => {
        await expect(canvasElement.ownerDocument.activeElement).toBe(abas[0]);
      });
      await expect(getComputedStyle(abas[0]).boxShadow).not.toBe('none');
    });

    await step('O Tab seguinte cai dentro do painel ativo', async () => {
      // É o que fecha o percurso: da fileira inteira para o conteúdo, sem
      // passar pelas abas inativas.
      const painel = canvas.getByRole('tabpanel');
      await expect(painel.getAttribute('tabindex')).toBe('0');
      await userEvent.tab();
      await waitFor(async () => {
        await expect(canvasElement.ownerDocument.activeElement).toBe(painel);
      });
    });
  },
};
