import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, waitFor, within, expect, fn } from 'storybook/test';
import { createSwitch, type SwitchSize } from './switch';
import { createSwitchDocs } from '@/components/docs/SwitchDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

/**
 * Leva o switch ao estado desejado, clicando SÓ quando ele ainda não está lá.
 *
 * O painel Interactions reexecuta a play no MESMO DOM, sem remontar. Um clique
 * cego alterna a partir do que a rodada anterior deixou e inverte o resultado —
 * a suíte fica verde (o vitest remonta a cada teste) e o painel falha.
 */
async function definir(sw: HTMLElement, ligado: boolean, alvo: HTMLElement = sw): Promise<void> {
  if ((sw.getAttribute('aria-checked') === 'true') !== ligado) await userEvent.click(alvo);
  await waitFor(() => expect(sw).toHaveAttribute('aria-checked', String(ligado)));
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

type SwitchArgs = {
  checked: boolean;
  disabled: boolean;
  size: SwitchSize;
  label: string;
  'aria-label': string;
  onCheckedChange: (checked: boolean) => void;
};

const meta: Meta<SwitchArgs> = {
  title: 'UI/Switch',
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(createSwitchDocs) },
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Estado inicial. A factory é não-controlada: o valor só é lido na montagem.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o Switch.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    size: {
      control: 'inline-radio',
      options: ['default', 'sm'],
      description: 'Degrau de tamanho — vira data-size, onde o CSS guarda a medida.',
      table: { type: { summary: "'default' | 'sm'" }, defaultValue: { summary: "'default'" } },
    },
    label: {
      control: 'text',
      description:
        'Texto do Label associado via `htmlFor` ao `id` do Switch. Descreve o estado ATIVO da função.',
      table: { type: { summary: 'string' } },
    },
    'aria-label': {
      control: 'text',
      description: 'aria-label quando não há Label visível associado.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    onCheckedChange: {
      control: false,
      description: 'Callback disparado ao alternar.',
      table: { type: { summary: '(checked: boolean) => void' } },
    },
  },
  args: {
    checked: false,
    disabled: false,
    size: 'default',
    label: 'Receber notificações por email',
    'aria-label': '',
    onCheckedChange: fn(),
  },
};

export default meta;
type Story = StoryObj<SwitchArgs>;

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildSwitchWithLabel(args: SwitchArgs): HTMLElement {
  const row = document.createElement('div');
  row.className = 'nds-cluster';
  row.dataset.spacing = 'sm';

  const id = 'switch-playground';
  const sw = createSwitch({
    id,
    checked: args.checked,
    disabled: args.disabled,
    size: args.size,
    onCheckedChange: args.onCheckedChange,
    ...(args['aria-label'] ? { 'aria-label': args['aria-label'] } : {}),
  });

  if (args.label) {
    // Sem listener próprio no rótulo: `<button>` é elemento rotulável, então o
    // `<label for>` já encaminha a ativação. O handler manual que morava aqui
    // testava a si mesmo em vez de testar a associação.
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = args.label;
    label.className =
      'nds-text-body nds-font-medium nds-leading-none ' +
      (args.disabled ? 'nds-cursor-default' : 'nds-cursor-pointer');
    row.append(sw, label);
  } else {
    row.append(sw);
  }

  return row;
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3',
      'accessibility.item1', 'accessibility.item4', 'accessibility.item5',
    ],
  },
  render: (args) => buildSwitchWithLabel(args),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');
    const espiao = args.onCheckedChange as unknown as ReturnType<typeof fn>;

    await step('O controle é anunciado como switch e nomeado pelo rótulo', async () => {
      await expect(sw).toHaveAttribute('data-slot', 'switch');
      await expect(sw).toHaveAttribute('role', 'switch');
      await expect(canvas.getByRole('switch', { name: /Receber notificações por email/i }))
        .toBe(sw);
    });

    await step('aria-checked acompanha o estado, em vez de ficar fixo', async () => {
      // Comparação com o estado imediatamente anterior, e não com um valor
      // absoluto: o replay parte de onde a rodada anterior parou.
      const antes = sw.getAttribute('aria-checked');
      await expect(antes).toMatch(/^(true|false)$/);
      await definir(sw, antes !== 'true');
      await definir(sw, antes === 'true');
    });

    await step('Clicar no controle alterna e dispara o callback de mudança', async () => {
      // A precondição fica FORA da contagem: `definir` só clica quando precisa,
      // então contar a partir de um estado desconhecido daria 1 ou 2 conforme a
      // rodada. Fixado o ponto de partida, o par abaixo são sempre dois cliques.
      await definir(sw, false);
      const chamadasAntes = espiao.mock.calls.length;
      await definir(sw, true);
      await definir(sw, false);
      await expect(espiao.mock.calls.length).toBe(chamadasAntes + 2);
      await expect(espiao).toHaveBeenLastCalledWith(false);
    });

    await step('Space com o controle focado alterna o estado', async () => {
      await definir(sw, false);
      (sw as HTMLElement).focus();
      await expect(sw).toHaveFocus();
      await userEvent.keyboard(' ');
      await waitFor(() => expect(sw).toHaveAttribute('aria-checked', 'true'));
    });

    await step('Clicar no rótulo alterna o controle associado', async () => {
      const rotulo = canvas.getByText('Receber notificações por email');
      await definir(sw, false, rotulo);
      await definir(sw, true, rotulo);
    });
  },
};
