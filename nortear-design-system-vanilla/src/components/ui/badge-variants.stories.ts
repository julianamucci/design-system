import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { resolveColor } from '@shared/testing/cor';
import { createBadge } from './badge';
import { badgeEmGrupoSourceCom, badgeSource, badgeSourceCom } from './badge.source';

const meta: Meta = {
  tags: ['feedback'],
  title: 'Primitives/Feedback/Badge/Variants',
  parameters: {
    design: figmaDesign('badge'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: badgeSource },
      description: {
        component:
          'As 5 variantes nativas do Badge renderizadas via createBadge({ variant, children }). ' +
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
 *
 * O que cada variante promete MUDOU: a etiqueta deixou de ser preenchida, e
 * quem carrega a variante agora é a BORDA, de 2px. Fundo e texto são neutros em
 * todas — medir "fundo preenchido e diferente entre variantes", como estas
 * plays faziam, hoje reprovaria o desenho correto.
 */
const pintura = (el: HTMLElement) => {
  const s = getComputedStyle(el);
  return {
    background: s.backgroundColor,
    text: s.color,
    border: s.borderTopColor,
    larguraBorda: s.borderTopWidth,
  };
};

/**
 * Cor que o TEMA VIGENTE dá ao token, medida de um elemento vivo — nunca um
 * `rgb()` cravado: trocar de tema não pode reprovar o teste, mas trocar a
 * regra pode.
 */
const token = (root: HTMLElement, tokenName: string) =>
  resolveColor(root, `hsl(var(${tokenName}))`);

/**
 * Borda que a folha compartilhada declara para cada variante semântica.
 *
 * Não é `--${variante}` para as três: `info` NÃO usa `--info`, e sim a hairline
 * neutra `--border`. Escrever a regra aqui é o que faz a play reprovar se
 * alguém devolver os tokens homônimos por simetria.
 */
const EXPECTED_BORDER: Record<string, string> = {
  warning: 'hsl(var(--warning))',
  success: 'hsl(var(--success))',
  info: 'hsl(var(--border))',
};

/*
 * O trio "fundo neutro, texto neutro, borda de 2px" se repete em toda play, e
 * é de propósito que ele NÃO virou função: a contagem de asserções por story
 * (`coverage_divergence`) lê o corpo do play, e asserção escondida atrás de
 * uma chamada some da conta — a stack passaria a parecer sub-coberta ao lado
 * das outras quatro, com o mesmo teste.
 */

// ─── Variantes ────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    covers: ['functional.item1', 'visual.item2'],
  },
  render: () => createBadge({ variant: 'default', children: 'Novo' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Novo');
    await expect(badge).toHaveAttribute('data-variant', 'default');
    // functional.item1 — a ênfase alta vem da borda em --primary; fundo e texto
    // ficam neutros, como em todas as outras.
    const { background, text, border, larguraBorda } = pintura(badge);
    await expect(border).toBe(token(canvasElement, '--primary'));
    await expect(background).toBe(token(canvasElement, '--background'));
    await expect(text).toBe(token(canvasElement, '--foreground'));
    await expect(parseFloat(larguraBorda)).toBeGreaterThanOrEqual(2);
  },
};

export const Destructive: Story = {
  // Override de story: a variante não passa por control neste arquivo, e o
  // snippet do meta mostraria `default` onde a story renderiza outra.
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
    // functional.item3 — a cor sinaliza pela borda e o contraste vem do texto
    // neutro: com fundo e texto fora do par semântico, os 4.5:1 do rótulo não
    // dependem mais de qual variante se escolheu.
    const { background, text, border, larguraBorda } = pintura(badge);
    await expect(border).toBe(token(canvasElement, '--destructive'));
    await expect(background).toBe(token(canvasElement, '--background'));
    await expect(parseFloat(larguraBorda)).toBeGreaterThanOrEqual(2);

    // O texto neutro é medido de uma referência viva, e não cravado em rgb().
    // Serve qualquer variante: nenhuma delas pinta o texto — é essa a promessa.
    const referencia = createBadge({ variant: 'default' });
    canvasElement.appendChild(referencia);
    const neutralText = getComputedStyle(referencia).color;
    referencia.remove();
    await expect(text).toBe(neutralText);
    await expect(text).toBe(token(canvasElement, '--foreground'));
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
    /*
     * Seis itens numa story só, e não é excesso: `functional.item2` (warning) e
     * `functional.item4` (info) pedem a borda de CADA uma, e é justamente por
     * estarem lado a lado que dá para provar que as duas não se confundem —
     * com a destructive, no caso da warning, e com a ênfase alta, no da info.
     */
    covers: [
      'functional.item2',
      'functional.item4',
      'functional.item7',
      'visual.item2',
      'visual.item5',
      'accessibility.item3',
    ],
    // Override de story: o assunto é o CONJUNTO — uma etiqueta sozinha não
    // mostra o que as três variantes semânticas prometem, ser distinguíveis.
    docs: {
      source: {
        transform: badgeEmGrupoSourceCom({
          items: [
            { variant: 'warning', label: 'Vence hoje' },
            { variant: 'success', label: 'Aprovado' },
            { variant: 'info', label: 'Novidade' },
          ],
        }),
      },
      description: {
        story:
          'warning avisa, success confirma e info contextualiza — esta última com a borda neutra mais silenciosa do conjunto, a mesma que input e card já desenham.',
      },
    },
  },
  render: () => {
    const group = document.createElement('div');
    group.className = 'nds-cluster';
    group.dataset.spacing = 'sm';
    group.append(
      createBadge({ variant: 'warning', children: 'Vence hoje' }),
      createBadge({ variant: 'success', children: 'Aprovado' }),
      createBadge({ variant: 'info', children: 'Novidade' }),
    );
    return group;
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
    const referencia = createBadge({ variant: 'default' });
    canvasElement.appendChild(referencia);
    const neutralText = getComputedStyle(referencia).color;
    referencia.remove();

    const borders: string[] = [];
    for (const [name, badge] of Object.entries(badges)) {
      await expect(badge).toHaveAttribute('data-variant', name);
      const { background, text, border, larguraBorda } = pintura(badge);
      // functional.item2 (warning), functional.item4 (info) e functional.item7 —
      // a cor vem da borda, cada uma na sua; o texto fica neutro, que é o que
      // sustenta 4.5:1 sem depender da variante escolhida.
      await expect(border).toBe(resolveColor(canvasElement, EXPECTED_BORDER[name]));
      await expect(text).toBe(neutralText);
      await expect(background).toBe(token(canvasElement, '--background'));
      await expect(parseFloat(larguraBorda)).toBeGreaterThanOrEqual(2);
      borders.push(border);
    }

    // functional.item2 — o que a warning promete não é "ser laranja", é NÃO se
    // confundir com a destructive: as duas já colaram uma vez, e a separação
    // vive na paleta. A cor da vizinha vem de uma etiqueta viva, e não de um
    // rgb() cravado.
    const destructiva = createBadge({ variant: 'destructive' });
    canvasElement.appendChild(destructiva);
    const destructiveBorder = getComputedStyle(destructiva).borderTopColor;
    destructiva.remove();
    await expect(pintura(badges.warning).border).not.toBe(destructiveBorder);

    // functional.item4 — a info é a etiqueta silenciosa: a hairline neutra, e
    // não a ênfase alta. Confundir as duas some no olho e aparece aqui.
    await expect(pintura(badges.info).border).not.toBe(token(canvasElement, '--primary'));

    // Três cores, e não três nomes para a mesma: sem isto, copiar o bloco do
    // destructive nas três passaria. A checagem migrou do fundo para a borda —
    // hoje as três compartilham o mesmo fundo neutro, e comparar fundos
    // reprovaria o desenho correto.
    await expect(new Set(borders).size).toBe(3);
  },
};
