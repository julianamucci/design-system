import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn, userEvent, within, expect, waitFor } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { createSelect } from './select';
import { selectSource } from './select.source';
import { createSelectDocs } from '@/components/docs/SelectDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { focusMeasureRing, STATES } from '@shared/testing/select-probe';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type SelectArgs = {
  name: string;
  placeholder: string;
  disabled: boolean;
  size: 'default' | 'sm';
  labelText: string;
  onValueChange: (value: string) => void;
};

const meta: Meta<SelectArgs> = {
  title: 'UI/Select',
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(createSelectDocs), source: { transform: selectSource } },
  },
  argTypes: {
    name: {
      control: 'text',
      description: 'Nome do campo no formulário HTML.',
      table: { type: { summary: 'string' } },
    },
    placeholder: {
      control: 'text',
      description: 'Texto exibido quando nenhuma opção está selecionada.',
      table: { type: { summary: 'string' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o campo e impede a abertura da lista.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    size: {
      control: 'inline-radio',
      options: ['default', 'sm'],
      description:
        'Densidade do campo. A altura é resultado do espaçamento vertical mais a tipografia — nunca um valor cravado.',
      table: { type: { summary: '"default" | "sm"' }, defaultValue: { summary: '"default"' } },
    },
    labelText: {
      control: 'text',
      description: 'Texto do rótulo externo, que também nomeia o campo para o leitor de tela.',
      table: { type: { summary: 'string' } },
    },
    // Callback da fábrica: quem o encaminha é o `render`, e ele o encaminha
    // sempre. Um control aqui trocaria o espião por um valor da UI e esvaziaria a
    // aba Actions — documentação, não controle.
    onValueChange: {
      control: false,
      description: 'Disparado ao trocar a seleção; recebe o valor escolhido.',
      table: { type: { summary: '(value: string) => void' } },
    },
  },
  args: {
    name: 'estado',
    placeholder: 'Selecione...',
    disabled: false,
    size: 'default',
    labelText: 'Estado',
    onValueChange: fn(),
  },
};

export default meta;
type Story = StoryObj<SelectArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'functional.item4',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item4',
      'accessibility.item5',
    ],
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-sm';
    wrap.dataset.spacing = 'sm';

    const label = document.createElement('label');
    label.htmlFor = 'sel-pg';
    label.className = 'nds-text-body nds-font-semibold';
    label.textContent = args.labelText;

    const select = createSelect({
      id: 'sel-pg',
      name: args.name,
      placeholder: args.placeholder,
      disabled: args.disabled,
      size: args.size,
      'aria-label': args.labelText,
      items: [...STATES],
      onValueChange: (valor) => args.onValueChange?.(valor),
    });

    wrap.append(label, select);
    return wrap;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('combobox');

    // Cada passo estabelece a própria precondição: o painel Interactions
    // reexecuta a play no MESMO DOM, e um clique cego inverteria o resultado na
    // segunda rodada.
    const fechar = async () => {
      if (gatilho.getAttribute('aria-expanded') === 'true') {
        await userEvent.keyboard('{Escape}');
        await waitForPortalGone('listbox');
      }
    };
    // Fecha e abre: o par garante um clique REAL nesta rodada (é o que prova o
    // callback e enche a aba Actions) e ainda zera a janela da busca por
    // digitação, que dura 1s e atravessaria a fronteira entre dois passos.
    const abrir = async () => {
      await fechar();
      await userEvent.click(gatilho);
      // `waitForPortal` gateia na opacidade computada, e o papel de lista mora no
      // MESMO nó que carrega a animação de entrada — medir um filho devolveria
      // opacidade 1 no quadro zero e a espera não protegeria nada.
      return await waitForPortal('listbox');
    };

    await step('O campo é um combobox nomeado e nasce fechado', async () => {
      await expect(gatilho).toHaveAccessibleName(args.labelText);
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
      // O texto do campo NÃO é afirmado aqui: depois de uma escolha ele mostra o
      // rótulo, e nenhum replay reencontra o placeholder. Esse é o estado de
      // montagem, e ele é declarado na story `States/Default`, que não interage.
      //
      // O valor viaja por um campo escondido: é ele que a serialização nativa
      // enxerga, e sem `name` o campo não participaria do formulário.
      const hidden = canvasElement.querySelector<HTMLInputElement>(
        '[data-slot="select-hidden-input"]',
      );
      await expect(hidden?.name).toBe(args.name);
    });

    if (args.disabled) {
      await step('Desabilitado — o campo não abre', async () => {
        await expect(gatilho).toBeDisabled();
        await userEvent.click(gatilho, { pointerEventsCheck: 0 });
        await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
        await expect(within(document.body).queryAllByRole('listbox')).toHaveLength(0);
      });
      return;
    }

    await step('O campo tem anel de foco por teclado', async () => {
      // Antes de qualquer abertura: com a lista aberta o gatilho é mantido em
      // foco de propósito, então o `blur()` da medição não chega a valer e a
      // comparação sairia entre dois estados focados.
      //
      // `outline: 0` na folha é intencional — o anel é `box-shadow`. Medir a
      // MUDANÇA, e não `boxShadow !== 'none'`, é o que distingue anel de foco de
      // anel de erro, que já existe sem foco.
      await expect(focusMeasureRing(gatilho).mudou).toBe(true);
    });

    await step('Abrir mostra a lista, e a seta anda pelas opções', async () => {
      const listbox = await abrir();
      await expect(gatilho).toHaveAttribute('aria-expanded', 'true');
      // O papel de cada peça é o contrato: `combobox` no gatilho, `listbox` no
      // painel, `option` em cada linha.
      await expect(listbox).toHaveAttribute('role', 'listbox');
      await expect(gatilho).toHaveAttribute('aria-controls', listbox.id);
      const opcoes = within(listbox).getAllByRole('option');
      await expect(opcoes).toHaveLength(STATES.length);

      // O índice de partida vem MEDIDO, não suposto: reabrir a lista depois de
      // uma escolha nasce destacando a opção escolhida. O que o item do contrato
      // promete é o passo de um.
      const destacada = () =>
        within(listbox)
          .getAllByRole('option')
          .findIndex((o) => o.hasAttribute('data-highlighted'));
      const partida = destacada();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        await expect(destacada()).toBe(Math.min(partida + 1, opcoes.length - 1));
      });
      // O foco do DOM NÃO entra na lista: o gatilho continua sendo o combobox, e
      // quem aponta a opção corrente é `aria-activedescendant`.
      await expect(gatilho).toHaveFocus();
      await expect(gatilho).toHaveAttribute(
        'aria-activedescendant',
        within(listbox).getAllByRole('option')[destacada()].id,
      );
    });

    await step('Digitar a inicial salta para a opção correspondente', async () => {
      const listbox = await abrir();
      await userEvent.keyboard('m');
      const minas = within(listbox).getByRole('option', { name: 'Minas Gerais' });
      await waitFor(async () => {
        await expect(minas).toHaveAttribute('data-highlighted');
        await expect(gatilho).toHaveAttribute('aria-activedescendant', minas.id);
      });
    });

    await step('As letras se acumulam, e o que não casa não move o destaque', async () => {
      const listbox = await abrir();
      // Duas letras seguidas dentro da janela de 1s procuram "mi", e não "m" e
      // depois "i" — é o que separa a busca por digitação de um atalho de letra.
      await userEvent.keyboard('mi');
      const minas = within(listbox).getByRole('option', { name: 'Minas Gerais' });
      await waitFor(async () => {
        await expect(minas).toHaveAttribute('data-highlighted');
      });
      // Letra sem correspondente NÃO desfaz o destaque: perder a posição por um
      // toque errado obrigaria a recomeçar a leitura da lista.
      await userEvent.keyboard('z');
      await expect(minas).toHaveAttribute('data-highlighted');
      await expect(gatilho).toHaveAttribute('aria-activedescendant', minas.id);
    });

    await step('Enter escolhe a opção destacada, fecha e atualiza o campo', async () => {
      await abrir();
      await userEvent.keyboard('m');
      await userEvent.keyboard('{Enter}');
      await waitForPortalGone('listbox');
      await expect(args.onValueChange).toHaveBeenCalledWith('mg');
      // O campo fechado anuncia o RÓTULO, não o valor cru.
      await expect(gatilho).toHaveTextContent('Minas Gerais');
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
      // A opção escolhida se anuncia como tal ao reabrir.
      const listbox = await abrir();
      await expect(
        within(listbox).getByRole('option', { name: 'Minas Gerais' }),
      ).toHaveAttribute('aria-selected', 'true');
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('listbox');
    });

    await step('Escape fecha sem trocar a escolha e devolve o foco', async () => {
      await abrir();
      const callsBefore = (args.onValueChange as unknown as { mock: { calls: unknown[] } })
        .mock.calls.length;
      // O texto vem MEDIDO antes, e não cravado: o que este passo promete é que
      // Escape não mexe na escolha, qualquer que ela seja — cravar o rótulo faria
      // a asserção depender da ordem dos passos anteriores.
      const textBefore = gatilho.textContent;
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('listbox');
      await expect(
        (args.onValueChange as unknown as { mock: { calls: unknown[] } }).mock.calls.length,
      ).toBe(callsBefore);
      await expect(gatilho.textContent).toBe(textBefore);
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
      // Sem `waitFor`: a devolução do foco é síncrona, e envolvê-la mascararia
      // bug de foco real.
      await expect(gatilho).toHaveFocus();
    });

    // ── Teclado documentado, tecla por tecla ────────────────────────────────
    // A tabela de teclado do conteúdo compartilhado lista oito teclas. Encontrar
    // só `{Enter}` não cobre as setas: cada uma é verificada uma a uma, porque
    // foi assim que o Accordion documentou navegação por setas que nenhuma stack
    // implementava.

    await step('Enter, Espaço e seta para baixo abrem a lista', async () => {
      for (const tecla of ['{Enter}', ' ', '{ArrowDown}']) {
        await fechar();
        await userEvent.keyboard(tecla);
        await waitForPortal('listbox');
        await expect(gatilho, `tecla ${tecla} não abriu a lista`).toHaveAttribute(
          'aria-expanded',
          'true',
        );
      }
    });

    await step('Seta para cima, Home e End abrem já no extremo certo', async () => {
      const casos: [string, 'primeira' | 'ultima'][] = [
        ['{ArrowUp}', 'ultima'],
        ['{Home}', 'primeira'],
        ['{End}', 'ultima'],
      ];
      for (const [tecla, ponta] of casos) {
        await fechar();
        await userEvent.keyboard(tecla);
        const listbox = await waitForPortal('listbox');
        const opcoes = within(listbox).getAllByRole('option');
        const alvo = ponta === 'primeira' ? opcoes[0] : opcoes[opcoes.length - 1];
        await expect(alvo, `tecla ${tecla} não destacou a opção ${ponta}`).toHaveAttribute(
          'data-highlighted',
        );
      }
    });

    await step('Tab fecha a lista e leva o foco adiante', async () => {
      await abrir();
      await userEvent.tab();
      await waitForPortalGone('listbox');
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
      // O foco NÃO volta ao campo: quem tabula está saindo dele, e puxá-lo de
      // volta prenderia o teclado no select.
      await expect(gatilho).not.toHaveFocus();
    });

    await step('Clicar no campo aberto fecha a lista', async () => {
      // `abrir()` deixa a lista aberta; o estado desejado ao fim deste passo é
      // FECHADA, e o clique só acontece enquanto ela não está. O par garante um
      // clique real nesta rodada sem depender do que a anterior deixou no DOM.
      await abrir();
      if (gatilho.getAttribute('aria-expanded') !== 'false') await userEvent.click(gatilho);
      await waitForPortalGone('listbox');
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar fora fecha a lista sem puxar o foco de volta', async () => {
      await abrir();
      await userEvent.click(canvasElement);
      await waitForPortalGone('listbox');
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
      // O foco fica onde a pessoa o pôs: trazê-lo de volta ao campo seria
      // roubá-lo de onde ela acabou de clicar.
      await expect(gatilho).not.toHaveFocus();
    });

    await step('Digitar com a lista fechada escolhe sem abrir a lista', async () => {
      // Precondição própria: deixa o campo em Minas Gerais para que a letra
      // seguinte tenha de MUDAR o valor. Se ele já estivesse em Rio de Janeiro, a
      // busca acharia o que já está escolhido e não haveria mudança para observar.
      // Abrir e fechar também zera a janela de 1s da busca, que senão juntaria as
      // letras deste passo com as do anterior.
      await abrir();
      await userEvent.keyboard('m');
      await userEvent.keyboard('{Enter}');
      await waitForPortalGone('listbox');
      await expect(gatilho).toHaveTextContent('Minas Gerais');

      // Duas letras, para provar que a janela de acúmulo também vale com a lista
      // fechada: "ri" acha Rio de Janeiro, "r" e "i" separados não achariam.
      await userEvent.keyboard('ri');
      await expect(gatilho).toHaveTextContent('Rio de Janeiro');
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
      await expect(within(document.body).queryAllByRole('listbox')).toHaveLength(0);
    });

    await step('Sem espaço embaixo, a lista abre para cima', async () => {
      await fechar();
      const bloco = gatilho.closest<HTMLElement>('.nds-stack')!;
      const margemBefore = bloco.style.marginBlockStart;
      // A virada depende da GEOMETRIA real — nenhuma opção a força —, então o
      // passo empurra o campo para o pé da janela. O deslocamento é calculado a
      // partir da caixa medida para o campo continuar inteiro à vista: fora da
      // vista, focar o gatilho rolaria a página e desfaria a precondição.
      const caixa = gatilho.getBoundingClientRect();
      bloco.style.marginBlockStart = `${Math.max(window.innerHeight - 20 - caixa.bottom, 0)}px`;
      try {
        await userEvent.click(gatilho);
        const listbox = await waitForPortal('listbox');
        await expect(listbox).toHaveAttribute('data-side', 'top');
        // E ela fica ACIMA do campo, não em cima dele.
        await expect(listbox.getBoundingClientRect().bottom).toBeLessThanOrEqual(
          gatilho.getBoundingClientRect().top + 1,
        );
        await userEvent.keyboard('{Escape}');
        await waitForPortalGone('listbox');
      } finally {
        // Devolver a margem é obrigatório: deixá-la posta envenena a story
        // seguinte e a foto do Chromatic.
        bloco.style.marginBlockStart = margemBefore;
      }
    });
  },
};
