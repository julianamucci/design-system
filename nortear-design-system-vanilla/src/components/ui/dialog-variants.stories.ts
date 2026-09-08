import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent } from 'storybook/test';
import { createDialog } from './dialog';
import {
  dialogWithBodyScrollableSource,
  dialogWithFormSource,
  dialogSource,
  dialogSourceWith,
} from './dialog.source';
import { createButton } from './button';
import {
  t,
  open,
  mountOpen,
  cantoButtonClose,
  buildField,
  checkNameAndDescription,
  waitForOpen,
  waitForClosed,
  makeFooter,
} from './dialog.fixtures';

import { figmaDesign } from '@shared/figma/design-links';
// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/Dialog/Variants',
  parameters: {
    design: figmaDesign('dialog'),
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: dialogSource },
      description: {
        component:
          'Composicoes estruturais do Dialog. Não há prop variant — escolha a composição que melhor descreve o caso de uso.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeBody(text: string): HTMLElement {
  const body = document.createElement('div');
  body.className = 'nds-text-body nds-text-muted-foreground';
  body.textContent = text;
  return body;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: { description: { story: 'Title + Description + Footer com ação primária.' } },
  },
  render: () =>
    mountOpen(
      createDialog({
        trigger: createButton({
          variant: 'outline',
          label: t('demonstration.labels.triggerLabel'),
        }),
        title: t('demonstration.labels.title'),
        description: 'Atualize suas informações pessoais.',
        content: makeBody('Os campos estariam aqui em uma aplicação real.'),
        footer: makeFooter(t('demonstration.labels.cancel'), t('demonstration.labels.action')),
      }),
    ),
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('As quatro partes da composição padrão estão no painel', async () => {
      await expect(p.querySelector('[data-slot="dialog-header"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-body"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeInTheDocument();
      await checkNameAndDescription(p);
    });

    await step('A ação primária é a última do rodapé, e é filha direta dele', async () => {
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const buttons = footer.querySelectorAll<HTMLElement>('button');
      await expect(buttons.length).toBe(2);
      await expect(buttons[0].parentElement).toBe(footer);
      await expect(buttons[buttons.length - 1]).toHaveClass('nds-button-default');
    });

    await step('O rodapé arredonda junto com o painel', async () => {
      // RELAÇÃO, e não valor: derivar a expectativa de `--radius-card` faria a
      // asserção concordar com qualquer defeito que também saísse do token, e
      // asserção que não pode falhar foi o achado mais repetido desta campanha.
      // O rodapé rasga até a borda do painel — as margens negativas cancelam o
      // padding —, então as duas quinas de baixo são a MESMA linha. O `0.75rem`
      // cravado que morava na folha divergia do painel nas doze combinações de
      // tema × modo × largura medidas.
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const panelStyle = getComputedStyle(p);
      const footerStyle = getComputedStyle(footer);
      await expect(footerStyle.borderBottomLeftRadius).toBe(panelStyle.borderBottomLeftRadius);
      await expect(footerStyle.borderBottomRightRadius).toBe(panelStyle.borderBottomRightRadius);
    });
  },
};

