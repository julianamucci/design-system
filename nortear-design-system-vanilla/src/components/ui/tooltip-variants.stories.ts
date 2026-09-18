import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, waitFor } from 'storybook/test';
import { createTooltip } from './tooltip';
import { aguardarLado, balaoDe, clearPortal, wrap } from './tooltip.fixtures';
import { tooltipSource, tooltipSourceWith } from './tooltip.source';
import { createButton } from './button';

import { figmaDesign } from '@shared/figma/design-links';
// As três variantes que o conteúdo compartilhado descreve — texto curto, texto
// com atalho e texto longo. Todas nascem abertas: é o único jeito de a regressão
// visual capturar o balão, que só existe no DOM enquanto está aberto.

/**
 * Altura da moldura destas stories, e ela é FOLGA, não enfeite.
 *
 * Com o flip ligado, balão sem espaço acima vira para baixo — e estas stories
 * são justamente as que o Chromatic fotografa afirmando "side top"
 * (`visual.item1`). Na moldura de 180px o gatilho ficava perto do topo do
 * quadro, e a foto podia registrar `bottom` enquanto a documentação dizia `top`,
 * sem nada reprovando.
 *
 * O `.nds-cluster` de `wrap` centra no eixo transversal por padrão, então altura
 * aqui VIRA folga: o gatilho fica no meio e sobra metade dela acima dele. É o
 * degrau que o resto da rodada usou (~400px), e o mesmo que a cena dos quatro
 * lados passou a usar.
 */
const VARIANT_HEIGHT = '400px';

/** Luminância relativa da WCAG a partir de um `rgb(r, g, b)` computado. */
function luminancia(cor: string): number {
  const [r, g, b] = (cor.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map((v) => {
    const channel = Number(v) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste WCAG entre duas cores computadas. */
function contraste(a: string, b: string): number {
  const [light, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (light + 0.05) / (escuro + 0.05);
}

const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/Tooltip/Variants',
  parameters: {
    design: figmaDesign('tooltip'),
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: tooltipSource },
      description: {
        component:
          'Default é texto curto. Com atalho traz a tecla junto do texto. Texto longo quebra dentro do limite de largura do balão — passou disso, o caso é de Popover. NOTA: a factory recebe o conteúdo como texto, então o atalho não vai em <kbd> separado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: {
    covers: ['visual.item1', 'accessibility.item2'],
    docs: { source: { transform: tooltipSourceWith({ content: 'Salvar' }) } },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Salvar', 'aria-label': 'Salvar' });
    const el = createTooltip({ trigger, content: 'Salvar' });
    queueMicrotask(() => trigger.focus());
    return wrap(el, VARIANT_HEIGHT);
  },
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /salvar/i });

    await step('Nasce aberto, do lado de cima, com o texto curto no balão', async () => {
      trigger.blur();
      trigger.focus();
      // O lado é AFIRMADO, e é por isso que a moldura tem folga: `visual.item1`
      // promete "side top" ao Chromatic, e sem asserção a story podia fotografar
      // um balão virado enquanto a documentação afirmava o contrário.
      const balao = await aguardarLado(trigger, 'top');
      await expect(balao).toHaveAttribute('data-side', 'top');
      await expect(balao).toHaveClass(/nds-tooltip-content/);
      await expect(balao.textContent?.trim()).toBe('Salvar');
    });

    await step('O texto do balão passa dos 4.5:1 exigidos', async () => {
      // Medido no elemento real, não na tabela de tokens: é a combinação
      // aplicada (fundo --primary, texto --primary-foreground) que a pessoa lê,
      // e ela precisa valer em qualquer tema da toolbar.
      const computedStyle = getComputedStyle(balaoDe(trigger)!);
      await expect(contraste(computedStyle.color, computedStyle.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    });

    await step('Cleanup', async () => { clearPortal(); });
  },
};

export const WithShortcut: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      source: {
        transform: tooltipSourceWith({ content: 'Salvar', contentComMarcacao: true }),
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Salvar', 'aria-label': 'Salvar' });

    // Uma tecla por `<kbd>`, como nas outras quatro stacks — e não a string
    // "Salvar (Ctrl+S)", que era o que estava aqui. A variante existe para
    // demonstrar o TRATAMENTO do atalho, e texto solto não demonstra nenhum: sem
    // `<kbd>` não há caixa de tecla, e sem `data-slot="kbd"` a folha não encurta
    // o respiro à direita do balão.
    const content = document.createElement('span');
    content.style.display = 'contents';
    const label = document.createElement('span');
    label.textContent = 'Salvar';
    content.appendChild(label);
    for (const name of ['Ctrl', 'S']) {
      const tecla = document.createElement('kbd');
      tecla.dataset.slot = 'kbd';
      tecla.className = 'nds-kbd';
      tecla.textContent = name;
      content.appendChild(tecla);
    }

    const el = createTooltip({ trigger, content });
    queueMicrotask(() => trigger.focus());
    return wrap(el, VARIANT_HEIGHT);
  },
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /salvar/i });

    await step('O atalho vai em <kbd>, não solto no texto', async () => {
      trigger.blur();
      trigger.focus();
      // Mesmo motivo da `Default`: `visual.item2` fotografa este balão, e o lado
      // afirmado impede que a foto e a documentação divirjam em silêncio.
      const balao = await aguardarLado(trigger, 'top');
      await expect(balao).toHaveAttribute('data-side', 'top');
      await expect(balao.textContent).toContain('Salvar');
      const teclas = balao.querySelectorAll('kbd');
      await expect(teclas.length).toBe(2);
      await expect(teclas[0].textContent).toBe('Ctrl');
      await expect(teclas[1].textContent).toBe('S');
    });

    await step('A folha compartilhada reconhece a tecla e encurta o respiro', async () => {
      // A prova de que o gancho `data-slot="kbd"` chegou: sem ele o balão fica
      // com o respiro simétrico do `padding-inline`, e a regra
      // `.nds-tooltip-content:has([data-slot="kbd"])` não pinta nada.
      const balao = balaoDe(trigger)!;
      await expect(balao.querySelector('[data-slot="kbd"]')).not.toBeNull();
      const computedStyle = getComputedStyle(balao);
      await expect(parseFloat(computedStyle.paddingInlineEnd)).toBeLessThan(
        parseFloat(computedStyle.paddingInlineStart),
      );
    });

    await step('O atalho não vira nome do botão — ele já tem o seu', async () => {
      // O `aria-label` continua curto; o atalho é reforço visual, e duplicá-lo
      // no nome acessível faria o leitor de tela soletrar a tecla toda vez.
      await expect(trigger).toHaveAttribute('aria-label', 'Salvar');
    });

    await step('Cleanup', async () => { clearPortal(); });
  },
};

