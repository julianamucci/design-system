import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { resolveColor } from '@shared/testing/cor';
import { NdsBadge, type BadgeVariant } from './badge';

const VARIANTS: { variant: BadgeVariant; label: string }[] = [
  { variant: 'default',     label: 'Default'     },
  { variant: 'destructive', label: 'Destructive' },
  { variant: 'warning',     label: 'Warning'     },
  { variant: 'success',     label: 'Success'     },
  { variant: 'info',        label: 'Info'        },
];

const meta: Meta = {
  title: 'UI/Badge/Variants',
  decorators: [moduleMetadata({ imports: [NdsBadge] })],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const Variants: Story = {
  parameters: {
    // Uma story cobre as cinco variantes de uma vez: é o conjunto lado a lado
    // que a regressão visual compara, e é nele que a diferença de cor aparece.
    //
    // Os itens 2 e 4 descrevem a warning que se separa da destructive e a info
    // na neutra discreta — as duas medidas nos passos abaixo, uma delas com
    // passo dedicado.
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item4',
      'functional.item7', 'visual.item1', 'visual.item2', 'visual.item5',
      'accessibility.item2', 'accessibility.item3',
    ],
  },
  render: () => ({
    props: { variantes: VARIANTS },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        @for (v of variantes; track v.variant) {
          <span ndsBadge [variant]="v.variant">{{ v.label }}</span>
        }
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cada variante recebe a própria classe', async () => {
      // Sem AOT o binding cai em silêncio no default e as cinco ficariam
      // iguais — esta é a asserção que impede o NG0303 de voltar despercebido.
      for (const { variant, label } of VARIANTS) {
        const badge = canvas.getByText(label);
        await expect(badge).toHaveAttribute('data-variant', variant);
        if (variant !== 'default') {
          await expect(badge).toHaveClass(new RegExp(`nds-badge-${variant}`));
        }
      }
    });

    await step('Cada variante pinta a BORDA, e só ela', async () => {
      // O desenho mudou: a etiqueta deixou de ser preenchida. Fundo e texto são
      // neutros nas CINCO, e quem carrega a variante é a borda de 2px. Medir
      // "fundo diferente por variante", como esta play fazia, hoje reprovaria o
      // desenho correto — a correção é medir a borda, não afrouxar o teste.
      //
      // Nem toda variante aponta para o token de mesmo nome, e é de propósito:
      // a `info` NÃO usa `--info`, e sim a hairline neutra `--border`. Por isso
      // a tabela guarda a EXPRESSÃO de cor, e não o nome do token — e é ela que
      // reprova quem devolver os tokens homônimos por simetria.
      const BORDER_COLOR: Record<BadgeVariant, string> = {
        default: 'hsl(var(--primary))',
        destructive: 'hsl(var(--destructive))',
        warning: 'hsl(var(--warning))',
        success: 'hsl(var(--success))',
        info: 'hsl(var(--border))',
      };
      // Cor que o TEMA VIGENTE dá ao token, lida de um elemento vivo — nunca um
      // rgb() cravado: trocar de tema não pode reprovar o teste.
      const background = resolveColor(canvasElement, 'hsl(var(--background))');
      const foreground = resolveColor(canvasElement, 'hsl(var(--foreground))');
      for (const { variant, label } of VARIANTS) {
        const style = getComputedStyle(canvas.getByText(label));
        await expect(style.borderTopColor).toBe(
          resolveColor(canvasElement, BORDER_COLOR[variant]),
        );
        await expect(parseFloat(style.borderTopWidth)).toBeGreaterThanOrEqual(2);
        await expect(style.backgroundColor).toBe(background);
        await expect(style.color).toBe(foreground);
      }
    });

    await step('A warning não se confunde com a destructive', async () => {
      // O que a warning promete não é "ser laranja", é NÃO parecer um erro: as
      // duas já colaram na tela, e o que as separa é a distância entre os dois
      // tokens da paleta. O teste cobra os dois lados — o token que ela lê e a
      // vizinha de quem ela precisa se afastar.
      const warningBorder = getComputedStyle(canvas.getByText('Warning')).borderTopColor;
      await expect(warningBorder).toBe(resolveColor(canvasElement, 'hsl(var(--warning))'));
      await expect(warningBorder).not.toBe(
        resolveColor(canvasElement, 'hsl(var(--destructive))'),
      );
    });

    await step('As variantes semânticas não repetem a mesma cor', async () => {
      // O que separa warning de success de destructive é a cor da BORDA. Se um
      // token sumir do CSS, as classes continuam certas e só a medição acusa.
      // A `info` fica de fora: ela deixou de ser semântica e usa a hairline
      // neutra, medida no passo que percorre todas as variantes.
      const colors = new Set(
        ['Destructive', 'Warning', 'Success'].map((l) =>
          getComputedStyle(canvas.getByText(l)).borderTopColor,
        ),
      );
      await expect(colors.size).toBe(3);
    });
  },
};
