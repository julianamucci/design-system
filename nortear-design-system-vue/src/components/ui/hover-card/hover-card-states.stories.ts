import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect } from 'storybook/test';
import {
  panelEntrar,
  waitForOpen,
  waitForClosed,
  accessibleName,
  panelOpen,
  contrastRatio,
} from '@shared/testing/hover-card-probe';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { hoverCardControlledSource, hoverCardPerfilSource } from './hover-card.source';

// Os três estados que o conteúdo compartilhado descreve: fechado (só o
// gatilho), aberto (painel no portal) e controlado (quem manda é o estado de
// fora). Não há estado desabilitado com visual próprio — um gatilho
// desabilitado é o `disabled` do elemento nativo.

const meta = {
  title: 'UI/HoverCard/States',
  component: HoverCard,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Fechado e aberto têm a MESMA marcação — abrir é interação, não
      // atributo —, então a do `meta` serve às duas.
      source: { transform: hoverCardPerfilSource },
      description: {
        component:
          'Fechado, aberto e controlado. O painel só existe no DOM enquanto o cartão está aberto — fechado, o portal não deixa resíduo nenhum.',
      },
    },
  },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = { HoverCard, HoverCardContent, HoverCardTrigger, Button };

const CARTAO_PERFIL = `
  <div class="nds-cluster" data-spacing="sm" data-align="start">
    <div class="nds-size-10 nds-shrink-0 nds-rounded-full nds-bg-muted" aria-hidden="true"></div>
    <div class="nds-stack" data-spacing="xs">
      <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
      <p class="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
    </div>
  </div>`;

const STYLE_PARAGRAFO = 'contain: layout; min-height: 250px; max-width: 24rem;';