export const WithForm: Story = {
  parameters: {
    covers: ['visual.item2', 'visual.item4'],
    // Override de story: o corpo deixa de ser um parágrafo e passa a ser uma
    // composição de campos — a sub-fábrica que fecha o par rótulo ↔ controle é
    // justamente o assunto aqui, e o snippet do meta a esconderia.
    docs: {
      source: {
        transform: dialogWithFormSource({
          fields: [
            { label: 'Nome', value: 'Maria Souza' },
            { label: 'E-mail', type: 'email', value: 'maria@exemplo.com' },
          ],
        }),
      },
      description: { story: 'Body com formulário inline. O submit dispara a ação primária.' },
    },
  },
  render: () => {
    const form = document.createElement('form');
    form.className = 'nds-stack';
    form.dataset.spacing = 'md';
    form.addEventListener('submit', (e) => e.preventDefault());
    form.append(
      buildField('dialog-name', t('demonstration.labels.fieldName'), 'text', 'Maria Souza'),
      buildField(
        'dialog-email',
        t('demonstration.labels.fieldEmail'),
        'email',
        'maria@exemplo.com',
      ),
    );

    // O rodapé fica DENTRO do `<form>` (PRD D10), e a primária é
    // `type: 'submit'`. Fora do formulário ela é INERTE: não submete, o Enter
    // num campo não dispara nada, e nada na tela denuncia. Por isso ele é
    // montado aqui e entra em `content`, e não pela opção `footer` da fábrica,
    // que o anexa como IRMÃO do corpo — fora do form. É a mesma forma que a
    // docs page desta stack já usa, e a que o snippet publica.
    const footerEl = document.createElement('div');
    footerEl.className = 'nds-dialog-footer';
    footerEl.dataset.slot = 'dialog-footer';
    footerEl.append(
      createButton({ variant: 'outline', label: t('demonstration.labels.cancel') }),
      createButton({ label: t('demonstration.labels.action'), type: 'submit' }),
    );
    form.appendChild(footerEl);

    return mountOpen(
      createDialog({
        trigger: createButton({
          variant: 'outline',
          label: t('demonstration.labels.triggerLabel'),
        }),
        title: t('demonstration.labels.title'),
        description: 'Atualize suas informações pessoais.',
        content: form,
      }),
    );
  },
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('Os campos estão rotulados e trazem o valor inicial', async () => {
      const name = p.querySelector<HTMLInputElement>('#dialog-name')!;
      // `toHaveAccessibleName` e não a presença do `<label>`: o que importa é o
      // par for/id ter fechado, e é isso que o leitor de tela anuncia.
      await expect(name).toHaveAccessibleName(t('demonstration.labels.fieldName'));
      await expect(name.value).toBe('Maria Souza');

      const email = p.querySelector<HTMLInputElement>('#dialog-email')!;
      await expect(email).toHaveAccessibleName(t('demonstration.labels.fieldEmail'));
      await expect(email.value).toBe('maria@exemplo.com');
    });

    await step('O foco alcança os campos por teclado, dentro do painel', async () => {
      const name = p.querySelector<HTMLInputElement>('#dialog-name')!;
      name.focus();
      await expect(document.activeElement).toBe(name);
      await userEvent.tab();
      await expect(document.activeElement).toBe(p.querySelector('#dialog-email'));
    });

    await step('A primária é submit DENTRO do form, com o rodapé junto (D10)', async () => {
      // Fora do `<form>` o `type="submit"` é botão inerte: não submete, o Enter
      // num campo não dispara nada, e nada na tela denuncia. A asserção é a
      // RELAÇÃO de contenção, e não a presença do atributo — o atributo sozinho
      // é o que passava enquanto a opção `footer` da fábrica punha o rodapé como
      // irmão do corpo.
      const form = p.querySelector<HTMLFormElement>('form')!;
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      await expect(form.contains(footer)).toBe(true);

      const submit = footer.querySelector<HTMLButtonElement>('button[type="submit"]')!;
      await expect(submit).toBeInTheDocument();
      await expect(submit.form).toBe(form);
      // A fábrica de botão nasce em `type="button"`, e é o que o Cancelar
      // precisa ser: dentro de um form o padrão do HTML seria `submit`.
      const cancelar = footer.querySelector<HTMLButtonElement>('button:not([type="submit"])')!;
      await expect(cancelar.type).toBe('button');
    });
  },
};

