import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import {
  entrarNoPainel,
  esperarAberto,
  esperarFechado,
  nomeAcessivel,
  painelAberto,
  razaoDeContraste,
} from '@shared/testing/hover-card-probe';
import { createHoverCard, type HoverCardElement } from './hover-card';
import { construirCartaoPerfil, construirLink, emFrase } from './hover-card.fixtures';
import { createButton } from './button';
import { sondarOuvintes, hospedeiroDeSonda, conferirLimpeza, type ResultadoDaSonda } from './leak-probe';

// Os três estados que o conteúdo compartilhado descreve: fechado (só o
// gatilho), aberto (painel no portal) e controlado (quem manda é o estado de
// fora). Não há estado desabilitado com visual próprio — um gatilho
// desabilitado é o `disabled` do elemento nativo.

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/HoverCard/States',
  parameters: {
    layout: 'padded',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Fechado, aberto e controlado. O painel só existe no DOM enquanto o cartão está aberto — fechado, o portal não deixa resíduo nenhum.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Closed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Estado inicial. Nada além do gatilho existe no documento, e o gatilho não anuncia nenhum estado expandido: um cartão de preview não é um menu.',
      },
    },
  },
  render: () => {
    const cartao = createHoverCard({
      trigger: construirLink('@joana'),
      content: construirCartaoPerfil(),
    });
    return emFrase(cartao, 'Comentário de', 'há 2 horas.');
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('link', { name: /@joana/i });

    await step('Fechado, o portal está vazio', async () => {
      await esperarFechado();
      await expect(gatilho).toBeVisible();
      await expect(painelAberto()).toBeNull();
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
  render: () => {
    const cartao = createHoverCard({
      trigger: construirLink('@joana'),
      content: construirCartaoPerfil(),
      openDelay: 100,
      closeDelay: 80,
    });
    return emFrase(cartao, 'Comentário de', 'há 2 horas.');
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('link', { name: /@joana/i });

    // Estado conhecido: a play reexecuta no mesmo DOM pelo painel Interactions.
    await userEvent.keyboard('{Escape}');
    await esperarFechado();
    await userEvent.hover(gatilho);
    const painel = await esperarAberto();

    await step('O painel é um dialog não-modal', async () => {
      await expect(painel).toHaveAttribute('role', 'dialog');
      // Sem `aria-modal`: a ausência do atributo JÁ significa não-modal, e é o
      // markup que esta factory — referência do sistema — emite.
      await expect(painel).not.toHaveAttribute('aria-modal');
      // Não-modal de verdade: o resto da página continua alcançável.
      await expect(gatilho).toBeVisible();
      await expect(nomeAcessivel(painel)).toBe('@joana');
    });

    await step('Levar o cursor para dentro do painel mantém o cartão aberto', async () => {
      // O caminho completo: sai do gatilho (o que agenda o fechamento) e entra
      // no painel (o que o cancela). Só a entrada, sem a saída, provaria nada.
      await entrarNoPainel(gatilho, painel);
      // Espera deliberada, maior que o closeDelay de 80ms: o que se prova aqui
      // é a AUSÊNCIA de fechamento, e ausência não tem evento para aguardar.
      await new Promise((resolve) => setTimeout(resolve, 300));
      await expect(painelAberto()).toBe(painel);
      await expect(painel).toBeVisible();
    });

    await step('O texto do painel tem contraste de 4.5:1 contra o fundo do cartão', async () => {
      // Medido do par que o design system promete (--popover-foreground sobre
      // --popover), e não deduzido do token: é o valor que o navegador aplicou.
      const estilo = getComputedStyle(painel);
      await expect(razaoDeContraste(estilo.color, estilo.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item6'],
    docs: {
      description: {
        story:
          'Estado vindo de fora. Numa factory não há propriedade reativa para observar: quem controla chama abrir()/fechar() na raiz e recebe cada mudança de volta pelo callback.',
      },
    },
  },
  render: () => {
    const raiz = document.createElement('div');
    raiz.className = 'nds-stack';
    raiz.dataset.spacing = 'md';
    raiz.style.contain = 'layout';
    raiz.style.minHeight = '280px';
    raiz.style.maxWidth = '24rem';

    const espelho = document.createElement('p');
    espelho.className = 'nds-text-caption nds-text-muted-foreground';
    espelho.dataset.testid = 'estado-externo';
    espelho.textContent = 'Estado externo: fechado';

    const cartao = createHoverCard({
      trigger: construirLink('@joana'),
      content: construirCartaoPerfil(),
      onOpenChange: (aberto) => {
        espelho.textContent = `Estado externo: ${aberto ? 'aberto' : 'fechado'}`;
      },
    }) as HoverCardElement;

    // Nomes próprios, e não os mesmos do gatilho: dois controles com o mesmo
    // nome acessível são ambíguos em leitor de tela.
    const abrir = createButton({ variant: 'outline', size: 'sm', label: 'Abrir pelo estado externo' });
    const fechar = createButton({ variant: 'outline', size: 'sm', label: 'Fechar pelo estado externo' });
    abrir.addEventListener('click', () => cartao.open());
    fechar.addEventListener('click', () => cartao.close());

    const controles = document.createElement('div');
    controles.className = 'nds-cluster';
    controles.dataset.spacing = 'xs';
    controles.append(abrir, fechar);

    raiz.append(controles, emFrase(cartao, 'Comentário de', 'há 2 horas.'), espelho);
    return raiz;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const abrir = canvas.getByRole('button', { name: 'Abrir pelo estado externo' });
    const fechar = canvas.getByRole('button', { name: 'Fechar pelo estado externo' });
    const espelho = canvas.getByTestId('estado-externo');

    await step('O cartão obedece ao estado externo, sem ponteiro nenhum', async () => {
      // Nenhum hover e nenhum foco no gatilho: quem abre é o comando, e é isso
      // que distingue o modo controlado.
      await userEvent.click(abrir);
      const painel = await esperarAberto();
      await expect(painel).toBeVisible();
      await expect(espelho).toHaveTextContent('aberto');
    });

    await step('E fecha pelo mesmo caminho', async () => {
      await userEvent.click(fechar);
      await esperarFechado();
      await expect(painelAberto()).toBeNull();
      await expect(espelho).toHaveTextContent('fechado');
    });

    await step('Os apelidos em português continuam abrindo e fechando', async () => {
      // Esta fábrica era a única do repositório com comandos em português;
      // sidebar, drawer, popover e dropdown expõem `open`/`close`/`toggle`.
      // Os nomes antigos viraram apelido em vez de sumir — apagá-los quebraria
      // chamador em silêncio, e sem esta asserção a compatibilidade seria
      // promessa: alguém removeria a linha e nada acusaria.
      //
      // O elemento vem do DOM, e não do closure do `render`: a play roda noutro
      // escopo, e é a raiz montada que carrega os comandos.
      const cartao = canvasElement.querySelector<HoverCardElement>('[data-slot="hover-card"]')!;
      await expect(cartao).not.toBeNull();

      cartao.abrir();
      await waitFor(() => expect(painelAberto()).not.toBeNull());
      cartao.fechar();
      await esperarFechado();
      await expect(painelAberto()).toBeNull();

      // E `toggle` alterna a partir do estado real, não de um sinalizador à parte.
      cartao.toggle();
      await waitFor(() => expect(cartao.isOpen()).toBe(true));
      cartao.toggle();
      await waitFor(() => expect(cartao.isOpen()).toBe(false));
    });
  },
};

// ─── Limpeza de ouvintes ──────────────────────────────────────────────────────
//
// A fábrica registra ouvinte em `document`. Quem tira o nó da página com o
// componente nesse estado não passa por caminho de fechamento nenhum, e antes
// não havia o que chamar. A prova aqui NÃO é "`destroy()` rodou" — isso passaria
// com um `destroy()` vazio. É a contagem de ouvintes do livro-caixa fechando em
// zero, confirmada por uma bateria de eventos disparada no documento depois da
// saída. Ver `leak-probe.ts` para o que cada prova cobre e como pode falhar.

export const ListenerCleanup: Story = {
  parameters: {
    controls: { disable: true },
    // A story existe para o que acontece DEPOIS da saída do nó: a foto seria
    // sempre a mesma legenda.
    chromatic: { disable: true },
  },
  render: () => hospedeiroDeSonda(
    'Sonda de limpeza: o cartão é montado, exibido e removido da página pela play.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let sonda!: ResultadoDaSonda;

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      sonda = await sondarOuvintes({
        host: host as HTMLElement,
        montar: () => {
          const conteudo = document.createElement('p');
          conteudo.textContent = 'Prévia do perfil.';
          const trigger = createButton({ variant: 'outline', label: 'Perfil' });
          return createHoverCard({ trigger, content: conteudo, openDelay: 0, closeDelay: 0 });
        },
        exercitar: (no) => (no as HTMLElement & { abrir?: () => void }).abrir?.(),
        seletorDePortal: '[data-slot="hover-card-content"]',
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await conferirLimpeza(sonda);
    });
  },
};