export const Closed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Estado inicial. Nada além do gatilho existe no documento, e o gatilho não anuncia nenhum estado expandido: um cartão de preview não é um menu.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <p class="nds-text-body" style="${STYLE_PARAGRAFO}">
        Comentário de
        <HoverCard>
          <HoverCardTrigger as-child>
            <a href="/users/joana" class="nds-text-primary nds-font-medium nds-hover-underline">@joana</a>
          </HoverCardTrigger>
          <HoverCardContent>${CARTAO_PERFIL}</HoverCardContent>
        </HoverCard>
        há 2 horas.
      </p>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('link', { name: /@joana/i });

    await step('Fechado, o portal está vazio', async () => {
      await waitForClosed();
      await expect(gatilho).toBeVisible();
      await expect(panelOpen()).toBeNull();
    });

    await step('O gatilho não anuncia estado de expansão', async () => {
      // Deliberado, e igual nas cinco stacks: `aria-expanded` descreveria o
      // cartão como um menu que o leitor comanda. Ele é conteúdo suplementar —
      // quem tem estado é o painel, não o link.
      await expect(gatilho).not.toHaveAttribute('aria-expanded');
      await expect(gatilho).not.toHaveAttribute('aria-haspopup');
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ['functional.item5', 'accessibility.item2', 'accessibility.item5'],
    docs: {
      description: {
        story:
          'Aberto por ponteiro. O cartão permanece enquanto o cursor estiver sobre o gatilho OU sobre o próprio painel — é o que a WCAG 1.4.13 chama de hoverable, e o que permite selecionar o texto de dentro.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <p class="nds-text-body" style="${STYLE_PARAGRAFO}">
        Comentário de
        <HoverCard :open-delay="100" :close-delay="80">
          <HoverCardTrigger as-child>
            <a href="/users/joana" class="nds-text-primary nds-font-medium nds-hover-underline">@joana</a>
          </HoverCardTrigger>
          <HoverCardContent>${CARTAO_PERFIL}</HoverCardContent>
        </HoverCard>
        há 2 horas.
      </p>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('link', { name: /@joana/i });

    // Estado conhecido: a play reexecuta no mesmo DOM pelo painel Interactions.
    await userEvent.keyboard('{Escape}');
    await waitForClosed();
    await userEvent.hover(gatilho);
    const painel = await waitForOpen();

    await step('O painel é um dialog não-modal', async () => {
      await expect(painel).toHaveAttribute('role', 'dialog');
      // Sem `aria-modal`: a ausência do atributo JÁ significa não-modal, e é o
      // markup que o Vanilla — referência do sistema — emite. Escrever
      // `aria-modal="false"` seria redundância que nenhuma outra stack tem.
      await expect(painel).not.toHaveAttribute('aria-modal');
      // Não-modal de verdade: o resto da página continua alcançável.
      await expect(gatilho).toBeVisible();
      await expect(accessibleName(painel)).toBe('@joana');
    });

    await step('Levar o cursor para dentro do painel mantém o cartão aberto', async () => {
      // O caminho completo: sai do gatilho (o que agenda o fechamento) e entra
      // no painel (o que o cancela). Só a entrada, sem a saída, provaria nada.
      await panelEntrar(gatilho, painel);
      // Espera deliberada, maior que o closeDelay de 80ms: o que se prova aqui
      // é a AUSÊNCIA de fechamento, e ausência não tem evento para aguardar.
      await new Promise((resolve) => setTimeout(resolve, 300));
      await expect(panelOpen()).toBe(painel);
      await expect(painel).toBeVisible();
    });

    await step('O texto do painel tem contraste de 4.5:1 contra o fundo do cartão', async () => {
      // Medido do par que o design system promete (--popover-foreground sobre
      // --popover), e não deduzido do token: é o valor que o navegador aplicou.
      const estilo = getComputedStyle(painel);
      await expect(contrastRatio(estilo.color, estilo.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item6'],
    docs: {
      // Quem manda é o estado de fora, e os dois botões que o movem fazem parte
      // da lição — nada disso existe na marcação do `meta`.
      source: { transform: hoverCardControlledSource },
      description: {
        story:
          'Estado vindo de fora. Útil quando outra parte da tela precisa saber que o cartão está aberto — para pausar um carrossel, por exemplo. O gatilho continua abrindo por ponteiro e por foco; cada mudança volta pelo callback.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const aberto = ref(false);
      return { aberto };
    },
    template: `
      <div class="nds-stack" data-spacing="md" style="${STYLE_PARAGRAFO}">
        <div class="nds-cluster" data-spacing="xs">
          <!-- Nomes próprios, e não os mesmos do gatilho: dois controles com o
               mesmo nome acessível são ambíguos em leitor de tela. -->
          <Button size="sm" variant="outline" @click="aberto = true">Abrir pelo estado externo</Button>
          <Button size="sm" variant="outline" @click="aberto = false">Fechar pelo estado externo</Button>
        </div>

        <p class="nds-text-body">
          Comentário de
          <HoverCard :open="aberto" @update:open="(v) => aberto = v">
            <HoverCardTrigger as-child>
              <a href="/users/joana" class="nds-text-primary nds-font-medium nds-hover-underline">@joana</a>
            </HoverCardTrigger>
            <HoverCardContent>${CARTAO_PERFIL}</HoverCardContent>
          </HoverCard>
          há 2 horas.
        </p>

        <p class="nds-text-caption nds-text-muted-foreground" data-testid="estado-externo">
          Estado externo: {{ aberto ? 'aberto' : 'fechado' }}
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const abrir = canvas.getByRole('button', { name: 'Abrir pelo estado externo' });
    const fechar = canvas.getByRole('button', { name: 'Fechar pelo estado externo' });
    const espelho = canvas.getByTestId('estado-externo');

    await step('O cartão obedece ao estado externo, sem ponteiro nenhum', async () => {
      // Nenhum hover e nenhum foco no gatilho: quem abre é a propriedade, e é
      // isso que distingue o modo controlado.
      await userEvent.click(abrir);
      const painel = await waitForOpen();
      await expect(painel).toBeVisible();
      await expect(espelho).toHaveTextContent('aberto');
    });

    await step('E fecha pelo mesmo caminho', async () => {
      await userEvent.click(fechar);
      await waitForClosed();
      await expect(panelOpen()).toBeNull();
      await expect(espelho).toHaveTextContent('fechado');
    });
  },
};