// O par gatilho + texto é o do CONTEÚDO COMPARTILHADO (`shareButton` e
// `shareHint`), e é o mesmo nas cinco stacks. Aqui era outro par, inventado só
// para esta story: comparar as cinco páginas lado a lado deixava de responder se
// a diferença era do componente ou do exemplo.
const LONG_TRIGGER = 'Compartilhar';
const LONG_TEXT =
  'Cria um link público de leitura — qualquer pessoa com o link vê o conteúdo';

export const LongText: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: {
        transform: tooltipSourceWith({
          triggerLabel: LONG_TRIGGER,
          content: LONG_TEXT,
        }),
      },
    },
  },
  render: () => {
    const trigger = createButton({
      variant: 'outline',
      label: LONG_TRIGGER,
      'aria-label': LONG_TRIGGER,
    });
    const el = createTooltip({ trigger, content: LONG_TEXT });
    queueMicrotask(() => trigger.focus());
    // A mesma folga das irmãs: o balão longo é o MAIS alto dos três, logo o
    // primeiro a não caber acima do gatilho e virar. A story não afirma lado —
    // ela mede largura —, então uma virada aqui não reprovaria: só trocaria a
    // foto do Chromatic sem ninguém ver.
    return wrap(el, VARIANT_HEIGHT);
  },
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /compartilhar/i });

    await step('O texto quebra dentro do limite de largura do balão', async () => {
      trigger.blur();
      trigger.focus();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      const balao = balaoDe(trigger)!;
      await expect(balao.textContent).toMatch(/link público/);
      // O limite vem da folha compartilhada; medir a largura real prova que o
      // texto respeitou o teto em vez de esticar o balão pela viewport. A classe
      // utilitária que ficava aqui saiu do projeto e não pintava nada.
      const limit = parseFloat(getComputedStyle(balao).maxWidth);
      await expect(limit).toBeGreaterThan(0);
      await expect(balao.getBoundingClientRect().width).toBeLessThanOrEqual(limit + 1);
    });

    await step('Cleanup', async () => { clearPortal(); });
  },
};
