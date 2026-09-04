import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { createSwitch } from './switch';
import { switchSource, switchSourceWith, switchSourcePanel } from './switch.source';

const meta: Meta = {
  tags: ['form'],
  title: 'Components/Form/Switch/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: switchSource },
      description: {
        component:
          'Variantes de uso do Switch: Default (Label à direita), WithDescription (painel com o texto à esquerda) e Sm (degrau compacto). O degrau vem da opção `size`, que a factory traduz em `data-size` — é o CSS compartilhado que guarda a medida.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers locais ───────────────────────────────────────────────────────────
//
// Sem listener próprio no rótulo: `<button>` é elemento rotulável, então o
// `<label for>` já encaminha a ativação.

function switchRow(opts: {
  id: string;
  labelText: string;
  checked?: boolean;
  size?: 'default' | 'sm';
  labelClass?: string;
}): HTMLElement {
  const row = document.createElement('div');
  row.className = 'nds-cluster';
  row.dataset.spacing = 'sm';
  const sw = createSwitch({ id: opts.id, checked: opts.checked ?? false, size: opts.size });
  const label = document.createElement('label');
  label.htmlFor = opts.id;
  label.textContent = opts.labelText;
  label.className =
    (opts.labelClass ?? 'nds-text-body') + ' nds-font-medium nds-leading-none nds-cursor-pointer';
  row.append(sw, label);
  return row;
}

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => switchRow({
    id: 'v-default-switch',
    labelText: 'Receber notificações',
    checked: false,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Switch padrão — trilho de 36×20px com thumb de 16px, Label à direita. Use para configurações simples sem texto auxiliar.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('O degrau padrão vira data-size', async () => {
      await expect(sw).toHaveAttribute('data-size', 'default');
    });

    await step('O rótulo nomeia o controle', async () => {
      await expect(canvas.getByRole('switch', { name: /Receber notificações/i }))
        .toBe(sw);
    });
  },
};

// ─── WithDescription ──────────────────────────────────────────────────────────

export const WithDescription: Story = {
  render: () => {
    const panel = document.createElement('div');
    panel.className = 'nds-cluster nds-w-sm nds-rounded-lg nds-border-default nds-p-4';
    panel.dataset.align = 'center';
    panel.dataset.justify = 'between';

    const id = 'v-with-desc-switch';
    const sw = createSwitch({ id, checked: false });

    const textGroup = document.createElement('div');
    textGroup.className = 'nds-stack nds-pr-4';
    textGroup.dataset.spacing = 'xs';

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = 'Emails de marketing';
    label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';

    const desc = document.createElement('p');
    desc.className = 'nds-text-body';
    desc.textContent = 'Receba novidades e promoções da plataforma.';

    textGroup.append(label, desc);
    panel.append(textGroup, sw);
    return panel;
  },
  parameters: {
    docs: {
      // Composição estruturalmente diferente: o painel põe rótulo e descrição de
      // um lado e o controle do outro, e é isso que a story mostra.
      source: {
        transform: switchSourcePanel([
          {
            id: 'emails-marketing',
            label: 'Emails de marketing',
            description: 'Receba novidades e promoções da plataforma.',
          },
        ]),
      },
      description: {
        story:
          'Switch em painel — Label e descrição auxiliar à esquerda, controle à direita. Padrão para listas de configurações (notificações, privacidade, preferências).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('O controle e a descrição auxiliar estão visíveis', async () => {
      await expect(sw).toBeInTheDocument();
      await expect(canvas.getByText(/novidades e promoções/)).toBeVisible();
    });

    await step('Só o rótulo nomeia o controle — a descrição não entra no nome', async () => {
      await expect(canvas.getByRole('switch', { name: /Emails de marketing/i })).toBe(sw);
    });
  },
};

// ─── Sm ───────────────────────────────────────────────────────────────────────

export const Sm: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';
    wrapper.append(
      switchRow({ id: 'v-sm-referencia', labelText: 'Tamanho padrão' }),
      switchRow({
        id: 'v-sm-switch',
        labelText: 'Tamanho compacto',
        size: 'sm',
        labelClass: 'nds-text-caption',
      }),
    );
    return wrapper;
  },
  parameters: {
    covers: ['visual.item4'],
    docs: {
      // O assunto é o degrau: sem o override o snippet mostraria o padrão, que é
      // justamente o que a story usa só como referência de comparação.
      source: { transform: switchSourceWith({ size: 'sm', label: 'Tamanho compacto', id: 'tamanho-compacto' }) },
      description: {
        story:
          'Degrau compacto — trilho de 24×16px com thumb de 12px, ao lado do padrão para comparação. Indicado para listas densas e menus.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const [padrao, compacto] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="switch"]'),
    );

    await step('O degrau de tamanho vira data-size', async () => {
      await expect(padrao).toHaveAttribute('data-size', 'default');
      await expect(compacto).toHaveAttribute('data-size', 'sm');
    });

    await step('O compacto é de fato menor que o padrão', async () => {
      // O atributo sozinho não prova nada: a medida vive no CSS compartilhado,
      // e uma regra ausente deixaria os dois do mesmo tamanho com o data-size
      // certo em ambos. Foi exatamente o que a versão anterior desta story
      // escondia, replicando o degrau com classes mortas (`h-4 w-7`).
      await expect(compacto.getBoundingClientRect().width).toBeLessThan(
        padrao.getBoundingClientRect().width,
      );
    });

    await step('O thumb acompanha o degrau do trilho', async () => {
      const thumbDefault = padrao.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;
      const thumbCompacto = compacto.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;
      await expect(thumbCompacto.getBoundingClientRect().width).toBeLessThan(
        thumbDefault.getBoundingClientRect().width,
      );
    });
  },
};
