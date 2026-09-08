import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, userEvent } from 'storybook/test';
import DialogStory from './DialogStory.svelte';
import DialogConfirmEmailStory from './DialogConfirmEmailStory.svelte';
import {
  dialogActionDestructiveSource,
  dialogWithFormSource,
  dialogWithScrollSource,
  dialogOverlayScrollSource,
  dialogNoFooterSource,
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
// remoção, confirmação de e-mail), que ganharam chave. O que sobra literal é
// só a NoFooter, que ainda não tem chave: está no relato da revisão.
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

export const WithScrollingOverlay: Story = {
  parameters: {
    covers: ['visual.item6'],
    docs: {
      // A OUTRA rota, e por isso story própria: reusar o nome da de cima é
      // exatamente como as duas circularam sob o mesmo rótulo.
      source: { transform: dialogOverlayScrollSource },
      description: {
        story:
          'Painel no fluxo do overlay, que passa a ser a área de rolagem: o cabeçalho sobe junto com o conteúdo.',
      },
    },
  },
  args: {
    open: true,
    variant: 'withScrollingOverlay',
    triggerLabel: t('demonstration.labels.contractTrigger'),
    title: t('demonstration.labels.contractTitle'),
    description: t('demonstration.labels.contractDescription'),
    actionLabel: t('demonstration.labels.accept'),
    cancelLabel: t('demonstration.labels.decline'),
  },
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('Quem rola é o overlay, e o painel está DENTRO dele', async () => {
      // Comportamento, e não nome de classe: a rota só existe se o overlay
      // tiver o que rolar, e ele só tem se o painel for filho dele. Medido
      // contra a folha compartilhada, com os dois como irmãos o `scrollHeight`
      // do overlay é igual ao `clientHeight` — a classe chega e não pinta.
      const ov = document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')!;
      await expect(ov.contains(p)).toBe(true);
      await expect(getComputedStyle(ov).overflowY).toBe('auto');
      await expect(ov.scrollHeight).toBeGreaterThan(ov.clientHeight);
    });

    await step('O painel entra no fluxo, e o cabeçalho sobe junto', async () => {
      // O que separa esta rota da outra: lá o cabeçalho fica parado. Aqui ele
      // se move com a rolagem do overlay, e é isso que a asserção mede.
      await expect(getComputedStyle(p).position).toBe('relative');
      const header = p.querySelector<HTMLElement>('[data-slot="dialog-header"]')!;
      const ov = document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')!;
      // A leitura de referência sai de uma posição de rolagem CONHECIDA, e não
      // da que a página tiver no momento. Ao abrir, o foco automático do painel
      // rola o overlay até o primeiro focável, e a story chegava aqui com ele já
      // descido: medido em 2026-09-03, `antes` valia -727,9px, descer para 120px
      // SUBIA o cabeçalho de volta para -71,9px, e a asserção — correta —
      // reprovava por uma precondição que ninguém tinha escrito. Este arquivo
      // vinha marcado como `(0 test)` nas rodadas anteriores, então o passo
      // nunca tinha sido executado.
      ov.scrollTop = 0;
      const antes = header.getBoundingClientRect().top;
      ov.scrollTop = 120;
      await expect(header.getBoundingClientRect().top).toBeLessThan(antes);
      ov.scrollTop = 0;
    });

    await step('Não há região rolável aninhada nesta rota', async () => {
      const body = p.querySelector<HTMLElement>('[data-slot="dialog-body"]')!;
      await expect(body).not.toHaveClass('nds-dialog-body-scroll');
      await expect(body).not.toHaveAttribute('tabindex');
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
    triggerLabel: 'Sobre o produto',
    title: 'Sobre este produto',
    description:
      'Plataforma de design system multi-stack mantida pela equipe de Engenharia. Atualizada continuamente.',
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
      description: {
        story:
          'showCloseButton={false} no Content para ocultar o X — o fechamento passa a ser o Cancelar do rodapé, ou Escape.',
      },
    },
  },
  args: {
    open: true,
    variant: 'default',
    showCloseButton: false,
    // O assunto desta story é a AUSÊNCIA do X no canto, não um fluxo próprio:
    // o cenário é o mesmo das demais, e sai do conteúdo compartilhado. O
    // convite que morava aqui era história só desta stack.
    triggerLabel: t('demonstration.labels.triggerLabel'),
    title: t('demonstration.labels.title'),
    description: t('demonstration.labels.description'),
    actionLabel: t('demonstration.labels.action'),
    cancelLabel: t('demonstration.labels.cancel'),
  },
  play: async ({ canvasElement, step }) => {
    const p = await waitForOpen();

    // Pelo CONTRATO de markup e não pelo texto: o rótulo do Cancelar agora sai
    // do conteúdo compartilhado, então uma consulta por /Cancelar/i reprovaria
    // com a barra de idiomas em inglês ou espanhol sem nada de errado no
    // componente. É a mesma regra que o `dialog.fixtures.ts` declara no topo. A
    // saída é o PRIMEIRO botão do rodapé — a ordem que a folha exige.
    const footerCloseButton = (): HTMLElement =>
      p
        .querySelector<HTMLElement>('[data-slot="dialog-footer"]')!
        .querySelectorAll<HTMLElement>('button')[0];

    await step('Sem X no canto, o fechar mora no rodapé', async () => {
      await expect(cantoButtonClose(p)).toBeNull();
      await expect(footerCloseButton()).toBeVisible();
      await expect(footerCloseButton()).toHaveAttribute('data-slot', 'dialog-close');
    });

    await step('E o botão do rodapé fecha o diálogo', async () => {
      await userEvent.click(footerCloseButton());
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
