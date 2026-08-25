import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { backgroundEffective, noTransicao, ratio, resolveColor } from '@shared/testing/cor';
import { NdsBadge, NdsBadgeCounter } from './badge';
import { NdsButton, NdsButtonIcon } from './button';

const meta: Meta = {
  title: 'UI/Badge/Compositions',
  decorators: [moduleMetadata({ imports: [NdsBadge, NdsBadgeCounter, NdsButton, NdsButtonIcon] })],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const WithIcon: Story = {
  parameters: { covers: ['functional.item5', 'accessibility.item2', 'visual.item3'] },
  render: () => ({
    // Variante default e rótulo curto: o assunto da story é o ícone dentro da
    // etiqueta, e uma cor semântica aqui só acrescentaria variável.
    template: `
      <span ndsBadge>
        <svg ndsButtonIcon kind="check" size="sm" data-icon="inline-start"></svg>
        Ativo
      </span>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Ativo');

    await step('O ícone é decorativo — quem nomeia é o texto', async () => {
      // accessibility.item2 — ícone sem aria-hidden dentro de um badge faz o
      // leitor anunciar um gráfico sem nome antes do rótulo. E o nome acessível
      // da etiqueta é o texto e só ele: se o ícone virasse conteúdo lido, o
      // rótulo deixaria de ser `Ativo`.
      const icon = badge.querySelector('svg');
      await expect(icon).not.toBeNull();
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(badge.textContent?.trim()).toBe('Ativo');
    });

    await step('O respiro entre ícone e rótulo é do container', async () => {
      // functional.item5 — o espaço entre ícone e texto é do container, não uma
      // margem na story: o .nds-badge declara gap, e o data-icon encurta o
      // padding daquele lado. Margem manual somaria ao gap e dobraria o respiro.
      const icon = badge.querySelector('svg')!;
      const style = getComputedStyle(badge);
      await expect(style.display).toBe('inline-flex');
      await expect(parseFloat(style.columnGap)).toBeGreaterThan(0);
      await expect(getComputedStyle(icon).marginRight).toBe('0px');
      await expect(parseFloat(style.paddingInlineStart)).toBeLessThan(
        parseFloat(style.paddingInlineEnd),
      );
    });

    await step('O ícone vem ANTES do rótulo', async () => {
      // A ordem é o que a composição promete: ícone à esquerda reforçando o
      // texto. Invertida, o leitor de tela continua igual e só a tela acusa.
      await expect(badge.firstElementChild).toBe(badge.querySelector('svg'));
    });
  },
};

/**
 * Contador DENTRO da etiqueta — a peça que qualquer variante aceita: o número
 * entra na etiqueta, à direita do rótulo que lhe dá sentido.
 *
 * A composição do contador AVULSO — o badge que era só um número ao lado de um
 * ícone solto — saiu do sistema por ser redundante com esta: o número sem
 * rótulo já dependia de um `aria-label` no pai para significar alguma coisa.
 */
export const WithCounter: Story = {
  parameters: { covers: ['visual.item6'] },
  render: () => ({
    template: `
      <span ndsBadge variant="destructive">
        Urgente
        <span ndsBadgeCounter>12</span>
      </span>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const counter = canvas.getByText('12');
    const badge = counter.closest<HTMLElement>('[data-slot="badge"]')!;

    await step('A peça sai com a classe e o slot que a folha documenta', async () => {
      // A peça publicada, e não uma classe solta na story: sem a diretiva o
      // <span> viraria texto sem estilo e a composição sumiria da tela.
      await expect(counter).toHaveAttribute('data-slot', 'badge-counter');
      await expect(counter).toHaveClass(/nds-badge-counter/);
      await expect(badge.contains(counter)).toBe(true);
    });

    await step('O número fica à direita do rótulo, na mesma linha', async () => {
      // O rótulo é nó de texto, não elemento: quem dá a caixa dele é um Range.
      // Comparar com a caixa do BADGE não provaria nada — o contador está
      // dentro dele de qualquer jeito.
      const label = Array.from(badge.childNodes).find(
        (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim().length > 0,
      );
      await expect(label, 'o rótulo da etiqueta precisa ser texto próprio').toBeTruthy();
      const range = document.createRange();
      range.selectNodeContents(label!);
      const labelBox = range.getBoundingClientRect();
      const counterBox = counter.getBoundingClientRect();

      await expect(counterBox.left).toBeGreaterThanOrEqual(labelBox.right - 1);
      // Sobreposição vertical em vez de tolerância em pixel: prova a mesma
      // linha sem depender de arredondamento, e ainda reprova se o contador
      // quebrar para baixo do rótulo.
      await expect(counterBox.top).toBeLessThan(labelBox.bottom);
      await expect(labelBox.top).toBeLessThan(counterBox.bottom);
    });

    await step('O número é lido, não desenhado', async () => {
      // Texto de verdade no DOM, dentro do rótulo e sem aria-hidden: contador
      // desenhado por `content:` do CSS ou escondido do leitor reprova aqui.
      await expect(counter.textContent?.trim()).toBe('12');
      await expect(counter.hasAttribute('aria-hidden')).toBe(false);
      // Regex e não igualdade literal: o Angular colapsa o espaço do template,
      // e o que a asserção prova é a ORDEM do rótulo e do número, não quantos
      // espaços sobraram entre eles.
      await expect((badge.textContent ?? '').replace(/\s+/g, ' ').trim()).toMatch(/^Urgente ?12$/);
    });

    await step('O número alcança 4.5:1 contra o fundo do próprio contador', async () => {
      // A transição sai do caminho antes de medir: ler no primeiro quadro
      // devolve a cor anterior, e é assim que se inventa um contraste de ~1.0.
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
    });

    await step('O contador é neutro, e não tingido pela variante', async () => {
      // É a decisão medida da folha: preencher o contador com a cor da
      // variante deixa o número abaixo de 4.5:1 em parte dos temas.
      const counterBackground = getComputedStyle(counter).backgroundColor;
      await expect(counterBackground).toBe(resolveColor(canvasElement, 'hsl(var(--secondary))'));
      await expect(counterBackground).not.toBe(
        resolveColor(canvasElement, 'hsl(var(--destructive))'),
      );
    });
  },
};

export const AsTrigger: Story = {
  parameters: { covers: ['functional.item6', 'visual.item4', 'accessibility.item1'] },
  render: () => ({
    // O Badge não vira o controle: quem carrega a interação é o <button> em
    // volta. O badge segue sendo rótulo, e o Tab alcança um elemento com
    // semântica de verdade.
    template: `
      <div class="nds-cluster" data-spacing="md">
        <button ndsButton variant="ghost" size="sm" aria-label="Filtrar por categoria Frontend">
          <span ndsBadge variant="info">Frontend</span>
        </button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O Tab alcança o botão, não o badge', async () => {
      await userEvent.tab();
      await expect(canvas.getByRole('button')).toHaveFocus();
    });

    await step('O badge continua fora da ordem de tabulação', async () => {
      const badges = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="badge"]')];
      for (const b of badges) await expect(b.hasAttribute('tabindex')).toBe(false);
    });

    await step('O botão tem nome acessível além do rótulo do badge', async () => {
      // "Frontend" sozinho não diz o que o botão faz; numa lista de filtros
      // vira uma fileira de botões sem verbo.
      const button = canvas.getByRole('button', { name: /Filtrar por categoria/ });
      await expect(button).toBeTruthy();
    });
  },
};
