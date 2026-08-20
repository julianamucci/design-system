import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, waitFor } from 'storybook/test';
import { waitForPortal } from '@/lib/wait-for-portal';
import { createAlertDialog, createAlertDialogMedia } from './alert-dialog';
import { buildDemo } from './alert-dialog.fixtures';
import { alertDialogSource, alertDialogSourceCom } from './alert-dialog.source';
import { createAlertIcon } from './alert';
import { createButton } from './button';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/AlertDialog/Compositions',
  parameters: {
    design: figmaDesign('alertDialog'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: alertDialogSource },
      description: {
        component:
          'Composicoes canônicas: confirmação destrutiva, confirmação neutra, descrição longa e layout responsivo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────
//
// O construtor da demonstração vem de `alert-dialog.fixtures.ts`. Todas as
// composições deste arquivo passam `defaultOpen: true` — é o estado que as
// capturas visuais precisam — e a variante do trigger explicitamente, porque
// aqui ela é parte do assunto (a confirmação neutra usa `outline`).

export const Destructive: Story = {
  parameters: {
    covers: ['visual.item2'],
    // Override de story: todas as composições deste arquivo nascem abertas, e
    // `defaultOpen` não passa por control nenhum aqui.
    docs: {
      source: { transform: alertDialogSourceCom({ defaultOpen: true }) },
      description: {
        story:
          'Action e trigger usam a variante destructive do Button. Use para ações irreversíveis.',
      },
    },
  },
  render: () =>
    buildDemo({
      triggerLabel: 'Excluir conta',
      triggerVariant: 'destructive',
      title: 'Excluir conta',
      description:
        'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir',
      tone: 'destructive',
      defaultOpen: true,
    }),
  play: async ({ canvasElement }) => {
    const dialog = await waitForPortal('alertdialog');
    // A entrada é animada (opacity 0 → 1): no primeiro quadro o painel já está
    // no DOM mas ainda conta como invisível. waitFor passa no primeiro tick
    // quando não há animação, então serve aos dois ambientes.
    await waitFor(() => expect(dialog).toBeVisible());
    const action = within(dialog).getByRole('button', { name: /^Excluir$/i });
    await expect(action).toHaveClass('nds-button-destructive');

    // O gatilho fica sob aria-hidden/inert com o diálogo aberto, então sai das
    // queries por role — buscamos pelo slot. Sem esta parte a story verificava
    // metade do que a própria descrição promete.
    const trigger = canvasElement.querySelector<HTMLElement>(
      '[data-slot="alert-dialog-trigger"]',
    );
    await expect(trigger).not.toBeNull();
    await expect(trigger).toHaveTextContent('Excluir conta');
    await expect(trigger).toHaveClass('nds-button-destructive');

    // O nome acessível do diálogo vem do título: sem ele o leitor anuncia
    // "diálogo" e nada mais.
    await expect(dialog).toHaveAccessibleName(/Excluir conta/i);

    // Cancel em outline é a hierarquia: uma ação destrutiva e uma saída neutra.
    const cancel = within(dialog).getByRole('button', { name: /^Cancelar$/i });
    await expect(cancel).toHaveClass('nds-button-outline');
  },
};

export const WithIcon: Story = {
  parameters: {
    covers: ['visual.item6'],
    // Override de story: o bloco de mídia É o assunto, e ele é uma sub-fábrica
    // que o snippet do meta não mostraria.
    docs: {
      source: { transform: alertDialogSourceCom({ defaultOpen: true, showMedia: true }) },
      description: {
        story:
          'Bloco de mídia no topo do header. O CSS centraliza header e texto quando ele existe.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'destructive', label: 'Excluir conta' });
    const cancelButton = createButton({ variant: 'outline', label: 'Cancelar' });
    const actionButton = createButton({ variant: 'destructive', label: 'Excluir' });

    // createAlertIcon já devolve o svg com aria-hidden; o CSS do media
    // dimensiona qualquer svg filho em 24px.
    const media = createAlertDialogMedia();
    media.appendChild(createAlertIcon('warning'));

    const dialog = createAlertDialog({
      trigger,
      title: 'Excluir conta',
      description:
        'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
      media,
      cancelButton,
      actionButton,
      defaultOpen: true,
    });
    return dialog;
  },
  play: async () => {
    const dialog = await waitForPortal('alertdialog');
    await waitFor(() => expect(dialog).toBeVisible());

    const media = dialog.querySelector('[data-slot="alert-dialog-media"]');
    await expect(media).toHaveClass('nds-alert-dialog-media');

    // a mídia precisa ser o PRIMEIRO filho do header: o leitor de tela chega ao
    // título logo em seguida, e é dessa ordem que o :has() do CSS depende
    const header = dialog.querySelector('[data-slot="alert-dialog-header"]');
    await expect(header?.firstElementChild).toBe(media);
    await expect(media?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  },
};

export const Neutral: Story = {
  parameters: {
    covers: ['visual.item3'],
    // Override de story: a confirmação neutra troca a variante dos dois botões
    // — é o oposto do que o snippet do meta mostraria.
    docs: {
      source: {
        transform: alertDialogSourceCom({
          defaultOpen: true,
          tone: 'default',
          triggerVariant: 'outline',
          triggerLabel: 'Sair da conta',
          title: 'Sair da conta',
          description: 'Você precisará entrar novamente para acessar seus dados.',
          actionLabel: 'Sair',
        }),
      },
      description: {
        story:
          'Action com tokens padrão do Button. Use para confirmações não destrutivas (publicar, enviar, arquivar).',
      },
    },
  },
  render: () =>
    buildDemo({
      triggerLabel: 'Sair da conta',
      triggerVariant: 'outline',
      title: 'Sair da conta',
      description:
        'Você precisará entrar novamente para acessar seus dados.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Sair',
      tone: 'default',
      defaultOpen: true,
    }),
  play: async () => {
    const dialog = await waitForPortal('alertdialog');
    // A entrada é animada (opacity 0 → 1): no primeiro quadro o painel já está
    // no DOM mas ainda conta como invisível.
    await waitFor(() => expect(dialog).toBeVisible());
    const action = within(dialog).getByRole('button', { name: /^Sair$/i });
    await waitFor(() => expect(action).toBeVisible());
    // Confirmação não destrutiva: a ação usa a variante default do Button.
    await expect(action).toHaveClass('nds-button-default');
  },
};

// testes.visual.item4 — descrição longa (mais de uma linha) sem quebrar o painel.
export const LongDescription: Story = {
  parameters: {
    covers: ['visual.item4'],
    // Override de story: nasce aberta, como as demais composições.
    docs: {
      source: { transform: alertDialogSourceCom({ defaultOpen: true }) },
      description: {
        story:
          'Descrição com duas frases completas. O painel cresce em altura e a descrição continua sendo a fonte do aria-describedby.',
      },
    },
  },
  render: () =>
    buildDemo({
      triggerLabel: 'Excluir conta',
      triggerVariant: 'destructive',
      title: 'Excluir conta',
      description:
        'Todos os seus dados, arquivos enviados, integrações ativas e o histórico completo de faturamento serão removidos permanentemente dos nossos servidores. Esta ação não pode ser desfeita e nenhuma cópia de segurança fica disponível depois da confirmação.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir',
      tone: 'destructive',
      defaultOpen: true,
    }),
  play: async () => {
    const dialog = await waitForPortal('alertdialog');

    const description = dialog.querySelector<HTMLElement>('[data-slot="alert-dialog-description"]');
    await expect(description).not.toBeNull();
    await expect(dialog).toHaveAttribute('aria-describedby', description!.id);
    await expect(dialog).toHaveAccessibleDescription(/nenhuma cópia de segurança/i);

    // Ocupa mais de uma linha sem estourar a largura do painel.
    const lineHeight = parseFloat(getComputedStyle(description!).lineHeight);
    await expect(description!.getBoundingClientRect().height).toBeGreaterThan(lineHeight * 1.5);
    await expect(description!.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth);
  },
};

// testes.accessibility.item8 — a descrição é opcional (`description?: string` na
// assinatura da factory, anatomy.item6 no conteúdo), e o caminho sem ela precisa
// de uma story: enquanto nenhuma omitia, os dois ramos viviam sob `v8 ignore`.
// O que se mede aqui não é a ausência do parágrafo — é que o painel deixa de
// declarar `aria-describedby` em vez de apontar para um id que não existe, o que
// o axe reprova em `aria-valid-attr-value` e o leitor de tela anuncia como nada.
export const WithoutDescription: Story = {
  parameters: {
    covers: ['accessibility.item8'],
    // Override de story: a AUSÊNCIA da descrição é o assunto — é ela que decide
    // se o painel declara `aria-describedby`.
    docs: {
      source: {
        transform: alertDialogSourceCom({
          defaultOpen: true,
          description: '',
          triggerLabel: 'Descartar rascunho',
          title: 'Descartar rascunho',
          actionLabel: 'Descartar',
        }),
      },
      description: {
        story:
          'Confirmação sem descrição: o título sozinho já diz o que se perde. O painel mantém o nome acessível e fica sem descrição acessível — sem referência pendurada.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'destructive', label: 'Descartar rascunho' });
    const cancelButton = createButton({ variant: 'outline', label: 'Cancelar' });
    const actionButton = createButton({ variant: 'destructive', label: 'Descartar' });
    // `description` fica de fora da chamada — é assim que o consumidor omite.
    return createAlertDialog({
      trigger,
      title: 'Descartar rascunho',
      cancelButton,
      actionButton,
      defaultOpen: true,
    });
  },
  play: async () => {
    const dialog = await waitForPortal('alertdialog');
    await waitFor(() => expect(dialog).toBeVisible());

    // O header fica só com o título: nenhum parágrafo vazio ocupando espaço.
    await expect(dialog.querySelector('[data-slot="alert-dialog-description"]')).toBeNull();
    await expect(dialog).toHaveAccessibleName('Descartar rascunho');

    await expect(dialog).not.toHaveAttribute('aria-describedby');
    await expect(dialog).toHaveAccessibleDescription('');

    // As duas saídas continuam presentes — omitir a descrição não mexe no rodapé.
    const escopo = within(dialog);
    await expect(escopo.getByRole('button', { name: /^Cancelar$/i })).toBeInTheDocument();
    await expect(escopo.getByRole('button', { name: /^Descartar$/i })).toBeInTheDocument();
  },
};

// testes.visual.item5 — layout responsivo. O empilhamento dos botões vem de
// `flex-direction: column-reverse` abaixo de 40rem (nds/alert-dialog.css), então
// a captura precisa acontecer numa viewport estreita: daí os viewports do
// Chromatic. A play verifica a ordem no DOM, que é o que produz o empilhamento
// (Cancel primeiro no DOM, visualmente abaixo do Action em mobile).
export const Responsive: Story = {
  globals: { viewport: { value: 'mobile1' } },
  parameters: {
    // Os dois sub-componentes que o Figma usa para simular o mobile: o eixo
    // Layout de cada um cobre o que aqui é media query.
    design: [
      figmaDesign('alertDialogHeader', 'Cabeçalho'),
      figmaDesign('alertDialogFooter', 'Rodapé'),
    ],
    covers: ['visual.item5'],
    chromatic: { viewports: [375] },
    // Override de story: nasce aberta, como as demais composições. O
    // empilhamento é media query — não há opção da fábrica para mostrar.
    docs: {
      source: { transform: alertDialogSourceCom({ defaultOpen: true }) },
      description: {
        story:
          'Abaixo de 40rem o footer empilha os botões em column-reverse e o header centraliza. Acima disso os botões ficam lado a lado, alinhados à direita.',
      },
    },
  },
  render: () =>
    buildDemo({
      triggerLabel: 'Excluir conta',
      triggerVariant: 'destructive',
      title: 'Excluir conta',
      description:
        'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir',
      tone: 'destructive',
      defaultOpen: true,
    }),
  play: async () => {
    const dialog = await waitForPortal('alertdialog');

    const footer = dialog.querySelector<HTMLElement>('[data-slot="alert-dialog-footer"]');
    await expect(footer).not.toBeNull();
    await expect(footer).toHaveClass('nds-alert-dialog-footer');

    // A story fixa a viewport em 320px. Abaixo de 40rem o footer empilha em
    // column-reverse — sem medir isso, a story só DESCREVIA o responsivo.
    await expect(window.matchMedia('(min-width: 40rem)').matches).toBe(false);
    await expect(getComputedStyle(footer!).flexDirection).toBe('column-reverse');
    const labels = Array.from(footer!.querySelectorAll('button')).map((b) =>
      b.textContent?.trim()
    );
    await expect(labels).toEqual(['Cancelar', 'Excluir']);

    // Painel respeita a margem lateral em qualquer largura.
    const rect = dialog.getBoundingClientRect();
    await expect(rect.width).toBeLessThanOrEqual(window.innerWidth);
    await expect(rect.left).toBeGreaterThanOrEqual(0);
  },
};

// A extensibilidade por classe é documentada em props.extensibility, e esta é
// a story que a exercita: antes, a única prova de que a classe chega ao painel
// e ao bloco de mídia era a prosa da docs page.
export const ExtraClass: Story = {
  parameters: {
    // Override de story: a classe extra no painel É o assunto, e ela só aparece
    // na chamada da fábrica.
    docs: {
      source: {
        transform: alertDialogSourceCom({
          defaultOpen: true,
          showMedia: true,
          class: 'nds-overflow-hidden',
        }),
      },
      description: { story: 'Extensibilidade por classe: o painel recorta o conteúdo no próprio raio e o bloco de mídia deixa de encolher. É o caminho descrito em props.extensibility — o design system não expõe classe utilitária de cor, mas painel e blocos aceitam classes de layout.' } },
  },
  render: () => {
    const trigger = createButton({ variant: 'destructive', label: 'Excluir conta' });
    const cancelButton = createButton({ variant: 'outline', label: 'Cancelar' });
    const actionButton = createButton({ variant: 'destructive', label: 'Excluir' });

    const media = createAlertDialogMedia({ className: 'nds-shrink-0' });
    media.appendChild(createAlertIcon('warning'));

    return createAlertDialog({
      trigger,
      title: 'Excluir conta',
      description:
        'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
      media,
      cancelButton,
      actionButton,
      class: 'nds-overflow-hidden',
      defaultOpen: true,
    });
  },
  play: async () => {
    const dialog = await waitForPortal('alertdialog');
    await waitFor(() => expect(dialog).toBeVisible());
    // Propriedade que o componente NÃO declara: utilities.css é importado antes
    // do CSS do componente, então classe utilitária de mesma especificidade
    // perde para a regra do painel — max-width, padding e cor não são
    // extensíveis por classe. Medido: nds-max-w-sm deixava o painel em 512px.
    await expect(getComputedStyle(dialog).overflow).toBe('hidden');
    const media = dialog.querySelector('[data-slot="alert-dialog-media"]');
    await expect(media).toHaveClass('nds-alert-dialog-media');
    await expect(getComputedStyle(media as HTMLElement).flexShrink).toBe('0');
  },
};
