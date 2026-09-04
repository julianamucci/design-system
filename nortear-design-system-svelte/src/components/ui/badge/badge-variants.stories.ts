import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { backgroundEffective, noTransicao, ratio, resolveColor } from '@shared/testing/cor';
import { Badge } from './index';
import BadgeStory from './BadgeStory.svelte';
import BadgeSemanticasStory from './BadgeSemanticasStory.svelte';
import { badgeDestructiveSource, badgeSemanticasSource, badgeSource } from './badge.source';

const meta: Meta = {
  title: 'Components/Feedback/Badge/Variants',
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
          'Cada variante do Badge reflete um nível de hierarquia visual: default destaca, destructive alerta, warning avisa, success confirma e info contextualiza com o traço mais discreto do conjunto.',
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
 * neutros e IGUAIS nas cinco. Medir preenchimento deixou de distinguir qualquer
 * coisa — as asserções antigas de `backgroundColor` diferente entre variantes
 * passariam com as cinco idênticas, que é exatamente o defeito que elas existiam
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
 * variante, e é a ÚNICA coisa que a identifica desde o redesenho. Alcançam o
 * piso as bordas cromáticas: `--primary`, `--destructive`, `--warning` e
 * `--success`.
 *
 * Uma fica abaixo dele DE PROPÓSITO, e o porquê está registrado na folha
 * compartilhada: a `info` assumiu a hairline neutra do projeto, a mesma que
 * input e card desenham. Mudar isso é assunto da paleta, não do badge — então
 * ela se mede por outra promessa, e não por este piso.
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
    // neutro, que é o mesmo das outras quatro.
    const { background, text, border } = paint(badge);
    const reference = referencePaint(canvasElement, 'nds-badge-default');
    await expect(border).toBe(resolveColor(canvasElement, 'hsl(var(--destructive))'));
    await expect(text).toBe(reference.text);
    await expect(background).toBe(reference.background);

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

/**
 * As três semânticas numa story só: o que elas prometem não é cada uma isolada,
 * e sim serem DISTINGUÍVEIS entre si. Uma por story deixaria passar o erro mais
 * provável — copiar o bloco do destructive e esquecer de trocar o token, que é
 * como as três nasceriam iguais.
 */
export const Semantics: Story = {
  parameters: {
    covers: [
      'functional.item2',
      'functional.item4',
      'functional.item7',
      'visual.item5',
      'accessibility.item3',
    ],
    docs: {
      source: { transform: badgeSemanticasSource },
      description: {
        story:
          'warning avisa, success confirma e info contextualiza. A warning é distinta da destructive, para que aviso e erro não se confundam; a info usa a borda neutra, o traço mais discreto do conjunto.',
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

    // A cor esperada de cada borda, medida VIVA e não cravada em rgb(): trocar
    // o tema não pode reprovar o teste, mas trocar a REGRA pode.
    //
    // functional.item2 — a warning lê `--warning`, e a play reprova quem trocar
    // isso por um valor de fora da paleta.
    // functional.item4 — a info NÃO usa `--info`: ela é a neutra discreta, e o
    // traço dela é a mesma hairline que input e card desenham.
    const expectedBorder: Record<string, string> = {
      warning: 'hsl(var(--warning))',
      success: 'hsl(var(--success))',
      info: 'hsl(var(--border))',
    };

    // A referência neutra é medida viva pelo mesmo motivo. A default serve: o
    // fundo e o texto são iguais nas cinco, e ela não está sob medição aqui.
    const reference = referencePaint(canvasElement, 'nds-badge-default');

    const borders: string[] = [];
    for (const [name, badge] of Object.entries(badges)) {
      await expect(badge).toHaveAttribute('data-variant', name);
      const { background, text, border } = paint(badge);

      // functional.item7 — a cor vem da borda; fundo e texto ficam neutros, e é
      // isso que sustenta 4.5:1 sem depender da variante escolhida.
      await expect(isTransparent(border)).toBe(false);
      await expect(border).toBe(resolveColor(canvasElement, expectedBorder[name]));
      await expect(text).toBe(reference.text);
      await expect(background).toBe(reference.background);

      // accessibility.item3 — os 4.5:1 do texto valem nas três, porque o texto
      // é o mesmo neutro das demais.
      const textRatio = textContrast(badge);
      await expect(textRatio).not.toBeNull();
      await expect(textRatio!.ratio).toBeGreaterThanOrEqual(4.5);

      borders.push(border);
    }

    // O piso de 3:1 da borda vale para as duas cromáticas desta story, success
    // e warning. Só a info fica abaixo dele de propósito — a nota em
    // BORDER_FLOOR diz por quê —, e por isso o piso não é cobrado dela:
    // cobrá-lo aqui reprovaria a decisão de desenho em vez de um defeito.
    for (const cromatica of [badges.success, badges.warning]) {
      const borderRatio = borderContrast(cromatica);
      await expect(borderRatio).not.toBeNull();
      await expect(borderRatio!.ratio).toBeGreaterThanOrEqual(BORDER_FLOOR);
    }

    // functional.item2 — além do piso, a warning promete NÃO parecer a
    // destructive: as duas já colaram na tela, e o que as separa é a distância
    // entre os dois tokens da paleta.
    const destructive = referencePaint(canvasElement, 'nds-badge-destructive');
    await expect(paint(badges.warning).border).not.toBe(destructive.border);

    // Três cores, e não três nomes para a mesma: sem isto, copiar o bloco do
    // destructive nas três passaria.
    await expect(new Set(borders).size).toBe(3);
  },
};
