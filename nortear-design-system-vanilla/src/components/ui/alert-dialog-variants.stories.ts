import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, waitFor } from 'storybook/test';
import { waitForPortal } from '@/lib/wait-for-portal';
import { createAlertDialog, createAlertDialogMedia } from './alert-dialog';
import { buildDemo } from './alert-dialog.fixtures';
import {
  alertDialogHeadingH3Source,
  alertDialogSource,
  alertDialogSourceWith,
} from './alert-dialog.source';
import { createAlertIcon } from './alert';
import { createButton } from './button';
import alertDialogTranslations from '@shared/content/alert-dialog/translations.json';

/**
 * Rótulos de exemplo: `demonstration.labels`, o mesmo conteúdo da seção
 * Demonstração da docs page. Preso a pt-BR de propósito — a story não passa por
 * i18n, e uma play que dependesse do seletor de idioma procuraria um nome
 * diferente a cada rodada. Até 2026-09-10 este arquivo cravava os valores, e
 * era o único das cinco stacks a fazer isso.
 */
const LABELS = alertDialogTranslations['pt-BR'].demonstration.labels;

/**
 * Descrição da `LongDescription`. Fica numa constante porque o painel Code tem
 * de mostrar ESTA — a transform do meta cairia na descrição curta, e o trecho
 * da story que existe para a descrição longa ensinava a curta.
 */
const LONG_DESCRIPTION =
  'Todos os seus dados, arquivos enviados, integrações ativas e o histórico completo de faturamento serão removidos permanentemente dos nossos servidores. Esta ação não pode ser desfeita e nenhuma cópia de segurança fica disponível depois da confirmação.';

// ─── Meta ─────────────────────────────────────────────────────────────────────

