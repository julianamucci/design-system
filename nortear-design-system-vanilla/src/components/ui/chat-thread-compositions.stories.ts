import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { createChatThread } from './chat-thread';
import { createButton } from './button';
import { chatLabels, paraMensagens } from './chat-thread.fixtures';
import { chatThreadSourceWith } from './chat-thread.source';
import { CHAT_COM_FERRAMENTAS } from '@shared/primitives/chat-examples';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O que uma resposta pode trazer além do texto: o caminho que ela percorreu e o
// que se pode fazer com ela.

const meta: Meta = {
  tags: ['conversational'],
  title: 'Components/Conversational/ChatThread/Compositions',
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: chatThreadSourceWith({ messages: 'comFerramentas' }) },
      description: {
        component:
          'A resposta com raciocínio, chamada de ferramenta, fontes numeradas e as ações do turno.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onCopy = fn();

/**
 * Espera a opacidade computada assentar num valor, por relógio.
 *
 * Laço de `setTimeout` e não `waitFor`: o `waitFor` da suíte reagenda por
 * observador de mutação e traz o prazo padrão de 1s junto, que é curto demais
 * para uma transição medida com a máquina saturada. Aqui o prazo é explícito, e
 * a mensagem de erro carrega o último valor lido — sem ela, "estourou o prazo"
 * não diz se a opacidade estava parada em zero ou a meio caminho.
 */
async function esperarOpacidade(el: HTMLElement, alvo: string, prazoMs: number): Promise<void> {
  const limite = performance.now() + prazoMs;
  let ultima = '';
  while (performance.now() < limite) {
    ultima = getComputedStyle(el).opacity;
    if (ultima === alvo) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`a opacidade não chegou a ${alvo} em ${prazoMs}ms — último valor lido: ${ultima}`);
}

/**
 * A resposta com fontes, e uma delas com o endereço RECUSADO.
 *
 * A fonte recusada mora na story, e não no exemplo compartilhado: o exemplo é o
 * que a documentação mostra como uso normal, e `javascript:` não é uso normal —
 * é a entrada hostil que o componente precisa aguentar. As cinco stacks montam
 * a mesma lista, para a story fotografar a mesma tela em todas.
 */
function comFerramentas() {
  const messages = paraMensagens(CHAT_COM_FERRAMENTAS);
  const ultima = messages[messages.length - 1];
  ultima.sources = [
    ...(ultima.sources ?? []),
    { title: 'Fonte com endereço recusado', url: 'javascript:alert(1)' },
  ];
  return messages;
}

export const WithReasoningAndTools: Story = {
  parameters: { covers: ['functional.item5', 'functional.item6', 'visual.item2'] },
  render: () =>
    createChatThread({
      messages: comFerramentas(),
      labels: chatLabels(),
      size: 'lg',
    }),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="chat-thread"]')!;

    await step('O raciocínio nasce fechado — o destino vem antes do caminho', async () => {
      const reasoning = root.querySelector<HTMLDetailsElement>('.nds-chat-reasoning')!;
      await expect(reasoning.open).toBe(false);
      // Fechado, mas no documento: a busca do navegador continua achando o
      // texto, que é metade do motivo de ser `<details>` nativo.
      await expect(reasoning).toHaveTextContent(/não da memória/i);
    });

    await step('O controle é alcançável por teclado, e abre', async () => {
      const reasoning = root.querySelector<HTMLDetailsElement>('.nds-chat-reasoning')!;
      const summary = reasoning.querySelector<HTMLElement>('summary')!;
      // O passo estabelece a própria precondição: a play reexecuta no mesmo DOM.
      if (reasoning.open) reasoning.open = false;

      // O foco prova o alcance pelo Tab, que é o que o `list-style: none` do
      // resumo poderia ter custado.
      summary.focus();
      await expect(summary).toHaveFocus();

      // A ATIVAÇÃO é medida por clique, e não por `{Enter}`: a tecla sobre um
      // `<summary>` é comportamento nativo do navegador, e o runner não o
      // reproduz — medido, `userEvent.keyboard('{Enter}')` deixa o
      // `<details>` fechado. Asserção com a tecla aqui não provaria o
      // componente, provaria o simulador.
      await userEvent.click(summary);
      await expect(reasoning.open).toBe(true);
    });

    await step('A ferramenta diz o estado por escrito', async () => {
      const call = root.querySelector<HTMLElement>('.nds-chat-tool-call')!;
      await expect(call.dataset.state).toBe('done');
      await expect(call).toHaveTextContent(/listar_componentes/);
      await expect(call).toHaveTextContent(/pronto/i);
    });

    await step('As fontes são numeradas pela LISTA, e são links de verdade', async () => {
      // A numeração é do conteúdo: é por ela que o texto se refere à fonte.
      const sources = root.querySelector<HTMLElement>('.nds-chat-sources')!;
      await expect(sources.tagName).toBe('OL');
      const links = within(sources).getAllByRole('link');
      await expect(links).toHaveLength(2);
      await expect(links[0]).toHaveTextContent('1');
      await expect(links[0]).toHaveAttribute('href');
    });

    await step('A fonte de endereço recusado é legível, e NÃO é clicável', async () => {
      // O endereço de uma fonte vem de quem gerou a resposta. `javascript:` num
      // `href` executa ao clique, então ele não vira link — e a fonte não some,
      // porque o texto dela continua sendo informação.
      const sources = root.querySelector<HTMLElement>('.nds-chat-sources')!;
      const recusada = sources.querySelector<HTMLElement>('[data-unsafe]')!;
      await expect(recusada.tagName).toBe('SPAN');
      await expect(recusada).toHaveTextContent(/recusado/i);
      await expect(sources.querySelector('a[href^="javascript:"]')).toBeNull();
    });
  },
};

