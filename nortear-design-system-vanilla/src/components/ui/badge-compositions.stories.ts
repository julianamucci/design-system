import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { Check } from 'lucide';
import { backgroundEffective, noTransicao, ratio, resolveColor } from '@shared/testing/cor';
import { createBadge, createBadgeCounter } from './badge';
import {
  triggerSourceWithBadge,
  badgeSource,
  badgeSourceCom,
  badgeWithCounterSourceCom,
} from './badge.source';

const meta: Meta = {
  tags: ['feedback'],
  title: 'Components/Feedback/Badge/Compositions',
  parameters: {
    design: figmaDesign('badge'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: badgeSource },
      description: {
        component:
          'Configuracoes contextuais do Badge: combinado com ícone, com contador à direita do ' +
          'rótulo, ou envolvido em <button> para trigger clicável.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers: ícones Lucide como SVG vanilla ─────────────────────────────────

type LucideIconNode = [string, Record<string, string>];

function createIcon(nodes: LucideIconNode[]): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  // Sem tamanho e sem margem aqui: `.nds-badge > svg` já dimensiona em 12px e o
  // gap do container faz o espaçamento. Margem manual somava ao gap.
  for (const [tag, attrs] of nodes) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

// ─── Composicoes ──────────────────────────────────────────────────────────────

export const WithIcon: Story = {
  // Override de story: o ícone entra no MESMO `children`, junto com o texto —
  // é a lista que o snippet do meta não mostraria.
  parameters: {
    covers: ['functional.item5', 'accessibility.item2', 'visual.item3'],
    docs: {
      source: { transform: badgeSourceCom({ withIcon: true, label: 'Ativo' }) },
    },
  },
  render: () => {
    const icone = createIcon(Check as unknown as LucideIconNode[]);
    icone.dataset.icon = 'inline-start';
    return createBadge({ variant: 'default', children: [icone as unknown as HTMLElement, 'Ativo'] });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Ativo');

    // accessibility.item2 — o ícone é reforço visual: quem nomeia é o texto.
    const icone = badge.querySelector('svg');
    await expect(icone).not.toBeNull();
    await expect(icone).toHaveAttribute('aria-hidden', 'true');
    await expect(badge.textContent?.trim()).toBe('Ativo');

    // functional.item5 — o espaço entre ícone e texto é do container, não uma
    // margem na story: o .nds-badge declara gap, e o data-icon encurta o padding
    // daquele lado. Margem manual somaria ao gap e dobraria o respiro.
    const style = getComputedStyle(badge);
    await expect(style.display).toBe('inline-flex');
    await expect(parseFloat(style.columnGap)).toBeGreaterThan(0);
    await expect(getComputedStyle(icone!).marginRight).toBe('0px');
    await expect(parseFloat(style.paddingInlineStart)).toBeLessThan(
      parseFloat(style.paddingInlineEnd),
    );
  },
};

/**
 * Contador DENTRO da etiqueta — a peça que qualquer variante aceita. O número
 * entra na etiqueta, à direita do rótulo que lhe dá sentido: número solto, sem
 * rótulo em volta, não diz de que é a contagem.
 */
export const WithCounter: Story = {
  // Override de story: a FORMA é outra — `children` recebe a lista rótulo +
  // contador, e o contador vem da subfábrica, não de uma classe escrita à mão.
  parameters: {
    covers: ['visual.item6'],
    docs: {
      source: {
        transform: badgeWithCounterSourceCom({
          variant: 'destructive',
          label: 'Urgente',
          count: '12',
        }),
      },
      description: {
        story:
          'O contador é neutro de propósito: a cor da variante fica na borda ao redor. Preenchê-lo com a cor semântica derruba o número abaixo de 4.5:1 em parte dos temas.',
      },
    },
  },
  render: () =>
    createBadge({
      variant: 'destructive',
      children: ['Urgente', createBadgeCounter({ text: '12' })],
    }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const counter = canvas.getByText('12');
    const badge = counter.closest<HTMLElement>('[data-slot="badge"]')!;

    // A peça publicada, e não uma classe solta na story: o markup tem de sair
    // com a classe e o slot que a folha compartilhada documenta.
    await expect(counter).toHaveAttribute('data-slot', 'badge-counter');
    await expect(counter.classList.contains('nds-badge-counter')).toBe(true);
    await expect(badge.contains(counter)).toBe(true);

    // ── Geometria: à direita do rótulo, na mesma linha ──────────────────────
    // O rótulo é nó de texto, não elemento: quem dá a caixa dele é um Range.
    // Comparar com a caixa do BADGE não provaria nada — o contador está dentro
    // dele de qualquer jeito.
    const label = Array.from(badge.childNodes).find(
      (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim().length > 0,
    );
    await expect(label, 'o rótulo da etiqueta precisa ser texto próprio').toBeTruthy();
    const range = document.createRange();
    range.selectNodeContents(label!);
    const labelBox = range.getBoundingClientRect();
    const counterBox = counter.getBoundingClientRect();

    await expect(counterBox.left).toBeGreaterThanOrEqual(labelBox.right - 1);
    // Sobreposição vertical em vez de tolerância em pixel: prova a mesma linha
    // sem depender de arredondamento, e ainda reprova se o contador quebrar
    // para baixo do rótulo.
    await expect(counterBox.top).toBeLessThan(labelBox.bottom);
    await expect(labelBox.top).toBeLessThan(counterBox.bottom);

    // ── O número é lido ─────────────────────────────────────────────────────
    // Texto de verdade no DOM, dentro do rótulo e sem aria-hidden: contador
    // desenhado por `content:` do CSS ou escondido do leitor reprova aqui.
    await expect(counter.textContent?.trim()).toBe('12');
    await expect(counter.hasAttribute('aria-hidden')).toBe(false);
    await expect((badge.textContent ?? '').replace(/\s+/g, ' ').trim()).toBe('Urgente12');

    // ── Contraste do número contra o fundo do próprio contador ──────────────
    // A transição sai do caminho antes de medir: ler no primeiro quadro devolve
    // a cor anterior, e é assim que se inventa um contraste de ~1.0.
    const contrast = noTransicao(counter, () => {
      const counterBackgroundColor = backgroundEffective(counter);
      return counterBackgroundColor
        ? ratio(getComputedStyle(counter).color, counterBackgroundColor)
        : null;
    });
    await expect(contrast, 'não deu para medir a cor do contador').not.toBeNull();
    await expect(
      contrast!.ratio,
      `número do contador em ${contrast!.ratio}:1 sobre ${contrast!.background}`,
    ).toBeGreaterThanOrEqual(4.5);

    // ── Neutro, e não tingido pela variante ─────────────────────────────────
    // É a decisão medida da folha: preencher o contador com a cor da variante
    // deixa o número abaixo de 4.5:1 em parte dos temas.
    const counterBackground = getComputedStyle(counter).backgroundColor;
    await expect(counterBackground).toBe(resolveColor(canvasElement, 'hsl(var(--secondary))'));
    await expect(counterBackground).not.toBe(resolveColor(canvasElement, 'hsl(var(--destructive))'));
  },
};

export const AsButton: Story = {
  // Override de story: quem recebe o clique e o foco é o botão em volta, e é
  // dele o nome acessível — outra FORMA de snippet.
  // A reinicialização da aparência do <button> que esta story faz em `style`
  // não entra no snippet: não existe utilitária .nds-* para ela (relatado).
  parameters: {
    covers: ['functional.item6', 'accessibility.item4', 'visual.item4'],
    docs: {
      source: {
        transform: triggerSourceWithBadge({
          variant: 'info',
          label: 'React',
          accessibleName: 'Filtrar por React',
        }),
      },
    },
  },
  render: () => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nds-cluster nds-rounded-md nds-focus-ring-inset';
    btn.style.background = 'transparent';
    btn.style.border = '0';
    btn.style.padding = '0';
    btn.setAttribute('aria-label', 'Filtrar por React');
    btn.appendChild(createBadge({ variant: 'info', children: 'React' }));
    return btn;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /Filtrar por React/i });
    // functional.item6 — o pai recebe o foco e o badge não compete por ele.
    const badge = button.querySelector('[data-slot="badge"]');
    await expect(badge).not.toBeNull();
    await expect(badge!.hasAttribute('tabindex')).toBe(false);
    button.focus();
    await expect(document.activeElement).toBe(button);
  },
};
