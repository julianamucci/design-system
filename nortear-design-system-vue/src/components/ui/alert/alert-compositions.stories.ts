import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { Alert, AlertAction, AlertTitle, AlertDescription } from './index';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-vue-next';
import { measureActionDismiss } from '@shared/testing/alert-probe';
import {
  alertAdditionalClassSource,
  alertWithActionAndDismissSource,
  alertWithActionSource,
  alertWithIconSource,
  alertLayoutNoIconSource,
} from './alert.source';

const meta = {
  title: 'Components/Feedback/Alert/Compositions',
  component: Alert,
  tags: ['feedback'],
  parameters: {
    design: figmaDesign('alert'),
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: alertWithIconSource } },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIcon: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item2'],
    // Própria, e não herdada do meta: o texto desta composição é o assunto, e
    // painel herdado acerta por coincidência.
    docs: { source: { transform: alertWithIconSource } },
  },
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, Info },
    setup() { return {}; },
    template: `
      <Alert>
        <Info aria-hidden="true" />
        <AlertTitle as="h4">Informação</AlertTitle>
        <AlertDescription>Ícone SVG posicionado automaticamente.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');

    await step('O ícone é filho DIRETO e decorativo', async () => {
      // `functional.item3` é literalmente "renderizar com ícone filho direto",
      // e é `.nds-alert > svg` que abre a coluna do ícone. `querySelector('svg')`
      // casava qualquer descendente — o X do botão de fechar passaria por ícone
      // da composição, e a story declarava o critério sem poder reprová-lo.
      const icon = alert.querySelector<SVGSVGElement>(':scope > svg');
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(icon?.parentElement).toBe(alert);
    });

    await step('O título da composição é visível', async () => {
      await expect(canvas.getByText('Informação')).toBeVisible();
    });
  },
};

export const WithAction: Story = {
  parameters: {
    // Entra um subcomponente e um botão dentro dele: sub-composição que a do
    // meta esconderia.
    docs: { source: { transform: alertWithActionSource } },
  },
  render: () => ({
    components: { Alert, AlertAction, AlertTitle, AlertDescription, Button, Info },
    setup() { return {}; },
    template: `
      <Alert>
        <Info aria-hidden="true" />
        <AlertTitle as="h4">Atualização disponível</AlertTitle>
        <AlertDescription>Uma nova versão está pronta para instalação.</AlertDescription>
        <AlertAction>
          <Button size="sm" variant="default">Atualizar</Button>
        </AlertAction>
      </Alert>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A ação fica acessível como botão dentro do alert', async () => {
      const alert = canvas.getByRole('alert');
      await expect(within(alert).getByRole('button', { name: 'Atualizar' })).toBeVisible();
    });

    await step('O slot de ação usa a classe do componente', async () => {
      const action = canvasElement.querySelector('[data-slot="alert-action"]');
      await expect(action).toHaveClass('nds-alert-action');
    });

    // `accessibility.keyboard` documenta Tab e Enter. O alert em si não é
    // focável — o Tab tem que chegar direto ao botão interno.
    await step('Tab leva o foco ao botão interno', async () => {
      const alert = canvas.getByRole('alert');
      await expect(alert).not.toHaveAttribute('tabindex');
      await userEvent.tab();
      await expect(within(alert).getByRole('button', { name: 'Atualizar' })).toHaveFocus();
    });
  },
};

/**
 * Extensibilidade documentada: todos os subcomponentes aceitam classe do
 * consumidor, e ela SOMA às do design system — não substitui.
 *
 * `nds-w-full` (block, já ocupa a largura) e `nds-w-auto` no slot de ação
 * (coluna `auto` do grid, já na largura do conteúdo) são inertes de propósito: a story prova
 * a composição de classes sem mexer no snapshot visual.
 */