export const WithActions: Story = {
  parameters: { covers: ['accessibility.item4'] },
  render: () => {
    const messages = paraMensagens(CHAT_COM_FERRAMENTAS);
    const ultima = messages[messages.length - 1];
    ultima.actions = [
      createButton({ label: 'Copiar', variant: 'ghost', size: 'sm', onClick: onCopy }),
      createButton({ label: 'Refazer', variant: 'ghost', size: 'sm' }),
    ];
    return createChatThread({ messages, labels: chatLabels(), size: 'lg' });
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="chat-thread"]')!;
    const actions = root.querySelector<HTMLElement>('.nds-chat-message-actions')!;
    const copiar = canvas.getByRole('button', { name: /copiar/i });

    await step('Em repouso as ações estão invisíveis — mas NO percurso do teclado', async () => {
      // A diferença que este passo guarda: `opacity: 0` esconde sem tirar da
      // ordem de foco. `display: none` ou `visibility: hidden` tirariam, e a
      // ação deixaria de existir para quem não usa ponteiro.
      await expect(getComputedStyle(actions).opacity).toBe('0');
      // A permanência no percurso do teclado é medida pelo FOCO, e não por
      // `toBeVisible`: para a testing-library, `opacity: 0` já é invisível — e
      // é justamente essa a diferença que este componente explora. O que
      // `display: none` quebraria é o foco, e é ele que se afirma.
      copiar.focus();
      await expect(copiar).toHaveFocus();
    });

    await step('Ao receber foco, elas aparecem', async () => {
      // `:focus-within` é metade da regra, não um extra: sem ele os botões
      // ficariam no Tab e invisíveis ao receber foco, que é 2.4.7 na forma mais
      // difícil de notar — quem usa mouse nunca vê o problema.
      copiar.focus();
      // O foco é afirmado ANTES da opacidade, e separado dela, para que as duas
      // causas possíveis não se confundam numa falha só: se o foco não estiver
      // no botão, quem reprova é esta linha, dizendo isso.
      await expect(copiar).toHaveFocus();
      // E a espera pela transição é de RELÓGIO, com prazo largo.
      //
      // Medido em par na mesma máquina, em 2026-09-03: com as suítes de três
      // stacks em paralelo (30 `chrome-headless-shell` de pé) o `waitFor` que
      // morava aqui estourou o prazo padrão de 1s e reprovou com
      // `expected '0' to be '1'`; o MESMO arquivo, rodado sozinho, passou. A
      // transição é de `--duration-fast` (120ms) — 1s só não basta porque com a
      // máquina saturada o recálculo de estilo não chega nesse orçamento. Não é
      // teste instável de causa desconhecida: é prazo curto demais para a carga
      // que esta suíte de fato encontra, e o conserto é o prazo.
      await esperarOpacidade(actions, '1', 6000);
    });

    await step('E acionam', async () => {
      onCopy.mockClear();
      await userEvent.click(copiar);
      await expect(onCopy).toHaveBeenCalledTimes(1);
    });
  },
};
