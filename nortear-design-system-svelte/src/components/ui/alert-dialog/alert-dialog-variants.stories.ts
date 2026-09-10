import alertDialogTranslations from '@shared/content/alert-dialog/translations.json';
import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, waitFor } from 'storybook/test';
import { AlertDialog } from './index';
import AlertDialogStory from './AlertDialogStory.svelte';
import AlertDialogWithoutDescriptionStory from './AlertDialogWithoutDescriptionStory.svelte';
import {
  alertDialogClassNameExtraSource,
  alertDialogWithIconSource,
  alertDialogLongDescriptionSource,
  alertDialogNeutralSource,
  alertDialogNoDescriptionSource,
  alertDialogHeadingH3Source,
  alertDialogSource,
} from './alert-dialog.source';

// As oito stories abaixo NÃO são composições, e por isso não moram em
// -compositions: composição é um arranjo que resolve um caso de uso, e o que
// há aqui são as formas que um único componente assume. Destructive e Neutral
// são as duas linhas de `variants.items` do conteúdo compartilhado; WithMedia
// e WithoutDescription exercitam peças opcionais da anatomia; LongDescription,
// Responsive e ExtraClass exercitam robustez, ponto de quebra e
// extensibilidade; HeadingH3, o nível do título. A docs page é a prova: ela tem
// seção de Variantes e NÃO tem seção de Composições, nem entrada
// `nav.compositions`.
//
// A ORDEM de export é a da barra lateral, e é a mesma nas cinco stacks:
// Destructive, Neutral, WithMedia, WithoutDescription, LongDescription,
// Responsive, ExtraClass, HeadingH3.
//
// Os rótulos saem de `demonstration.labels` — o exemplo da seção Demonstração
// da docs page. WithoutDescription tem rótulos próprios ("Descartar rascunho"),
// iguais nas cinco: é o caso em que o título sozinho diz o que se perde.
//
// Lidos do bloco pt-BR DIRETO, e não por `useTranslation`: a story é fixture,
// e as plays comparam com o texto que ela renderiza. Pelo idioma corrente,
// trocar o idioma da página faria a story renderizar um texto e a play
// procurar outro.
const LABELS = alertDialogTranslations['pt-BR'].demonstration.labels;
const DESTRUCTIVE = {
  triggerVariant: 'destructive',
  triggerLabel: LABELS.triggerLabel,
  title: LABELS.title,
  description: LABELS.description,
  cancelLabel: LABELS.cancel,
  actionLabel: LABELS.action,
  tone: 'destructive',
} as const;
const NEUTRAL = {
  triggerVariant: 'outline',
  triggerLabel: LABELS.neutralTriggerLabel,
  title: LABELS.neutralTitle,
  description: LABELS.neutralDescription,
  cancelLabel: LABELS.cancel,
  actionLabel: LABELS.neutralAction,
  tone: 'default',
} as const;
const exact = (text: string) => new RegExp(`^${text}$`, 'i');

const meta: Meta = {
  title: 'Components/Overlay/AlertDialog/Variants',
  component: AlertDialog,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('alertDialog'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // Cascateia para todas as stories do arquivo; a confirmação destrutiva e o
      // layout responsivo usam a forma canônica, e as demais sobrescrevem logo
      // abaixo com a própria composição.
      source: { transform: alertDialogSource },
      description: {
        component:
          'Formas do AlertDialog: confirmação destrutiva, confirmação neutra, peças opcionais, descrição longa, layout responsivo, classe extra e nível do título.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Destructive: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      description: {
        story:
          'Action e trigger usam a variante destructive do Button. Use para ações irreversíveis.',
      },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: { open: true, ...DESTRUCTIVE },
  }),
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const dialog = await body.findByRole('alertdialog');
    // O painel entra animando (opacity 0 → 1); sem waitFor a asserção roda no
    // primeiro quadro e toBeVisible() reprova por opacity: 0.
    await waitFor(() => expect(dialog).toBeVisible());
    const action = within(dialog).getByRole('button', { name: exact(LABELS.action) });
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
    await expect(dialog).toHaveAccessibleName(exact(LABELS.title));

    // Cancel em outline é a hierarquia: uma ação destrutiva e uma saída neutra.
    const cancel = within(dialog).getByRole('button', { name: exact(LABELS.cancel) });
    await expect(cancel).toHaveClass('nds-button-outline');
  },
};

