import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import { Badge } from './index';
import {
  badgeDefaultSource,
  badgeDestructiveSource,
  badgeOutlineSource,
  badgeSecondarySource,
  badgeSemanticasSource,
} from './badge.source';

const meta = {
  title: 'UI/Badge/Variants',
  component: Badge,
  tags: ['feedback'],
  parameters: {
    design: figmaDesign('badge'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: badgeDefaultSource },
      description: {
        component:
          'Cada variante do Badge reflete um nível de hierarquia visual: default destaca, secondary informa, destructive alerta e outline oferece baixa ênfase.',
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * O que a variante promete é o desenho, e desenho se mede: cor de fundo, cor de
 * texto e borda. As plays antigas só perguntavam se algo tinha renderizado —
 * passavam com as quatro variantes idênticas.
 */
const pintura = (el: HTMLElement) => {
  const s = getComputedStyle(el);
  return {
    fundo: s.backgroundColor,
    texto: s.color,
    borda: s.borderTopColor,
    larguraBorda: s.borderTopWidth,
  };
};
const transparente = (cor: string) => cor === 'rgba(0, 0, 0, 0)' || cor === 'transparent';

const render = (variant: string, texto: string) => () => ({
  components: { Badge },
  setup: () => ({ variant, texto }),
  template: `<Badge :variant="variant">{{ texto }}</Badge>`,
});

export const Default: Story = {
  parameters: { covers: ['functional.item1', 'visual.item2'] },
  render: render('default', 'Novo'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Novo');
    await expect(badge).toHaveAttribute('data-variant', 'default');
    // functional.item1 — fundo preenchido, texto contrastante, borda invisível.
    const { fundo, texto, borda } = pintura(badge);
    await expect(transparente(fundo)).toBe(false);
    await expect(fundo).not.toBe(texto);
    await expect(transparente(borda)).toBe(true);
  },
};

export const Secondary: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item2'],
    // Sem controls, a variante e o rótulo só existem no template.
    docs: { source: { transform: badgeSecondarySource } },
  },
  render: render('secondary', 'Beta'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Beta');
    await expect(badge).toHaveAttribute('data-variant', 'secondary');
    // functional.item2 — preenchida como a default, mas em outra cor: é isso
    // que faz a hierarquia entre as duas existir.
    const { fundo, borda } = pintura(badge);
    await expect(transparente(fundo)).toBe(false);
    await expect(transparente(borda)).toBe(true);

    const referencia = document.createElement('span');
    referencia.className = 'nds-badge nds-badge-default';
    canvasElement.appendChild(referencia);
    const backgroundDefault = getComputedStyle(referencia).backgroundColor;
    referencia.remove();
    await expect(fundo).not.toBe(backgroundDefault);
  },
};

export const Destructive: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item3', 'visual.item2'],
    // Sem controls, a variante e o rótulo só existem no template.
    docs: { source: { transform: badgeDestructiveSource } },
  },
  render: render('destructive', 'Urgente'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Urgente');
    await expect(badge).toHaveAttribute('data-variant', 'destructive');
    // functional.item3 — fundo suave E borda colorida, com o texto no
    // --foreground. É a combinação que sustenta os 4.5:1 documentados: cor
    // sinaliza, contraste vem do texto neutro.
    const { fundo, texto, borda } = pintura(badge);
    await expect(transparente(fundo)).toBe(false);
    await expect(transparente(borda)).toBe(false);

    const referencia = document.createElement('span');
    referencia.className = 'nds-badge nds-badge-outline';
    canvasElement.appendChild(referencia);
    const neutralText = getComputedStyle(referencia).color;
    referencia.remove();
    await expect(texto).toBe(neutralText);
  },
};

export const Outline: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item2'],
    // Sem controls, a variante e o rótulo só existem no template.
    docs: { source: { transform: badgeOutlineSource } },
  },
  render: render('outline', 'Rascunho'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Rascunho');
    await expect(badge).toHaveAttribute('data-variant', 'outline');
    // functional.item4 — só borda: sem fundo é o que a diferencia das outras.
    const { fundo, borda, larguraBorda } = pintura(badge);
    await expect(transparente(fundo)).toBe(true);
    await expect(transparente(borda)).toBe(false);
    await expect(parseFloat(larguraBorda)).toBeGreaterThan(0);
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
      // São três badges lado a lado dentro de um agrupador: o assunto é o
      // contraste ENTRE eles, e a do meta mostra um só.
      source: { transform: badgeSemanticasSource },
      description: {
        story:
          'warning avisa, success confirma e info contextualiza. As três existiam no CSS como -high, -medium e -low, servindo só à tabela de prioridade das docs pages.',
      },
    },
  },
  render: () => ({
    components: { Badge },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Badge variant="warning">Vence hoje</Badge>
        <Badge variant="success">Aprovado</Badge>
        <Badge variant="info">Novidade</Badge>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badges = {
      warning: canvas.getByText('Vence hoje'),
      success: canvas.getByText('Aprovado'),
      info: canvas.getByText('Novidade'),
    };

    // O texto neutro é medido de uma referência viva, e não cravado em rgb():
    // trocar o tema não pode reprovar o teste, mas trocar a REGRA pode.
    const referencia = document.createElement('span');
    referencia.className = 'nds-badge nds-badge-outline';
    canvasElement.appendChild(referencia);
    const neutralText = getComputedStyle(referencia).color;
    referencia.remove();

    const fundos: string[] = [];
    for (const [nome, badge] of Object.entries(badges)) {
      await expect(badge).toHaveAttribute('data-variant', nome);
      const { fundo, texto, borda } = pintura(badge);
      // functional.item7 — cor vem do fundo e da borda; o texto fica neutro,
      // que é o que sustenta 4.5:1 sem depender da variante escolhida.
      await expect(transparente(fundo)).toBe(false);
      await expect(transparente(borda)).toBe(false);
      await expect(texto).toBe(neutralText);
      fundos.push(fundo);
    }

    // Três cores, e não três nomes para a mesma: sem isto, copiar o bloco do
    // destructive nas três passaria.
    await expect(new Set(fundos).size).toBe(3);
  },
};