export const WithScrollContent: Story = {
  parameters: {
    covers: ['visual.item5'],
    // Override de story: a rolagem não é automática — vem da classe que quem
    // compõe pendura no corpo, junto do papel, do `tabindex` e do nome. É o que
    // esta composição ensina, e um corpo de parágrafo não mostraria nada disso.
    docs: {
      source: {
        transform: dialogWithBodyScrollableSource({
          triggerLabel: 'Ler termos',
          title: 'Termos de uso',
          description: 'Leia atentamente antes de aceitar.',
          actionLabel: 'Aceitar termos',
        }),
      },
      description: {
        story:
          'Body longo com rolagem própria: o painel fica parado e centralizado, e header e rodapé continuam visíveis.',
      },
    },
  },
  render: () => {
    const longBody = document.createElement('div');
    // Classe do CSS compartilhado em vez de `overflow-y-auto` (que não existe)
    // mais `style.maxHeight` inline.
    longBody.className =
      'nds-dialog-body-scroll nds-stack nds-text-body nds-text-muted-foreground';
    longBody.dataset.spacing = 'md';
    longBody.tabIndex = 0;
    // `group` e não `region`: marco aninhado num diálogo já nomeado não
    // acrescenta navegação. O nome diz O QUE rola.
    longBody.setAttribute('role', 'group');
    longBody.setAttribute('aria-label', t('demonstration.labels.termsTitle'));
    for (let i = 1; i <= 12; i++) {
      const p = document.createElement('p');
      p.textContent = `Parágrafo ${i}: termos de uso longos para garantir que o body precise rolar internamente sem expandir o painel.`;
      longBody.appendChild(p);
    }
    return mountOpen(
      createDialog({
        trigger: createButton({ variant: 'outline', label: 'Ler termos' }),
        title: t('demonstration.labels.termsTitle'),
        description: t('demonstration.labels.termsDescription'),
        content: longBody,
        footer: makeFooter(t('demonstration.labels.cancel'), 'Aceitar termos'),
      }),
    );
  },
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('O corpo rola sozinho, com header e rodapé parados', async () => {
      // Comportamento e não nome de classe: o corpo precisa poder rolar E ter
      // conteúdo mais alto que a própria caixa.
      // A factory monta o `.nds-dialog-body` em volta do conteúdo, então aqui
      // quem rola é o elemento de DENTRO — nas outras stacks a classe de
      // rolagem e o slot ficam no mesmo nó. Divergência de API da factory, não
      // de markup: por isso a sonda é o papel, e não o slot.
      const body = p.querySelector<HTMLElement>('[role="group"]')!;
      await expect(getComputedStyle(body).overflowY).toBe('auto');
      await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
      await expect(p.querySelector('[data-slot="dialog-header"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeInTheDocument();
    });

    await step('A região rolável é alcançável por teclado e tem nome', async () => {
      // Sem `tabindex` quem navega só por teclado não consegue rolar a caixa.
      const body = p.querySelector<HTMLElement>('[role="group"]')!;
      await expect(body).toHaveAttribute('tabindex', '0');
      await expect(body).toHaveAccessibleName();
    });
  },
};

export const NoFooter: Story = {
  parameters: {
    covers: ['visual.item2'],
    // Override de story: sem rodapé. O snippet do meta traz o par de ações, que
    // é exatamente o que esta composição existe para NÃO ter.
    docs: {
      source: {
        transform: dialogSourceWith({
          triggerLabel: 'Sobre este recurso',
          title: 'Sobre este recurso',
          description: 'Detalhes técnicos exibidos para fins informativos. Sem ações.',
          bodyText: 'O fechamento ocorre via X, Escape ou clique no overlay.',
          footer: [],
        }),
      },
      description: { story: 'Apenas Title + Description. Uso informativo ou pré-visualização passiva.' },
    },
  },
  render: () =>
    mountOpen(
      createDialog({
        // O cenário sai do conteúdo compartilhado — o mesmo texto que as outras
        // quatro stacks passaram a mostrar. Cravado aqui, ele ficava em
        // português para quem abre a página em inglês ou espanhol, e as demais
        // não tinham chave a que se alinhar.
        trigger: createButton({
          variant: 'outline',
          label: t('demonstration.labels.aboutTitle'),
        }),
        title: t('demonstration.labels.aboutTitle'),
        description: t('demonstration.labels.aboutDescription'),
        content: makeBody(t('demonstration.labels.aboutBody')),
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const p = await waitForOpen();

    await step('Sem rodapé, o botão X é a única saída visível', async () => {
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeNull();
      const x = cantoButtonClose(p)!;
      await expect(x).toHaveAccessibleName();
    });

    await step('E ele fecha de verdade — a story volta a abrir para a captura', async () => {
      await userEvent.click(cantoButtonClose(p)!);
      await waitForClosed();
      // O Chromatic fotografa o estado final: uma composição que termina
      // fechada capturaria só o gatilho.
      await expect(await open(canvasElement)).toBeVisible();
    });
  },
};

export const WithDestructiveAction: Story = {
  parameters: {
    covers: ['visual.item2'],
    // Override de story: a ênfase da ação primária não passa por control nenhum,
    // e o snippet do meta mostraria `default` onde a story renderiza a variante
    // destrutiva — que é o único assunto desta composição.
    docs: {
      source: {
        transform: dialogSourceWith({
          triggerLabel: 'Remover item',
          title: 'Remover item da lista?',
          description: 'O item sai desta lista, mas continua disponível na biblioteca.',
          bodyText: 'Você poderá adicioná-lo novamente a qualquer momento.',
          footer: [
            { label: 'Cancelar', variant: 'outline' },
            { label: 'Remover', variant: 'destructive' },
          ],
        }),
      },
      description: {
        story:
          'Action destrutiva no Footer. Use só quando a destrutividade é secundária ao fluxo (ex: remover item de lista). Para confirmação destrutiva primária use AlertDialog.',
      },
    },
  },
  render: () =>
    mountOpen(
      createDialog({
        trigger: createButton({
          variant: 'outline',
          label: t('demonstration.labels.removeItemAction'),
        }),
        // O título e a descrição continuam cravados: o conteúdo compartilhado
        // traz "Remover item da lista" sem interrogação e outra descrição, e
        // ligar a chave mudaria o que esta story mostra hoje.
        title: 'Remover item da lista?',
        description: 'O item sai desta lista, mas continua disponível na biblioteca.',
        content: makeBody('Você poderá adicioná-lo novamente a qualquer momento.'),
        footer: makeFooter(t('demonstration.labels.cancel'), 'Remover', true),
      }),
    ),
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('A ação primária carrega a variante destrutiva', async () => {
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const buttons = footer.querySelectorAll<HTMLElement>('button');
      await expect(buttons[buttons.length - 1]).toHaveClass('nds-button-destructive');
    });

    await step('Ainda assim é um Dialog, não um AlertDialog', async () => {
      // A destrutividade aqui é secundária ao fluxo (remover de uma lista, não
      // apagar o recurso). Confirmação irreversível pede `role="alertdialog"`,
      // foco inicial no Cancelar e Cancelar obrigatório — outro componente.
      await expect(p).toHaveAttribute('role', 'dialog');
    });
  },
};

export const CustomCloseInFooter: Story = {
  parameters: {
    covers: ['visual.item2'],
    // Override de story: sem o X do canto e com uma terceira ação no rodapé. O
    // snippet do meta mostraria o X ligado, que é o oposto do que esta
    // composição demonstra.
    docs: {
      source: {
        transform: dialogSourceWith({
          triggerLabel: 'Abrir guia',
          title: 'Próximos passos',
          description: 'Continue o fluxo ou volte ao início.',
          bodyText: 'O guia continua disponível no menu de ajuda.',
          // A ordem é a MESMA do render, e é a do sistema: secundários antes,
          // primária por último. `.nds-dialog-footer` empilha ao contrário no
          // estreito e alinha à direita no largo — das duas leituras sai a
          // primária em cima e à direita. Snippet que ensinasse o oposto da
          // story seria pior que snippet nenhum.
          footer: [
            { label: 'Fechar', variant: 'ghost' },
            { label: 'Voltar', variant: 'outline' },
            { label: 'Continuar' },
          ],
          showCloseButton: false,
        }),
      },
      description: {
        story: 'showCloseButton=false no Content; o botão de fechar passa a acompanhar as ações do Footer.',
      },
    },
  },
  render: () => {
    const footerClose = createButton({
      variant: 'ghost',
      label: t('demonstration.labels.close'),
    });
    // O botão precisa FECHAR de verdade: a factory não liga um `DialogClose`
    // sozinha e não expõe fechamento programático — só `destroy()`, que encerra
    // a instância inteira. Um "Fechar" que não fecha seria a story documentando
    // o contrário do que promete, então o clique no véu é o caminho público que
    // sobra.
    //
    // A consulta parte do PRÓPRIO botão, e não do documento: com dois diálogos
    // montados, `document.querySelector('[data-slot="dialog-overlay"]')` devolve
    // o primeiro da ordem do DOM — que pode ser o do outro. Na rota A a fábrica
    // anexa véu e painel ao `body` nessa ordem, então o véu desta instância é o
    // irmão anterior do painel que contém este botão.
    footerClose.addEventListener('click', () => {
      const panelEl = footerClose.closest<HTMLElement>('[data-slot="dialog-content"]');
      const overlayEl = panelEl?.previousElementSibling;
      if (overlayEl instanceof HTMLElement && overlayEl.dataset.slot === 'dialog-overlay') overlayEl.click();
    });

    return mountOpen(
      createDialog({
        // Cenário do conteúdo compartilhado, e não literal: é a mesma chave que
        // as outras quatro stacks passaram a ler para mostrar esta composição.
        trigger: createButton({
          variant: 'outline',
          label: t('demonstration.labels.guideTrigger'),
        }),
        title: t('demonstration.labels.guideTitle'),
        description: t('demonstration.labels.guideDescription'),
        content: makeBody(t('demonstration.labels.guideBody')),
        // Secundários primeiro, PRIMÁRIA por último. `column-reverse` no
        // estreito põe `Continuar` em cima; `row` + `justify-content: flex-end`
        // no largo a põe à direita. A mesma ordem de DOM serve às duas leituras
        // — e o "Fechar" é o mais secundário dos três, então abre a lista.
        footer: [
          footerClose,
          createButton({ variant: 'outline', label: t('demonstration.labels.back') }),
          createButton({ variant: 'default', label: t('demonstration.labels.continueAction') }),
        ],
        showCloseButton: false,
      }),
    );
  },
  play: async ({ canvasElement, step }) => {
    const p = await waitForOpen();

    await step('Sem X no canto, o fechar mora no rodapé', async () => {
      await expect(cantoButtonClose(p)).toBeNull();
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      // Pelo VALOR que a montagem usou, e não por uma expressão em português:
      // o rótulo acompanha o idioma da página, e /fechar/i não acharia o botão
      // em inglês nem em espanhol.
      await expect(
        within(footer).getByRole('button', { name: t('demonstration.labels.close') }),
      ).toBeVisible();
    });

    await step('A primária é a ÚLTIMA do rodapé, e o fechar é a primeira', async () => {
      // Ordem de DOM, e não posição na tela: `.nds-dialog-footer` inverte o
      // empilhamento no estreito e alinha à direita no largo, e as duas
      // leituras saem desta mesma ordem. Conferir pixel aqui mediria a largura
      // do viewport da rodada, não a regra.
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const buttons = [...footer.querySelectorAll<HTMLElement>('button')];
      await expect(buttons.map((b) => b.textContent?.trim())).toEqual([
        t('demonstration.labels.close'),
        t('demonstration.labels.back'),
        t('demonstration.labels.continueAction'),
      ]);
      await expect(buttons[buttons.length - 1]).toHaveClass('nds-button-default');
      await expect(buttons[0].parentElement).toBe(footer);
    });

    await step('E o botão do rodapé fecha o diálogo', async () => {
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      await userEvent.click(
        within(footer).getByRole('button', { name: t('demonstration.labels.close') }),
      );
      await waitForClosed();
      // Reabre: o Chromatic fotografa o estado final da play.
      await expect(await open(canvasElement)).toBeVisible();
    });
  },
};

// A ConfirmEmail vive AQUI, e não em -compositions, porque o conteúdo
// compartilhado a descreve em `variants.items.confirmEmail` — ao lado de
// default, withForm e das outras formas do painel. Estava em -compositions em
// quatro stacks e em -variants numa só; quem lia a documentação de uma stack
// encontrava a mesma story em outro lugar do menu.
export const ConfirmEmail: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Confirmação de envio de e-mail com mensagem informativa e ação primária neutra.',
      },
    },
  },
  render: () => {
    const body = document.createElement('div');
    body.className = 'nds-text-body nds-text-muted-foreground';
    body.textContent =
      'Vamos enviar um link para maria@exemplo.com. Confirme o endereço antes de prosseguir.';
    return mountOpen(
      createDialog({
        trigger: createButton({
          variant: 'outline',
          label: t('demonstration.labels.confirmEmailTitle'),
        }),
        title: t('demonstration.labels.confirmEmailTitle'),
        description: 'Verifique o endereço antes de enviar o link de acesso.',
        content: body,
        footer: makeFooter(
          t('demonstration.labels.cancel'),
          t('demonstration.labels.confirmEmailAction'),
        ),
      }),
    );
  },
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('O diálogo se anuncia com o nome e a descrição do fluxo', async () => {
      await checkNameAndDescription(p);
    });

    await step('O endereço confirmado aparece no corpo, não só no título', async () => {
      // O dado que a pessoa precisa conferir antes de decidir tem que estar na
      // tela — o título sozinho não diz para onde o link vai.
      const body = p.querySelector<HTMLElement>('[data-slot="dialog-body"]')!;
      await expect(body).toHaveTextContent('maria@exemplo.com');
    });

    await step('A operação é reversível, então a ação primária é neutra', async () => {
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const buttons = footer.querySelectorAll<HTMLElement>('button');
      await expect(buttons.length).toBe(2);
      await expect(buttons[buttons.length - 1]).toHaveClass('nds-button-default');
    });
  },
};
