import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { createBadge } from './badge';
import { badgeEmGrupoSourceCom, badgeSource, badgeSourceCom } from './badge.source';

const meta: Meta = {
  tags: ['feedback'],
  title: 'UI/Badge/Variants',
  parameters: {
    design: figmaDesign('badge'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: badgeSource },
      description: {
        component:
          'As 4 variantes nativas do Badge renderizadas via createBadge({ variant, children }). ' +
          'Cada variante aplica classes CSS distintas para hierarquia visual — sem prop size.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * O que a variante promete é o desenho, e desenho se mede: cor de fundo, cor de
 * texto e borda. As plays antigas conferiam a classe do modificador — a classe
 * pode estar lá e a regra ter sumido do CSS.
 */
const pintura = (el: HTMLElement) => {
  const s = getComputedStyle(el);
  return {
    background: s.backgroundColor,
    texto: s.color,
    border: s.borderTopColor,
    larguraBorda: s.borderTopWidth,
  };
};
const transparente = (cor: string) => cor === 'rgba(0, 0, 0, 0)' || cor === 'transparent';

// ─── Variantes ────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: { covers: ['functional.item1', 'visual.item2'] },
  render: () => createBadge({ variant: 'default', children: 'Novo' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Novo');
    await expect(badge).toHaveAttribute('data-variant', 'default');
    // functional.item1 — fundo preenchido, texto contrastante, borda invisível.
    const { background, texto, border } = pintura(badge);
    await expect(transparente(background)).toBe(false);
    await expect(background).not.toBe(texto);
    await expect(transparente(border)).toBe(true);
  },
};

export const Secondary: Story = {
  // Override de story: a variante não passa por control neste arquivo, e o
  // snippet do meta mostraria `default` onde a story renderiza outra.
  parameters: {
    covers: ['functional.item2', 'visual.item2'],
    docs: {
      source: { transform: badgeSourceCom({ variant: 'secondary', label: 'Beta' }) },
    },
  },
  render: () => createBadge({ variant: 'secondary', children: 'Beta' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Beta');
    await expect(badge).toHaveAttribute('data-variant', 'secondary');
    // functional.item2 — preenchida como a default, mas em outra cor: é isso
    // que faz a hierarquia entre as duas existir.
    const { background, border } = pintura(badge);
    await expect(transparente(background)).toBe(false);
    await expect(transparente(border)).toBe(true);

    const referencia = createBadge({ variant: 'default' });
    canvasElement.appendChild(referencia);
    const backgroundDefault = getComputedStyle(referencia).backgroundColor;
    referencia.remove();
    await expect(background).not.toBe(backgroundDefault);
  },
};

export const Destructive: Story = {
  // Override de story: mesma razão da Secondary — a variante é o assunto.
  parameters: {
    covers: ['functional.item3', 'accessibility.item3', 'visual.item2'],
    docs: {
      source: { transform: badgeSourceCom({ variant: 'destructive', label: 'Urgente' }) },
    },
  },
  render: () => createBadge({ variant: 'destructive', children: 'Urgente' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Urgente');
    await expect(badge).toHaveAttribute('data-variant', 'destructive');
    // functional.item3 — fundo suave E borda colorida, com o texto no
    // --foreground. É a combinação que sustenta os 4.5:1 documentados: cor
    // sinaliza, contraste vem do texto neutro.
    const { background, texto, border } = pintura(badge);
    await expect(transparente(background)).toBe(false);
    await expect(transparente(border)).toBe(false);

    const referencia = createBadge({ variant: 'outline' });
    canvasElement.appendChild(referencia);
    const neutralText = getComputedStyle(referencia).color;
    referencia.remove();
    await expect(texto).toBe(neutralText);
  },
};

export const Outline: Story = {
  // Override de story: mesma razão da Secondary — a variante é o assunto.
  parameters: {
    covers: ['functional.item4', 'visual.item2'],
    docs: {
      source: { transform: badgeSourceCom({ variant: 'outline', label: 'Rascunho' }) },
    },
  },
  render: () => createBadge({ variant: 'outline', children: 'Rascunho' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Rascunho');
    await expect(badge).toHaveAttribute('data-variant', 'outline');
    // functional.item4 — só borda: sem fundo é o que a diferencia das outras.
    const { background, border, larguraBorda } = pintura(badge);
    await expect(transparente(background)).toBe(true);
    await expect(transparente(border)).toBe(false);
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
    // Override de story: o assunto é o CONJUNTO — uma etiqueta sozinha não
    // mostra o que as três variantes semânticas prometem, ser distinguíveis.
    docs: {
      source: {
        transform: badgeEmGrupoSourceCom({
          itens: [
            { variant: 'warning', label: 'Vence hoje' },
            { variant: 'success', label: 'Aprovado' },
            { variant: 'info', label: 'Novidade' },
          ],
        }),
      },
      description: {
        story:
          'warning avisa, success confirma e info contextualiza. As três existiam no CSS como -high, -medium e -low, servindo só à tabela de prioridade das docs pages.',
      },
    },
  },
  render: () => {
    const grupo = document.createElement('div');
    grupo.className = 'nds-cluster';
    grupo.dataset.spacing = 'sm';
    grupo.append(
      createBadge({ variant: 'warning', children: 'Vence hoje' }),
      createBadge({ variant: 'success', children: 'Aprovado' }),
      createBadge({ variant: 'info', children: 'Novidade' }),
    );
    return grupo;
  },
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
      const { background, texto, border } = pintura(badge);
      // functional.item7 — cor vem do fundo e da borda; o texto fica neutro,
      // que é o que sustenta 4.5:1 sem depender da variante escolhida.
      await expect(transparente(background)).toBe(false);
      await expect(transparente(border)).toBe(false);
      await expect(texto).toBe(neutralText);
      fundos.push(background);
    }

    // Três cores, e não três nomes para a mesma: sem isto, copiar o bloco do
    // destructive nas três passaria.
    await expect(new Set(fundos).size).toBe(3);
  },
};
