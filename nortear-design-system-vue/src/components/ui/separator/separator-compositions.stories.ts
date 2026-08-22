import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { Separator } from './index';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  separatorEmCardSource,
  separatorEmMenuSource,
  separatorEnfaseForteSource,
} from './separator.source';

const meta: Meta<any> = {
  title: 'UI/Separator/Compositions',
  component: Separator,
  tags: ['layout'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: separatorEmCardSource },
      description: {
        component:
          'Composições do Separator: dentro de um Card, dentro de um menu vertical e com a ênfase forte.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const InCard: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    components: { Separator, Card, CardContent, CardDescription, CardHeader, CardTitle },
    template: `
      <Card class="nds-max-w-md">
        <CardHeader>
          <CardTitle>Resumo do pedido</CardTitle>
          <CardDescription>3 itens, entrega em 5 dias úteis.</CardDescription>
        </CardHeader>
        <Separator orientation="horizontal" />
        <CardContent>
          <p class="nds-text-body">Total: R$ 249,90</p>
        </CardContent>
      </Card>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const card = canvasElement.querySelector<HTMLElement>('.nds-card')!;
    const sep = card.querySelector<HTMLElement>('.nds-separator');

    await step('Separa o cabeçalho do conteúdo dentro do Card', async () => {
      await expect(sep).toBeInTheDocument();
      await expect(sep).toHaveAttribute('data-orientation', 'horizontal');
    });

    await step('Não estoura a largura do Card', async () => {
      // Separador dentro de um contêiner com padding é onde a largura costuma
      // vazar — medir o par prova que ele respeita a caixa.
      const caixa = sep!.getBoundingClientRect();
      await expect(caixa.width).toBeGreaterThan(0);
      await expect(caixa.width).toBeLessThanOrEqual(card.getBoundingClientRect().width);
    });
  },
};

export const InMenu: Story = {
  parameters: {
    covers: ['visual.item4'],
    // Aqui a divisão é estrutura e a linha deixa de ser decorativa — e o menu
    // em volta é outra composição, sem nada do cartão do meta.
    docs: { source: { transform: separatorEmMenuSource } },
  },
  render: () => ({
    components: { Separator },
    // A divisão entre grupos de um menu FAZ parte da estrutura da informação:
    // é o caso em que o separador deixa de ser decorativo.
    template: `
      <div class="nds-stack nds-max-w-xs nds-rounded-md nds-border-default nds-bg-background nds-p-1" data-spacing="xs">
        <div class="nds-rounded-sm nds-hover-bg-accent nds-px-2 nds-py-1 nds-text-body">Perfil</div>
        <div class="nds-rounded-sm nds-hover-bg-accent nds-px-2 nds-py-1 nds-text-body">Conta</div>
        <Separator orientation="horizontal" :decorative="false" />
        <div class="nds-rounded-sm nds-hover-bg-accent nds-px-2 nds-py-1 nds-text-body">Sair</div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const menu = canvasElement.querySelector<HTMLElement>('.nds-stack')!;
    const sep = menu.querySelector<HTMLElement>('.nds-separator')!;
    const itens = [...menu.children].filter((c) => !c.classList.contains('nds-separator'));

    await step('A divisão entre grupos é anunciada', async () => {
      await expect(sep).toHaveAttribute('role', 'separator');
      await expect(sep).toHaveAttribute('aria-orientation', 'horizontal');
    });

    await step('Fica ENTRE os dois grupos, não dentro de um deles', async () => {
      const meio = sep.getBoundingClientRect().top;
      await expect(itens).toHaveLength(3);
      await expect(itens[1].getBoundingClientRect().bottom).toBeLessThanOrEqual(meio + 1);
      await expect(itens[2].getBoundingClientRect().top).toBeGreaterThanOrEqual(meio - 1);
    });
  },
};

export const EmphasisStrong: Story = {
  parameters: {
    covers: ['functional.item5', 'functional.item6', 'visual.item5'],
    // São DUAS linhas lado a lado: a comparação entre os dois pesos é a story.
    docs: { source: { transform: separatorEnfaseForteSource } },
  },
  render: () => ({
    components: { Separator },
    // A classe extra entra junto com a ênfase: é o mesmo par que a docs page
    // documenta em Extensibilidade, e prova que ela convive com a base.
    template: `
      <div class="nds-stack nds-w-md" data-spacing="md">
        <p class="nds-text-body nds-text-muted-foreground">Fim da seção</p>
        <Separator orientation="horizontal" data-testid="padrao" />
        <p class="nds-text-body nds-text-muted-foreground">Continuação do mesmo assunto</p>
        <Separator orientation="horizontal" emphasis="strong" class="nds-mt-4" data-testid="forte" />
        <p class="nds-text-body nds-font-medium">Troca de assunto</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const padrao = canvasElement.querySelector<HTMLElement>('[data-testid="padrao"]')!;
    const forte = canvasElement.querySelector<HTMLElement>('[data-testid="forte"]')!;

    await step('A ênfase forte dobra a espessura', async () => {
      await expect(forte).toHaveAttribute('data-emphasis', 'strong');
      await expect(padrao.getBoundingClientRect().height).toBeCloseTo(1, 1);
      await expect(forte.getBoundingClientRect().height).toBeCloseTo(2, 1);
    });

    await step('A ênfase forte troca o token de cor da linha', async () => {
      // Comparar com o separador padrão renderizado ao lado, e não com um valor
      // literal: o token muda por tema, a diferença entre os dois não.
      await expect(getComputedStyle(forte).backgroundColor).not.toBe(
        getComputedStyle(padrao).backgroundColor,
      );
    });

    await step('A classe extra convive com a classe base', async () => {
      await expect(forte).toHaveClass('nds-separator');
      await expect(forte).toHaveClass('nds-mt-4');
    });
  },
};
