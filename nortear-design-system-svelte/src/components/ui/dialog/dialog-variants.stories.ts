import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, userEvent } from 'storybook/test';
import DialogStory from './DialogStory.svelte';
import DialogConfirmEmailStory from './DialogConfirmEmailStory.svelte';
import {
  dialogActionDestructiveSource,
  dialogWithFormSource,
  dialogWithScrollSource,
  dialogNoFooterSource,
  dialogCustomCloseSource,
  dialogConfirmarEmailSource,
  dialogSource,
} from './dialog.source';
import {
  open,
  cantoButtonClose,
  checkNameAndDescription,
  waitForOpen,
  waitForClosed,
} from './dialog.fixtures';

import { useTranslation } from '@/lib/i18n';
import dialogTranslations from '@shared/content/dialog/translations.json';

import { figmaDesign } from '@shared/figma/design-links';
// Todos os rótulos das composições saem do conteúdo compartilhado, como nas
// outras stacks — inclusive os próprios de cada cenário (termos, contrato,
// remoção, confirmação de e-mail, guia e painel informativo), que ganharam
// chave. Não sobra literal de cenário neste arquivo.
const { t } = useTranslation(dialogTranslations);

const meta: Meta = {
  title: 'Components/Overlay/Dialog/Variants',
  component: DialogStory,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('dialog'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; as que mudam de estrutura
      // sobrescrevem com a própria composição logo abaixo.
      source: { transform: dialogSource },
      description: {
        component:
          'Composicoes estruturais do Dialog. Não há prop `variant` no componente — cada item abaixo é um padrão de uso recorrente, e a diferença está em quais partes existem.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      description: { story: 'Title + Description + Footer com ação primária. Composição padrão.' },
    },
  },
  args: {
    open: true,
    variant: 'default',
    triggerLabel: t('demonstration.labels.triggerLabel'),
    title: t('demonstration.labels.title'),
    description: t('demonstration.labels.description'),
    actionLabel: t('demonstration.labels.action'),
    cancelLabel: t('demonstration.labels.cancel'),
  },
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('As quatro partes da composição padrão estão no painel', async () => {
      await expect(p.querySelector('[data-slot="dialog-header"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-title"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-description"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeInTheDocument();
      await checkNameAndDescription(p);
    });

    await step('A ação primária é a última do rodapé', async () => {
      // `flex-direction: column-reverse` põe a ação primária no topo da pilha
      // no estreito e à direita no largo. No DOM ela vem por último, que é a
      // ordem de leitura e de foco correta.
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const buttons = footer.querySelectorAll<HTMLElement>('button');
      await expect(buttons.length).toBe(2);
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
    docs: {
      source: { transform: dialogWithFormSource },
      description: { story: 'Body com formulário inline. Submit dispara a ação primária.' },
    },
  },
  args: {
    open: true,
    variant: 'withForm',
    triggerLabel: t('demonstration.labels.triggerLabel'),
    title: t('demonstration.labels.title'),
    description: t('demonstration.labels.description'),
    actionLabel: t('demonstration.labels.action'),
    cancelLabel: t('demonstration.labels.cancel'),
  },
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('Os campos estão rotulados e trazem o valor inicial', async () => {
      // O valor entra na asserção junto com o rótulo: era exatamente aqui que
      // um `defaultValue` inexistente na lib deixava os campos VAZIOS enquanto
      // a story dizia mostrá-los preenchidos, e nada reprovava.
      // Rótulo e valor saem das MESMAS chaves que a story monta: cravado em
      // pt-BR, o esperado reprovaria com a barra de idiomas em inglês ou
      // espanhol sem nada de errado no componente.
      const name = p.querySelector<HTMLInputElement>('#dialog-name')!;
      await expect(name).toHaveAccessibleName(t('demonstration.labels.fieldName'));
      await expect(name.value).toBe(t('demonstration.labels.samplePersonName'));

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
      // é exatamente o que passava enquanto o defeito existia.
      const form = p.querySelector<HTMLFormElement>('form')!;
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      await expect(form.contains(footer)).toBe(true);

      const submit = footer.querySelector<HTMLButtonElement>('button[type="submit"]')!;
      await expect(submit).toBeInTheDocument();
      await expect(submit.form).toBe(form);
      // O Cancelar precisa ser `type="button"`: dentro de um form o padrão do
      // HTML é `submit`, e ele submeteria antes de fechar.
      const cancelar = footer.querySelector<HTMLButtonElement>('button:not([type="submit"])')!;
      await expect(cancelar.type).toBe('button');
    });
  },
};

export const WithScrollContent: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: {
      source: { transform: dialogWithScrollSource },
      description: {
        story:
          'Body longo com rolagem própria: o painel fica parado e centralizado, e header e rodapé continuam visíveis.',
      },
    },
  },
  args: {
    open: true,
    variant: 'withScrollContent',
    triggerLabel: t('demonstration.labels.termsTitle'),
    title: t('demonstration.labels.termsTitle'),
    description: t('demonstration.labels.termsDescription'),
    actionLabel: t('demonstration.labels.accept'),
    cancelLabel: t('demonstration.labels.decline'),
  },
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('O corpo rola sozinho, com header e rodapé parados', async () => {
      // Comportamento e não nome de classe: o corpo precisa poder rolar E ter
      // conteúdo mais alto que a própria caixa. Asserção de classe morreria
      // junto com o bug se a classe sumisse.
      const body = p.querySelector<HTMLElement>('[data-slot="dialog-body"]')!;
      await expect(getComputedStyle(body).overflowY).toBe('auto');
      await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
      await expect(p.querySelector('[data-slot="dialog-header"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeInTheDocument();
    });

    await step('A região rolável é alcançável por teclado e tem nome', async () => {
      // Sem `tabindex` quem navega só por teclado não consegue rolar a caixa —
      // é a exigência que acompanha toda região com rolagem própria.
      const body = p.querySelector<HTMLElement>('[data-slot="dialog-body"]')!;
      await expect(body).toHaveAttribute('tabindex', '0');
      await expect(body).toHaveAccessibleName();
    });
  },
};

export const NoFooter: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      source: { transform: dialogNoFooterSource },
      description: { story: 'Apenas Title + Description, sem Footer. Para uso informativo.' },
    },
  },
  args: {
    open: true,
    variant: 'noFooter',
    // O título serve de GATILHO e de título, como na referência: o painel não
    // tem outra ação, e o botão que o abre nomeia o mesmo assunto.
    triggerLabel: t('demonstration.labels.aboutTitle'),
    title: t('demonstration.labels.aboutTitle'),
    description: t('demonstration.labels.aboutDescription'),
    bodyText: t('demonstration.labels.aboutBody'),
  },
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
    docs: {
      source: { transform: dialogActionDestructiveSource },
      description: {
        story:
          'Footer com ação primária destrutiva. Diferente de AlertDialog — use só quando a destrutividade é secundária ao fluxo.',
      },
    },
  },
  args: {
    open: true,
    variant: 'withDestructiveAction',
    triggerLabel: t('demonstration.labels.removeItemAction'),
    title: t('demonstration.labels.removeItemTitle'),
    description: t('demonstration.labels.removeItemDescription'),
    actionLabel: t('demonstration.labels.removeItemAction'),
    cancelLabel: t('demonstration.labels.cancel'),
  },
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('A ação primária carrega a variante destrutiva', async () => {
      // Esta asserção é a que pega o defeito real que existia aqui: as classes
      // aplicadas à ação (`bg-destructive` e companhia) não existiam no CSS, e
      // a story mostrava um botão comum dizendo ser destrutivo.
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
    docs: {
      // Override de story: o snippet do meta mostraria o X ligado e um par de
      // ações, que é o oposto do que esta composição demonstra.
      source: { transform: dialogCustomCloseSource },
      description: {
        story:
          'showCloseButton={false} no Content para ocultar o X e showCloseButton no Footer para repor a saída — o fechamento desce para o rodapé, ao lado das demais ações.',
      },
    },
  },
  args: {
    open: true,
    variant: 'customCloseInFooter',
    showCloseButton: false,
    triggerLabel: t('demonstration.labels.guideTrigger'),
    title: t('demonstration.labels.guideTitle'),
    description: t('demonstration.labels.guideDescription'),
    bodyText: t('demonstration.labels.guideBody'),
    // Secundários primeiro, PRIMÁRIA por último. O "Fechar" é o de menor
    // ênfase dos três, então abre a lista.
    footerCloseLabel: t('demonstration.labels.close'),
    cancelLabel: t('demonstration.labels.back'),
    actionLabel: t('demonstration.labels.continueAction'),
  },
  play: async ({ canvasElement, step }) => {
    const p = await waitForOpen();

    // Pelo CONTRATO de markup e não pelo texto: os rótulos saem do conteúdo
    // compartilhado, então uma consulta por /Fechar/i reprovaria com a barra de
    // idiomas em inglês ou espanhol sem nada de errado no componente. É a mesma
    // regra que o `dialog.fixtures.ts` declara no topo. A saída é o PRIMEIRO
    // botão do rodapé — a ordem que a folha exige.
    const footerButtons = (): HTMLElement[] => [
      ...p
        .querySelector<HTMLElement>('[data-slot="dialog-footer"]')!
        .querySelectorAll<HTMLElement>('button'),
    ];

    await step('Sem X no canto, o fechar mora no rodapé', async () => {
      await expect(cantoButtonClose(p)).toBeNull();
      await expect(footerButtons()[0]).toBeVisible();
      // Pelo RÓTULO, e não pelo `data-slot`: quem emite este botão agora é o
      // `showCloseButton` do rodapé, que usa o primitivo de fechamento cru — o
      // `data-slot="dialog-close"` é do wrapper, e o rodapé não o veste. O que
      // prova que este botão fecha é o passo do clique, mais abaixo.
      await expect(footerButtons()[0]).toHaveTextContent(t('demonstration.labels.close'));
    });

    await step('São três ações, e a primária é a ÚLTIMA do DOM', async () => {
      // Ordem de DOM, e não posição na tela: `.nds-dialog-footer` inverte o
      // empilhamento no estreito e alinha à direita no largo, e as duas
      // leituras saem desta mesma ordem. Conferir pixel aqui mediria a largura
      // do viewport da rodada, não a regra.
      const buttons = footerButtons();
      await expect(buttons).toHaveLength(3);
      await expect(buttons[0]).toHaveClass('nds-button-ghost');
      await expect(buttons[1]).toHaveClass('nds-button-outline');
      await expect(buttons[2]).toHaveClass('nds-button-default');
      await expect(buttons.map((b) => b.textContent?.trim())).toEqual([
        t('demonstration.labels.close'),
        t('demonstration.labels.back'),
        t('demonstration.labels.continueAction'),
      ]);
    });

    await step('E o botão do rodapé fecha o diálogo', async () => {
      await userEvent.click(footerButtons()[0]);
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
      source: { transform: dialogConfirmarEmailSource },
      description: {
        story:
          'Dialog usado para confirmar troca de email. Title nomeia a ação, Description orienta o usuário, Footer com Cancelar + Enviar link.',
      },
    },
  },
  render: () => ({
    Component: DialogConfirmEmailStory,
    props: { open: true },
  }),
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('O diálogo se anuncia com o nome e a descrição do fluxo', async () => {
      await checkNameAndDescription(p);
    });

    await step('O campo do fluxo está rotulado', async () => {
      const email = p.querySelector<HTMLInputElement>('#confirm-new-email')!;
      await expect(email).toHaveAccessibleName('Novo email');
      await expect(email.type).toBe('email');
    });

    await step('A operação é reversível, então a ação primária é neutra', async () => {
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const buttons = footer.querySelectorAll<HTMLElement>('button');
      await expect(buttons[buttons.length - 1]).toHaveClass('nds-button-default');
    });
  },
};
