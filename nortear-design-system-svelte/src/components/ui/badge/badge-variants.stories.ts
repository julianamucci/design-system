import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { backgroundEffective, noTransicao, ratio, resolveColor } from '@shared/testing/cor';
import { Badge } from './index';
import BadgeStory from './BadgeStory.svelte';
import BadgeSemanticasStory from './BadgeSemanticasStory.svelte';
import {
  badgeDestructiveSource,
  badgeOutlineSource,
  badgeSecundarioSource,
  badgeSemanticasSource,
  badgeSource,
} from './badge.source';

const meta: Meta = {
  title: 'UI/Badge/Variants',
  component: Badge,
  tags: ['feedback'],
  parameters: {
    design: figmaDesign('badge'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // Cascateia para todas as stories do arquivo; cada variante sobrescreve
      // com o próprio par de variante e rótulo logo abaixo.
      source: { transform: badgeSource },
      description: {
        component:
          'Cada variante do Badge reflete um nível de hierarquia visual: default destaca, secondary informa, destructive alerta e outline oferece baixa ênfase.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * O que a variante promete é o desenho, e desenho se mede.
 *
 * Depois do redesenho, quem carrega a variante é a BORDA: fundo e texto são
 * neutros e IGUAIS nas sete. Medir preenchimento deixou de distinguir qualquer
 * coisa — as asserções antigas de `backgroundColor` diferente entre variantes
 * passariam com as sete idênticas, que é exatamente o defeito que elas existiam
 * para pegar.
 */
const paint = (el: HTMLElement) => {
  const s = getComputedStyle(el);
  return {
    background: s.backgroundColor,
    text: s.color,
    border: s.borderTopColor,
    borderWidth: s.borderTopWidth,
  };
};

const isTransparent = (color: string) => color === 'rgba(0, 0, 0, 0)' || color === 'transparent';

/**
 * Pintura de outra variante, medida VIVA e descartada em seguida.
 *
 * Comparar contra uma referência viva, e não contra `rgb()` cravado, é o que
 * deixa a troca de tema passar e a troca da REGRA reprovar.
 */
const referencePaint = (root: HTMLElement, variantClass: string) => {
  const probe = root.ownerDocument.createElement('span');
  probe.className = `nds-badge ${variantClass}`;
  probe.setAttribute('aria-hidden', 'true');
  root.appendChild(probe);
  try {
    return paint(probe);
  } finally {
    probe.remove();
  }
};

/** Contraste da borda contra o fundo da própria etiqueta. */
const borderContrast = (badge: HTMLElement) =>
  noTransicao(badge, () => {
    const background = backgroundEffective(badge);
    return background ? ratio(getComputedStyle(badge).borderTopColor, background) : null;
  });

/**
 * O piso da borda é 3:1 (WCAG 1.4.11): ela é o contorno que identifica a
 * variante, e é a ÚNICA coisa que a identifica desde o redesenho. Vale para as
 * cores semânticas e para o cinza legível da secundária; a `outline` fica de
 * fora de propósito, e o porquê está na story dela.
 */
const BORDER_FLOOR = 3;

/** O texto é neutro em todas, então 4.5:1 não depende mais da variante. */
const textContrast = (badge: HTMLElement) =>
  noTransicao(badge, () => {
    const background = backgroundEffective(badge);
    return background ? ratio(getComputedStyle(badge).color, background) : null;
  });

export const Default: Story = {
  parameters: { covers: ['functional.item1', 'visual.item2'] },
  render: () => ({ Component: BadgeStory, props: { variant: 'default', label: 'Novo' } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Novo');
    await expect(badge).toHaveAttribute('data-variant', 'default');

    // functional.item1 — a etiqueta não é mais preenchida: o fundo é o da
    // página e quem diz "default" é a borda em `--primary`, com 2px sólidos.
    const { background, border, borderWidth } = paint(badge);
    await expect(isTransparent(border)).toBe(false);
    await expect(parseFloat(borderWidth)).toBe(2);
    await expect(border).toBe(resolveColor(canvasElement, 'hsl(var(--primary))'));
    await expect(background).toBe(resolveColor(canvasElement, 'hsl(var(--background))'));
    await expect(border).not.toBe(background);

    const contrast = borderContrast(badge);
    await expect(contrast).not.toBeNull();
    await expect(contrast!.ratio).toBeGreaterThanOrEqual(BORDER_FLOOR);
  },
};

export const Secondary: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item2'],
    docs: { source: { transform: badgeSecundarioSource } },
  },
  render: () => ({ Component: BadgeStory, props: { variant: 'secondary', label: 'Beta' } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Beta');
    await expect(badge).toHaveAttribute('data-variant', 'secondary');

    // functional.item2 — a hierarquia entre as duas continua existindo, só que
    // agora no traço: mesma forma neutra da default, outra cor de borda.
    const { background, border } = paint(badge);
    const defaultPaint = referencePaint(canvasElement, 'nds-badge-default');
    await expect(background).toBe(defaultPaint.background);
    await expect(border).not.toBe(defaultPaint.border);

    // `--secondary` seria a escolha óbvia e NÃO serve como traço: não chega a
    // 1.4:1 contra a página, e a variante sumiria. Quem pinta é o cinza legível.
    await expect(border).toBe(resolveColor(canvasElement, 'hsl(var(--muted-foreground))'));
    await expect(border).not.toBe(resolveColor(canvasElement, 'hsl(var(--secondary))'));

    const contrast = borderContrast(badge);
    await expect(contrast).not.toBeNull();
    await expect(contrast!.ratio).toBeGreaterThanOrEqual(BORDER_FLOOR);
  },
};

export const Destructive: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item3', 'visual.item2'],
    docs: { source: { transform: badgeDestructiveSource } },
  },
  render: () => ({ Component: BadgeStory, props: { variant: 'destructive', label: 'Urgente' } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Urgente');
    await expect(badge).toHaveAttribute('data-variant', 'destructive');

    // functional.item3 — a cor sinaliza pela borda; o contraste vem do texto
    // neutro, que é o mesmo das outras seis.
    const { background, text, border } = paint(badge);
    const neutral = referencePaint(canvasElement, 'nds-badge-outline');
    await expect(border).toBe(resolveColor(canvasElement, 'hsl(var(--destructive))'));
    await expect(text).toBe(neutral.text);
    await expect(background).toBe(neutral.background);

    // accessibility.item3 — os 4.5:1 do texto não dependem mais da variante
    // escolhida, e é isso que a medida prova.
    const textRatio = textContrast(badge);
    await expect(textRatio).not.toBeNull();
    await expect(textRatio!.ratio).toBeGreaterThanOrEqual(4.5);

    const borderRatio = borderContrast(badge);
    await expect(borderRatio).not.toBeNull();
    await expect(borderRatio!.ratio).toBeGreaterThanOrEqual(BORDER_FLOOR);
  },
};

export const Outline: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item2'],
    docs: { source: { transform: badgeOutlineSource } },
  },
  render: () => ({ Component: BadgeStory, props: { variant: 'outline', label: 'Rascunho' } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Rascunho');
    await expect(badge).toHaveAttribute('data-variant', 'outline');

    // functional.item4 — a mais discreta do conjunto. Não é "a única sem
    // fundo": nenhuma tem fundo desde o redesenho. O que a separa é a borda,
    // que aqui é a hairline neutra do projeto — a MESMA que input e card
    // desenham, e por isso a única que fica abaixo do piso de 3:1 de propósito.
    const { background, border, borderWidth } = paint(badge);
    const defaultPaint = referencePaint(canvasElement, 'nds-badge-default');
    await expect(isTransparent(border)).toBe(false);
    await expect(parseFloat(borderWidth)).toBe(2);
    await expect(border).toBe(resolveColor(canvasElement, 'hsl(var(--border))'));
    await expect(background).toBe(defaultPaint.background);
    await expect(border).not.toBe(defaultPaint.border);
  },
};

/**
 * As três semânticas numa story só: o que elas prometem não é cada uma isolada,
 * e sim serem DISTINGUÍVEIS entre si. Uma por story deixaria passar o erro mais
 * provável — copiar o bloco do destructive e esquecer de trocar o token, que é
 * como as três nasceriam iguais.
 */
export const Semantics: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item5', 'accessibility.item3'],
    docs: {
      source: { transform: badgeSemanticasSource },
      description: {
        story:
          'warning avisa, success confirma e info contextualiza. As três existiam no CSS como -high, -medium e -low, servindo só à tabela de prioridade das docs pages.',
      },
    },
  },
  render: () => ({ Component: BadgeSemanticasStory }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badges = {
      warning: canvas.getByText('Vence hoje'),
      success: canvas.getByText('Aprovado'),
      info: canvas.getByText('Novidade'),
    };

    // A referência neutra é medida viva, e não cravada em rgb(): trocar o tema
    // não pode reprovar o teste, mas trocar a REGRA pode.
    const neutral = referencePaint(canvasElement, 'nds-badge-outline');

    const borders: string[] = [];
    for (const [name, badge] of Object.entries(badges)) {
      await expect(badge).toHaveAttribute('data-variant', name);
      const { background, text, border } = paint(badge);

      // functional.item7 — a cor vem da borda; fundo e texto ficam neutros, e é
      // isso que sustenta 4.5:1 sem depender da variante escolhida.
      await expect(isTransparent(border)).toBe(false);
      await expect(border).toBe(resolveColor(canvasElement, `hsl(var(--${name}))`));
      await expect(text).toBe(neutral.text);
      await expect(background).toBe(neutral.background);

      // accessibility.item3 — a borda é o contorno que identifica a variante:
      // piso de 3:1 (WCAG 1.4.11) para as três.
      const contrast = borderContrast(badge);
      await expect(contrast).not.toBeNull();
      await expect(contrast!.ratio).toBeGreaterThanOrEqual(BORDER_FLOOR);

      borders.push(border);
    }

    // Três cores, e não três nomes para a mesma: sem isto, copiar o bloco do
    // destructive nas três passaria.
    await expect(new Set(borders).size).toBe(3);
  },
};