export const Neutral: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      source: { transform: alertDialogNeutralSource },
      description: {
        story:
          'Action com tokens padrão do Button. Use para confirmações não destrutivas (publicar, enviar, arquivar).',
      },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: { open: true, ...NEUTRAL },
  }),
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const dialog = await body.findByRole('alertdialog');
    // Painel e conteúdo entram animando (opacity 0 → 1); a asserção de
    // visibilidade só é válida depois que a animação termina.
    await waitFor(() => expect(dialog).toBeVisible());
    const action = within(dialog).getByRole('button', { name: exact(LABELS.neutralAction) });
    await waitFor(() => expect(action).toBeVisible());
    // O ponto da variante neutra: a confirmação NÃO herda a severidade
    // destrutiva — ela é a variante padrão do Button, e isso se confere pela
    // classe que ela TEM, não só pela que falta.
    await expect(action).toHaveClass('nds-button-default');
    await expect(action).not.toHaveClass('nds-button-destructive');

    const trigger = canvasElement.querySelector<HTMLElement>(
      '[data-slot="alert-dialog-trigger"]',
    );
    await expect(trigger).toHaveClass('nds-button-outline');
    await expect(dialog).toHaveAccessibleName(exact(LABELS.neutralTitle));
  },
};

export const WithMedia: Story = {
  parameters: {
    covers: ['visual.item6'],
    docs: {
      source: { transform: alertDialogWithIconSource },
      description: {
        story:
          'Bloco de mídia no topo do header. Com ele, a caixa do ícone centraliza no mobile e volta à esquerda a partir de 40rem; o texto do header centraliza no mobile com ou sem mídia.',
      },
    },
  },
  // Mesmo wrapper das demais formas, com a mídia ligada — é o caminho que o
  // control showMedia do Playground exercita.
  render: () => ({
    Component: AlertDialogStory,
    props: { open: true, showMedia: true, ...DESTRUCTIVE },
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('alertdialog');
    await waitFor(() => expect(dialog).toBeVisible());

    const media = dialog.querySelector('[data-slot="alert-dialog-media"]');
    await expect(media).toHaveClass('nds-alert-dialog-media');

    // a mídia precisa ser o PRIMEIRO filho do header: o leitor de tela chega ao
    // título logo em seguida (ícone → título → descrição)
    const header = dialog.querySelector('[data-slot="alert-dialog-header"]');
    await expect(header?.firstElementChild).toBe(media);
    await expect(media?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  },
};

// testes.accessibility.item8 — a descrição é opcional (anatomy.item6), e o
// caminho sem ela precisa de uma story: enquanto nenhuma omitia, a única prova
// de que o componente aguenta era a assinatura. O que se mede aqui não é a
// ausência do parágrafo — é que o painel deixa de declarar `aria-describedby`
// em vez de apontar para um id que não existe, o que o axe reprova em
// `aria-valid-attr-value` e o leitor de tela anuncia como nada.
export const WithoutDescription: Story = {
  parameters: {
    covers: ['accessibility.item8'],
    docs: {
      source: { transform: alertDialogNoDescriptionSource },
      description: {
        story:
          'Confirmação sem descrição: o título sozinho já diz o que se perde. O painel mantém o nome acessível e fica sem descrição acessível — sem referência pendurada.',
      },
    },
  },
  // Wrapper próprio: é a composição sem o subcomponente de descrição, com os
  // rótulos do caso. Ver AlertDialogWithoutDescriptionStory.svelte.
  render: () => ({ Component: AlertDialogWithoutDescriptionStory, props: { open: true } }),
  play: async ({ step }) => {
    const body = within(document.body);

    await step('O painel abre sem descrição e mantém o nome acessível', async () => {
      const dialog = await body.findByRole('alertdialog');
      await waitFor(() => expect(dialog).toBeVisible());
      await expect(
        dialog.querySelector('[data-slot="alert-dialog-description"]'),
      ).toBeNull();
      await expect(dialog).toHaveAccessibleName(/Descartar rascunho/i);
    });

    await step('Nenhum aria-describedby pendurado', async () => {
      const dialog = await body.findByRole('alertdialog');
      await expect(dialog).not.toHaveAttribute('aria-describedby');
      await expect(dialog).toHaveAccessibleDescription('');
    });

    await step('As duas saídas continuam presentes e alcançáveis', async () => {
      const dialog = await body.findByRole('alertdialog');
      const scope = within(dialog);
      await expect(scope.getByRole('button', { name: exact(LABELS.cancel) })).toBeInTheDocument();
      await expect(scope.getByRole('button', { name: /^Descartar$/i })).toBeInTheDocument();
    });
  },
};

// testes.visual.item4 — descrição longa (mais de uma linha) sem quebrar o painel.
export const LongDescription: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: { transform: alertDialogLongDescriptionSource },
      description: {
        story:
          'Descrição com duas frases completas. O painel cresce em altura e a descrição continua sendo a fonte do aria-describedby.',
      },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      open: true,
      ...DESTRUCTIVE,
      description:
        'Todos os seus dados, arquivos enviados, integrações ativas e o histórico completo de faturamento serão removidos permanentemente dos nossos servidores. Esta ação não pode ser desfeita e nenhuma cópia de segurança fica disponível depois da confirmação.',
    },
  }),
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Descrição longa continua ligada por aria-describedby', async () => {
      const dialog = await body.findByRole('alertdialog');
      const description = dialog.querySelector<HTMLElement>(
        '[data-slot="alert-dialog-description"]',
      );
      await expect(description).not.toBeNull();
      await expect(dialog).toHaveAttribute('aria-describedby', description!.id);
      await expect(dialog).toHaveAccessibleDescription(/nenhuma cópia de segurança/i);
    });

    await step('Descrição ocupa mais de uma linha sem estourar o painel', async () => {
      const dialog = await body.findByRole('alertdialog');
      const description = dialog.querySelector<HTMLElement>(
        '[data-slot="alert-dialog-description"]',
      )!;
      const lineHeight = parseFloat(getComputedStyle(description).lineHeight);
      await expect(description.getBoundingClientRect().height).toBeGreaterThan(lineHeight * 1.5);
      await expect(description.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth);
    });
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
    docs: {
      description: {
        story:
          'Abaixo de 40rem o footer empilha os botões em column-reverse e o texto do header centraliza. Acima disso os botões ficam lado a lado, alinhados à direita.',
      },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: { open: true, ...DESTRUCTIVE },
  }),
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Footer segue a ordem Cancel → Action no DOM', async () => {
      const dialog = await body.findByRole('alertdialog');
      const footer = dialog.querySelector<HTMLElement>('[data-slot="alert-dialog-footer"]');
      await expect(footer).not.toBeNull();
      await expect(footer).toHaveClass('nds-alert-dialog-footer');

      // A story fixa a viewport em 320px. Abaixo de 40rem o footer empilha em
      // column-reverse — sem medir isso, a story só DESCREVIA o responsivo.
      await expect(window.matchMedia('(min-width: 40rem)').matches).toBe(false);
      await expect(getComputedStyle(footer!).flexDirection).toBe('column-reverse');
      const labels = Array.from(footer!.querySelectorAll('button')).map((b) =>
        b.textContent?.trim(),
      );
      await expect(labels).toEqual([LABELS.cancel, LABELS.action]);
    });

    await step('Painel respeita a margem lateral em qualquer largura', async () => {
      const dialog = await body.findByRole('alertdialog');
      const rect = dialog.getBoundingClientRect();
      await expect(rect.width).toBeLessThanOrEqual(window.innerWidth);
      await expect(rect.left).toBeGreaterThanOrEqual(0);
    });
  },
};