// As oito stories abaixo NÃO são composições, e por isso não moram mais em
// -compositions: composição é um arranjo que resolve um caso de uso, e o que
// há aqui são as formas que um único componente assume. Destructive e Neutral
// são as duas linhas de `variants.items` do conteúdo compartilhado; WithMedia
// e WithoutDescription exercitam peças opcionais da anatomia; LongDescription,
// Responsive e ExtraClass exercitam robustez, ponto de quebra e
// extensibilidade; HeadingH3, o nível do título. A ORDEM de export é essa, e é
// ela que decide a barra lateral — a mesma nas cinco stacks. A docs page é a
// prova de que não são composições: ela tem seção de Variantes e NÃO tem
// seção de Composições, nem entrada `nav.compositions`.
//
// Nenhuma transform deste arquivo imprime `defaultOpen`. Todas as stories
// nascem abertas porque é o estado que as capturas visuais precisam, e isso é
// andaime: quem copia o trecho quer o diálogo comandado pelo gatilho.
const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/AlertDialog/Variants',
  parameters: {
    design: figmaDesign('alertDialog'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: alertDialogSource },
      description: {
        component:
          'As formas do componente: confirmação destrutiva e neutra, bloco de mídia, sem descrição, descrição longa, layout responsivo, classe extra e título em outro nível.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────
//
// O construtor da demonstração vem de `alert-dialog.fixtures.ts`. Todas as
// stories deste arquivo passam `defaultOpen: true` — é o estado que as
// capturas visuais precisam — e a variante do trigger explicitamente, porque
// aqui ela é parte do assunto (a confirmação neutra usa `outline`).

export const Destructive: Story = {
  parameters: {
    covers: ['visual.item2'],
    // Sem override: a confirmação destrutiva é exatamente o trecho do meta.
    docs: {
      description: {
        story:
          'Action e trigger usam a variante destructive do Button. Use para ações irreversíveis.',
      },
    },
  },
  render: () =>
    buildDemo({
      triggerLabel: LABELS.triggerLabel,
      triggerVariant: 'destructive',
      title: LABELS.title,
      description: LABELS.description,
      cancelLabel: LABELS.cancel,
      actionLabel: LABELS.action,
      tone: 'destructive',
      defaultOpen: true,
    }),
  play: async ({ canvasElement }) => {
    const dialog = await waitForPortal('alertdialog');
    // A entrada é animada (opacity 0 → 1): no primeiro quadro o painel já está
    // no DOM mas ainda conta como invisível. waitFor passa no primeiro tick
    // quando não há animação, então serve aos dois ambientes.
    await waitFor(() => expect(dialog).toBeVisible());
    const action = within(dialog).getByRole('button', { name: LABELS.action });
    await expect(action).toHaveClass('nds-button-destructive');

    // O gatilho fica sob aria-hidden/inert com o diálogo aberto, então sai das
    // queries por role — buscamos pelo slot. Sem esta parte a story verificava
    // metade do que a própria descrição promete.
    const trigger = canvasElement.querySelector<HTMLElement>(
      '[data-slot="alert-dialog-trigger"]',
    );
    await expect(trigger).not.toBeNull();
    await expect(trigger).toHaveTextContent(LABELS.triggerLabel);
    await expect(trigger).toHaveClass('nds-button-destructive');

    // O nome acessível do diálogo vem do título: sem ele o leitor anuncia
    // "diálogo" e nada mais.
    await expect(dialog).toHaveAccessibleName(LABELS.title);

    // Cancel em outline é a hierarquia: uma ação destrutiva e uma saída neutra.
    const cancel = within(dialog).getByRole('button', { name: LABELS.cancel });
    await expect(cancel).toHaveClass('nds-button-outline');
  },
};

export const Neutral: Story = {
  parameters: {
    covers: ['visual.item3'],
    // Override de story: a confirmação neutra troca a variante dos dois botões
    // — é o oposto do que o snippet do meta mostraria.
    docs: {
      source: {
        transform: alertDialogSourceWith({
          tone: 'default',
          triggerVariant: 'outline',
          triggerLabel: LABELS.neutralTriggerLabel,
          title: LABELS.neutralTitle,
          description: LABELS.neutralDescription,
          actionLabel: LABELS.neutralAction,
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
      triggerLabel: LABELS.neutralTriggerLabel,
      triggerVariant: 'outline',
      title: LABELS.neutralTitle,
      description: LABELS.neutralDescription,
      cancelLabel: LABELS.cancel,
      actionLabel: LABELS.neutralAction,
      tone: 'default',
      defaultOpen: true,
    }),
  play: async ({ canvasElement }) => {
    const dialog = await waitForPortal('alertdialog');
    // A entrada é animada (opacity 0 → 1): no primeiro quadro o painel já está
    // no DOM mas ainda conta como invisível.
    await waitFor(() => expect(dialog).toBeVisible());
    const action = within(dialog).getByRole('button', { name: LABELS.neutralAction });
    await waitFor(() => expect(action).toBeVisible());
    // Confirmação não destrutiva: a ação usa a variante default do Button.
    await expect(action).toHaveClass('nds-button-default');

    // O gatilho da confirmação neutra é outline — metade do que a descrição
    // promete, e a metade que a Destructive também confere no dela. Fica sob o
    // diálogo aberto, então a busca é pelo slot, não por role.
    const trigger = canvasElement.querySelector<HTMLElement>(
      '[data-slot="alert-dialog-trigger"]',
    );
    await expect(trigger).not.toBeNull();
    await expect(trigger).toHaveTextContent(LABELS.neutralTriggerLabel);
    await expect(trigger).toHaveClass('nds-button-outline');

    // O nome acessível do painel vem do título.
    await expect(dialog).toHaveAccessibleName(LABELS.neutralTitle);

    // Cancelar continua outline: a saída neutra não muda com o tom da ação.
    const cancel = within(dialog).getByRole('button', { name: LABELS.cancel });
    await expect(cancel).toHaveClass('nds-button-outline');
  },
};

export const WithMedia: Story = {
  parameters: {
    covers: ['visual.item6'],
    // Override de story: o bloco de mídia é o assunto, e ele é uma sub-fábrica
    // que o snippet do meta não mostraria.
    docs: {
      source: { transform: alertDialogSourceWith({ showMedia: true }) },
      description: {
        story:
          'Bloco de mídia no topo do header. Abaixo de 40rem a caixa do ícone centraliza, acompanhando o texto do cabeçalho; a partir de 40rem vai à esquerda.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'destructive', label: LABELS.triggerLabel });
    const cancelButton = createButton({ variant: 'outline', label: LABELS.cancel });
    const actionButton = createButton({ variant: 'destructive', label: LABELS.action });

    // createAlertIcon já devolve o svg com aria-hidden; o CSS do media
    // dimensiona qualquer svg filho em 24px.
    const media = createAlertDialogMedia();
    media.appendChild(createAlertIcon('warning'));

    return createAlertDialog({
      trigger,
      title: LABELS.title,
      description: LABELS.description,
      media,
      cancelButton,
      actionButton,
      defaultOpen: true,
    });
  },
  play: async () => {
    const dialog = await waitForPortal('alertdialog');
    await waitFor(() => expect(dialog).toBeVisible());

    const media = dialog.querySelector('[data-slot="alert-dialog-media"]');
    await expect(media).toHaveClass('nds-alert-dialog-media');

    // A mídia precisa ser o PRIMEIRO filho do header: é dessa ordem que sai a
    // leitura ícone → título → descrição. O :has() da folha não depende dela —
    // só centraliza a caixa do ícone no mobile.
    const header = dialog.querySelector('[data-slot="alert-dialog-header"]');
    await expect(header?.firstElementChild).toBe(media);
    await expect(media?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
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
        transform: alertDialogSourceWith({
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
    const cancelButton = createButton({ variant: 'outline', label: LABELS.cancel });
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
    await expect(escopo.getByRole('button', { name: LABELS.cancel })).toBeInTheDocument();
    await expect(escopo.getByRole('button', { name: 'Descartar' })).toBeInTheDocument();
  },
};

// testes.visual.item4 — descrição longa (mais de uma linha) sem quebrar o painel.
export const LongDescription: Story = {
  parameters: {
    covers: ['visual.item4'],
    // Override de story: a descrição longa É o assunto. Sem ela o painel Code
    // caía na transform do meta e mostrava a descrição curta.
    docs: {
      source: { transform: alertDialogSourceWith({ description: LONG_DESCRIPTION }) },
      description: {
        story:
          'Descrição com duas frases completas. O painel cresce em altura e a descrição continua sendo a fonte do aria-describedby.',
      },
    },
  },
  render: () =>
    buildDemo({
      triggerLabel: LABELS.triggerLabel,
      triggerVariant: 'destructive',
      title: LABELS.title,
      description: LONG_DESCRIPTION,
      cancelLabel: LABELS.cancel,
      actionLabel: LABELS.action,
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
    // Sem override: o empilhamento é media query — não há opção da fábrica
    // para mostrar, e o trecho é o do meta.
    docs: {
      description: {
        story:
          'Abaixo de 40rem o footer empilha os botões em column-reverse e o texto do cabeçalho centraliza. Acima disso os botões ficam lado a lado, alinhados à direita.',
      },
    },
  },
  render: () =>
    buildDemo({
      triggerLabel: LABELS.triggerLabel,
      triggerVariant: 'destructive',
      title: LABELS.title,
      description: LABELS.description,
      cancelLabel: LABELS.cancel,
      actionLabel: LABELS.action,
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
    await expect(labels).toEqual([LABELS.cancel, LABELS.action]);

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
    // Override de story: as classes extras são o assunto, e elas só aparecem
    // nas chamadas das fábricas — a do painel e a da caixa de mídia.
    docs: {
      source: {
        transform: alertDialogSourceWith({
          showMedia: true,
          mediaClass: 'nds-shrink-0',
          class: 'nds-overflow-hidden',
        }),
      },
      description: { story: 'Extensibilidade por classe: o painel recorta o conteúdo no próprio raio e o bloco de mídia deixa de encolher. É o caminho descrito em props.extensibility — o design system não expõe classe utilitária de cor, mas painel e blocos aceitam classes de layout.' } },
  },
  render: () => {
    const trigger = createButton({ variant: 'destructive', label: LABELS.triggerLabel });
    const cancelButton = createButton({ variant: 'outline', label: LABELS.cancel });
    const actionButton = createButton({ variant: 'destructive', label: LABELS.action });

    const media = createAlertDialogMedia({ class: 'nds-shrink-0' });
    media.appendChild(createAlertIcon('warning'));

    return createAlertDialog({
      trigger,
      title: LABELS.title,
      description: LABELS.description,
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

export const HeadingH3: Story = {
  parameters: {
    covers: ['accessibility.item2', 'accessibility.item9'],
    // Override de story: o nível do título não passa por control nenhum, e o
    // snippet do meta mostraria a composição no nível padrão — que é justamente
    // o que esta story existe para NÃO ter.
    docs: {
      source: { transform: alertDialogHeadingH3Source },
      description: {
        story:
          'Aberto de dentro de uma página cuja seção já está em h2, o painel pede o título em h3 para não pular nível. Trocar a tag não pode romper o aria-labelledby: o nome acessível continua saindo do mesmo elemento.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'destructive', label: LABELS.triggerLabel });
    const cancelButton = createButton({ variant: 'outline', label: LABELS.cancel });
    const actionButton = createButton({ variant: 'destructive', label: LABELS.action });

    // A fábrica é chamada direto, e não pelo `buildDemo`: o construtor da
    // demonstração serve a três arquivos e não carrega o nível do título, que é
    // o único assunto desta story.
    return createAlertDialog({
      trigger,
      title: LABELS.title,
      titleLevel: 3,
      description: LABELS.description,
      cancelButton,
      actionButton,
      defaultOpen: true,
    });
  },
  play: async ({ step }) => {
    const p = await waitForPortal('alertdialog');

    await step('O título vira h3 sem soltar o vínculo do nome acessível', async () => {
      const id = p.getAttribute('aria-labelledby');
      await expect(id).toBeTruthy();
      const heading = document.getElementById(id!);
      await expect(heading).not.toBeNull();
      await expect(heading!.tagName).toBe('H3');
      await expect(heading!.classList.contains('nds-alert-dialog-title')).toBe(true);
      await expect(p).toHaveAccessibleName(heading!.textContent!.trim());
    });
  },
};