export const AdditionalClass: Story = {
  parameters: {
    // O assunto é a classe em CADA subcomponente — sem elas escritas, o
    // exemplo não mostra nada.
    docs: { source: { transform: alertAdditionalClassSource } },
  },
  render: () => ({
    components: { Alert, AlertAction, AlertTitle, AlertDescription, Button, Info },
    setup() { return {}; },
    template: `
      <Alert class="nds-w-full">
        <Info aria-hidden="true" />
        <AlertTitle as="h4" class="nds-w-full">Classe adicional</AlertTitle>
        <AlertDescription class="nds-w-full">A classe do consumidor convive com as do design system.</AlertDescription>
        <AlertAction class="nds-w-auto">
          <Button size="sm" variant="default">Ação</Button>
        </AlertAction>
      </Alert>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A classe do consumidor soma à do design system', async () => {
      const alert = canvas.getByRole('alert');
      await expect(alert).toHaveClass('nds-alert', 'nds-w-full');

      const slots = [
        ['alert-title', 'nds-alert-title', 'nds-w-full'],
        ['alert-description', 'nds-alert-description', 'nds-w-full'],
        ['alert-action', 'nds-alert-action', 'nds-w-auto'],
      ] as const;
      for (const [slot, base, extra] of slots) {
        await expect(alert.querySelector(`[data-slot="${slot}"]`)).toHaveClass(base, extra);
      }
    });
  },
};

export const WithoutIcon: Story = {
  parameters: {
    covers: ['visual.item4'],
    // A ausência do ícone É o assunto: a do meta compõe justamente com ele.
    docs: { source: { transform: alertLayoutNoIconSource } },
  },
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription },
    setup() { return {}; },
    template: `
      <Alert>
        <AlertTitle as="h4">Sem ícone</AlertTitle>
        <AlertDescription>Alert sem ícone mantém layout de coluna única.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert.querySelector('svg')).toBeNull();
    await expect(canvas.getByText('Sem ícone')).toBeVisible();
  },
};

/**
 * Ação e botão de fechar no mesmo alerta.
 *
 * A ação é a terceira coluna do grid e o X segue absoluto na própria calha; a
 * prova de que nada se sobrepõe é de CAIXA, pela sonda compartilhada, e não de
 * classe.
 */
export const WithActionAndDismiss: Story = {
  parameters: {
    covers: ['functional.item8', 'visual.item6'],
    // A prop de fechar e o slot de ação juntos: nenhuma das duas existe na do
    // meta.
    docs: { source: { transform: alertWithActionAndDismissSource } },
  },
  render: () => ({
    components: { Alert, AlertAction, AlertTitle, AlertDescription, Button, Info },
    setup() { return {}; },
    template: `
      <Alert dismissible>
        <Info aria-hidden="true" />
        <AlertTitle as="h4">Sessão expira em 5 minutos</AlertTitle>
        <AlertDescription>Salve seu trabalho para não perder as alterações.</AlertDescription>
        <AlertAction>
          <Button size="sm" variant="default">Salvar agora</Button>
        </AlertAction>
      </Alert>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');

    // O alert fechável ENTRA animado; caixa medida no meio da entrada seria a
    // de um elemento em transformação. Espera só leitura, sem tocar o DOM.
    await waitFor(() => expect(alert).not.toHaveClass('nds-animate-in'));

    await step('A ação e o botão de fechar são alcançáveis por nome', async () => {
      await expect(within(alert).getByRole('button', { name: 'Salvar agora' })).toBeVisible();
      await expect(within(alert).getByRole('button', { name: 'Fechar alerta' })).toBeVisible();
      // O X continua o último filho: o leitor encontra conteúdo e ação antes.
      await expect(alert.lastElementChild).toHaveAttribute('data-slot', 'alert-dismiss');
    });

    await step('A ação não se sobrepõe ao X e o texto termina antes dela', async () => {
      const layout = measureActionDismiss(alert);
      await expect(layout.overlap).toBe(false);
      await expect(layout.gap).toBeGreaterThanOrEqual(0);
      await expect(layout.textClearsAction).toBe(true);
    });
  },
};