// A extensibilidade por classe é documentada em props.extensibility, e esta é
// a story que a exercita: antes, a única prova de que a classe chega ao painel
// e ao bloco de mídia era a prosa da docs page.
export const ExtraClass: Story = {
  parameters: {
    docs: {
      source: { transform: alertDialogClassNameExtraSource },
      description: { story: 'Extensibilidade por classe: o painel recorta o conteúdo no próprio raio e o bloco de mídia deixa de encolher. É o caminho descrito em props.extensibility — o design system não expõe classe utilitária de cor, mas painel e blocos aceitam classes de layout.' },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      open: true,
      ...DESTRUCTIVE,
      showMedia: true,
      contentClass: 'nds-overflow-hidden',
      mediaClass: 'nds-shrink-0',
    },
  }),
  play: async () => {
    const dialog = await within(document.body).findByRole('alertdialog');
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
    docs: {
      source: { transform: alertDialogHeadingH3Source },
      description: {
        story:
          'O painel abre de dentro de uma página cuja seção já está em h2, então o título pede h3. Trocar a tag do cabeçalho não pode romper o aria-labelledby que dá nome ao painel.',
      },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: { open: true, titleLevel: 3, ...DESTRUCTIVE },
  }),
  play: async ({ step }) => {
    const p = await within(document.body).findByRole('alertdialog');
    await waitFor(() => expect(p).toBeVisible());

    await step('O título sai em h3 e o painel continua nomeado por ele', async () => {
      const id = p.getAttribute('aria-labelledby');
      await expect(id).toBeTruthy();
      const heading = document.getElementById(id!);
      await expect(heading).not.toBeNull();
      await expect(heading!.tagName).toBe('H3');
      // A tag e o ARIA saem do mesmo `level`: um h3 anunciado como nível 2
      // seria o cabeçalho brigando com ele mesmo.
      await expect(heading).toHaveAttribute('aria-level', '3');
      await expect(heading!.classList.contains('nds-alert-dialog-title')).toBe(true);
      await expect(p).toHaveAccessibleName(heading!.textContent!.trim());
    });
  },
};
