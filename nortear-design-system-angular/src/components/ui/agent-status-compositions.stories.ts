import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { NdsAgentStatus } from './agent-status';
import { NdsComposer } from './composer';
import { agentStatusLabels, elapsedOf } from './agent-status.fixtures';
import { composerLabels } from './composer.fixtures';
import { agentStatusAboveFieldSource, agentStatusRunningSource } from './agent-status.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Onde a linha mora em relação ao campo de mensagem, e o que acontece quando
// alguém aperta a ação — que, do lado de cá, é só um aviso.

const meta: Meta = {
  title: 'Primitives/Conversational/AgentStatus/Compositions',
  tags: ['conversational'],
  decorators: [moduleMetadata({ imports: [NdsAgentStatus, NdsComposer] })],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: agentStatusAboveFieldSource },
      description: {
        component:
          'A linha é autônoma: ela fica ao lado do campo, e a peça não executa nada do que oferece.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onAction = fn();

export const AboveField: Story = {
  parameters: { covers: ['functional.item8', 'visual.item6'] },
  render: () => ({
    props: {
      elapsed: elapsedOf('running'),
      labels: agentStatusLabels(),
      fieldLabels: composerLabels(),
      onAction,
    },
    template: `
      <div class="nds-stack nds-max-w-lg" data-spacing="sm">
        <p
          ndsAgentStatus
          status="running"
          [elapsed]="elapsed"
          [labels]="labels"
          (action)="onAction($event)"
        ></p>
        <nds-composer [labels]="fieldLabels" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const line = canvasElement.querySelector<HTMLElement>('[data-slot="agent-status"]')!;
    const composer = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const field = composer.querySelector<HTMLElement>('.nds-composer-field')!;
    const input = composer.querySelector<HTMLElement>('[data-slot="composer-input"]')!;

    await step('A linha fica FORA da moldura do campo', async () => {
      // O campo desenha o que se escreve agora; esta linha fala do que já foi
      // pedido. Dentro da moldura, ela pareceria parte da mensagem.
      await expect(field.contains(line)).toBe(false);
      await expect(composer.contains(line)).toBe(false);
    });

    await step('E ela vem ANTES do campo na ordem de leitura', async () => {
      await expect(
        line.compareDocumentPosition(composer) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    await step('Nada no campo sabe que ela existe', async () => {
      // A peça é autônoma: ela não é entrada do campo, e não entra na descrição
      // dele. Um estado que se reescreve sozinho dentro do `aria-describedby`
      // seria relido a cada foco.
      const ids = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      const describers = ids.map((id) => canvasElement.ownerDocument.getElementById(id));
      await expect(describers).not.toContain(line);
      for (const el of describers) {
        await expect(el?.contains(line)).toBe(false);
      }
    });
  },
};

export const Requesting: Story = {
  parameters: {
    covers: ['functional.item7', 'accessibility.item6'],
    docs: { source: { transform: agentStatusRunningSource } },
  },
  render: () => ({
    props: {
      elapsed: elapsedOf('running'),
      labels: agentStatusLabels(),
      onAction,
    },
    template: `
      <p
        ndsAgentStatus
        status="running"
        [elapsed]="elapsed"
        [labels]="labels"
        (action)="onAction($event)"
      ></p>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const line = canvasElement.querySelector<HTMLElement>('[data-slot="agent-status"]')!;
    // Pela CLASSE: o `ndsButton` liga `data-slot="button"` por host binding e
    // disputa com o estático do template (§8 do RULES.md). E é justamente a
    // classe que carrega o alvo de toque medido logo abaixo.
    const button = line.querySelector<HTMLButtonElement>('.nds-agent-status-action')!;
    const labels = agentStatusLabels();

    await step('O alvo de toque tem pelo menos vinte e quatro pixels', async () => {
      // WCAG 2.5.8. Uma ação encostada no fim de uma linha estreita é onde a
      // tentação de encolher é maior.
      const box = button.getBoundingClientRect();
      await expect(box.width).toBeGreaterThanOrEqual(24);
      await expect(box.height).toBeGreaterThanOrEqual(24);
    });

    await step('Acionar avisa quem consome, com a intenção junto', async () => {
      onAction.mockClear();
      await userEvent.click(button);
      await expect(onAction).toHaveBeenCalledTimes(1);
      await expect(onAction).toHaveBeenCalledWith('stop');
    });

    await step('E a linha continua como estava — a peça não executa nada', async () => {
      // Parar de verdade é de quem consome, e é ele quem devolve o estado novo.
      // Uma linha que se parasse sozinha estaria adivinhando o que ainda não
      // aconteceu.
      await expect(line.dataset.status).toBe('running');
      const label = line.querySelector<HTMLElement>('[data-slot="agent-status-label"]')!;
      await expect(label.textContent).toBe(labels.status.running);
      await expect(button).toHaveAccessibleName(labels.action!.running!);
    });
  },
};
