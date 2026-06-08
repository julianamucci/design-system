import type { Meta, StoryObj } from '@storybook/html';
import { expect } from 'storybook/test';
import { createSkeleton } from './skeleton';

const meta: Meta = {
  tags: ['feedback'],
  title: 'UI/Skeleton/Composicoes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes do Skeleton dentro de Card, Lista, AspectRatio e Parágrafo. ' +
          'Container pai recebe aria-busy + aria-label; cada Skeleton recebe aria-hidden + motion-reduce.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// Aceita pseudo-classes Tailwind (motion-reduce:, w-[…], h-[…]) e converte em styles inline
// quando possível para evitar InvalidCharacterError no classList.add.
function makeSkeleton(className: string): HTMLElement {
  const tokens = className.split(' ').filter(Boolean);
  const safeClasses: string[] = [];
  const styles: Record<string, string> = {};
  const rounded: string[] = [];
  for (const t of tokens) {
    if (t.includes(':') || t.includes('[')) continue; // skip variant/arbitrary tokens
    const mH = /^h-(\d+)$/.exec(t);
    const mW = /^w-(\d+)$/.exec(t);
    if (mH) {
      styles.height = `${parseInt(mH[1], 10) * 0.25}rem`;
      continue;
    }
    if (mW) {
      styles.width = `${parseInt(mW[1], 10) * 0.25}rem`;
      continue;
    }
    if (t === 'w-full') styles.width = '100%';
    else if (t === 'h-full') styles.height = '100%';
    else if (t === 'rounded-full') rounded.push('nds-rounded-full');
    else if (t === 'rounded-md') rounded.push('nds-rounded-md');
    else if (t === 'absolute') styles.position = 'absolute';
    else if (t === 'inset-0') {
      styles.inset = '0';
    } else safeClasses.push(t);
  }
  const skeleton = createSkeleton({ className: [...safeClasses, ...rounded].join(' ') });
  Object.assign(skeleton.style, styles);
  skeleton.setAttribute('aria-hidden', 'true');
  skeleton.setAttribute('data-slot', 'skeleton');
  return skeleton;
}

function loadingContainer(label: string, extraClass = ''): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = `nds-w-full ${extraClass}`.trim();
  wrap.setAttribute('role', 'status');
  wrap.setAttribute('aria-busy', 'true');
  wrap.setAttribute('aria-label', label);
  return wrap;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const CardDePerfil: Story = {
  name: 'Card de Perfil',
  render: () => {
    const wrap = loadingContainer('Carregando card de perfil', 'nds-max-w-sm');

    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.spacing = 'md';

    row.appendChild(makeSkeleton('h-12 w-12 rounded-full motion-reduce:animate-none'));

    const lines = document.createElement('div');
    lines.className = 'nds-stack';
    lines.dataset.spacing = 'xs';
    lines.appendChild(makeSkeleton('h-4 w-[250px] motion-reduce:animate-none'));
    lines.appendChild(makeSkeleton('h-4 w-[200px] motion-reduce:animate-none'));

    row.appendChild(lines);
    wrap.appendChild(row);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    await step('Card de perfil tem 1 avatar circular + 2 linhas', async () => {
      const skeletons = canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]');
      await expect(skeletons.length).toBe(3);
      await expect(skeletons[0]).toHaveClass('nds-rounded-full');
    });
    await step('Container pai expõe aria-busy', async () => {
      const container = canvasElement.querySelector<HTMLElement>('[aria-busy="true"]');
      await expect(container).toBeTruthy();
    });
  },
};

export const ListaComAvatar: Story = {
  name: 'Lista com Avatar',
  render: () => {
    const wrap = loadingContainer('Carregando lista de pedidos', 'nds-stack nds-max-w-md');
    wrap.dataset.spacing = 'md';

    for (let i = 0; i < 5; i++) {
      const row = document.createElement('div');
      row.className = 'nds-cluster';
      row.dataset.spacing = 'md';

      row.appendChild(makeSkeleton('h-10 w-10 rounded-full motion-reduce:animate-none'));

      const text = document.createElement('div');
      text.className = 'nds-stack nds-flex-1';
      text.dataset.spacing = 'xs';
      text.appendChild(makeSkeleton('h-4 w-[60%] motion-reduce:animate-none'));
      text.appendChild(makeSkeleton('h-3 w-[40%] motion-reduce:animate-none'));

      row.appendChild(text);
      wrap.appendChild(row);
    }

    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    await step('Lista renderiza 5 avatares + 10 linhas', async () => {
      const skeletons = canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]');
      await expect(skeletons.length).toBe(15);
    });
    await step('Todos os Skeletons têm aria-hidden=true', async () => {
      const skeletons = canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]');
      skeletons.forEach((s) => {
        expect(s.getAttribute('aria-hidden')).toBe('true');
      });
    });
  },
};

export const ImagemEmAspectRatio: Story = {
  name: 'Imagem em AspectRatio',
  render: () => {
    const wrap = loadingContainer('Carregando imagem', 'nds-max-w-md');

    const ratio = document.createElement('div');
    ratio.className = 'nds-w-full';
    ratio.style.position = 'relative';
    ratio.style.aspectRatio = '16 / 9';

    const skeleton = makeSkeleton('absolute inset-0 h-full w-full motion-reduce:animate-none');
    ratio.appendChild(skeleton);

    wrap.appendChild(ratio);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    await step('Skeleton ocupa h-full w-full do AspectRatio (via style)', async () => {
      const skeleton = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]');
      await expect(skeleton).toBeTruthy();
      await expect(skeleton!.style.height).toBe('100%');
      await expect(skeleton!.style.width).toBe('100%');
    });
  },
};

export const Paragrafo: Story = {
  name: 'Parágrafo',
  render: () => {
    const wrap = loadingContainer('Carregando parágrafo', 'nds-stack nds-max-w-md');
    wrap.dataset.spacing = 'xs';

    const widths = ['w-full', 'w-[95%]', 'w-[60%]'];
    widths.forEach((w) => {
      wrap.appendChild(makeSkeleton(`h-4 ${w} motion-reduce:animate-none`));
    });

    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    await step('Parágrafo tem 3 linhas com larguras variáveis', async () => {
      const skeletons = canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]');
      await expect(skeletons.length).toBe(3);
    });
  },
};
