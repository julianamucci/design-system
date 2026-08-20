import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createCarousel } from '@/components/ui/carousel';
import { createCard, createCardContent } from '@/components/ui/card';
import { slidesDeExemplo } from '@/components/ui/carousel.fixtures';
import uiTranslations from '@/i18n/ui.json';
import carouselTranslations from '@shared/content/carousel/translations.json';

import {
  createDocsHeader,
  createDocsDemonstration,
  createDocsAnatomy,
  createDocsWhenToUse,
  createDocsDoDont,
  createDocsImport,
  createDocsCompositions,
  createDocsStates,
  createDocsProps,
  createDocsTokens,
  createDocsAccessibility,
  createDocsRelated,
  createDocsNotes,
  createDocsAnalytics,
  createDocsTestes,
  createDocsPageLayout,
} from '@/components/docs/shared/sections';
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.values(
    (carouselTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}
const { t, subscribe } = createTranslation(carouselTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

// ─── Slide builders ───────────────────────────────────────────────────────────

/**
 * O MESMO slide que as stories montam.
 *
 * A docs page DEMONSTRA o componente, e a story é a referência de uso — quando
 * as duas divergem, quem lê a página aprende um exemplo que o Chromatic não
 * fotografa e que ninguém testa. Aqui a proporção e o corpo da letra estavam
 * cravados em `style` inline, contra classes na story: inline vence a folha,
 * então este slide estava FORA do tema, da densidade e da escala tipográfica —
 * e 1.875rem cravado não acompanha a preferência de fonte de quem lê (WCAG
 * 1.4.4). A story já estava certa; era esta página que precisava alcançá-la.
 */

function buildCarouselPreview(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-w-full nds-max-w-md';
  const total = 5;
  // aria-label distinto por instância (landmark-unique): usa a string que já
  // intitula visivelmente o bloco onde o preview aparece.
  const carousel = createCarousel({
    items: slidesDeExemplo(total),
    // A navegação vem por setas, teclado ou gesto de arrastar, e a origem chega
    // aqui para virar o `trigger` do evento medido.
    onIndexChange: (index, source) => {
      // 'init' é o posicionamento inicial (não é interação); autoplay não é
      // navegação do usuário — nenhum dos dois vira evento.
      if (source === 'init' || source === 'autoplay') return;
      track('slide_change', {
        component: 'carousel',
        index,
        total,
        trigger: source,
        location: 'docs_demo',
      });
    },
  });
  carousel.setAttribute('aria-label', t('demonstration.title'));
  wrap.appendChild(carousel);
  return wrap;
}

// ─── createCarouselDocs ───────────────────────────────────────────────────────

export function createCarouselDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'carousel',
    });
    track('docs_page_view', {
      component_name: 'carousel',
      locale,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());
  cleanups.push(
    subscribe(() => {
      cleanupSeo();
      cleanupSeo = updateSeo();
    }),
  );

  // ── Nav groups ───────────────────────────────────────────────────────────

  const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
    {
      labelKey: 'nav.overview',
      sections: [
        { id: 'demonstracao', labelKey: 'nav.demonstration' },
        { id: 'anatomia', labelKey: 'nav.anatomy' },
        { id: 'quando-usar', labelKey: 'nav.usage' },
        { id: 'do-dont', labelKey: 'nav.doDont' },
      ],
    },
    {
      labelKey: 'nav.techRef',
      sections: [
        { id: 'importacao', labelKey: 'nav.import' },
        { id: 'variantes', labelKey: 'nav.variants' },
        { id: 'composicoes', labelKey: 'nav.compositions' },
        { id: 'estados', labelKey: 'nav.states' },
        { id: 'propriedades', labelKey: 'nav.props' },
        { id: 'tokens', labelKey: 'nav.tokens' },
      ],
    },
    {
      labelKey: 'nav.context',
      sections: [
        { id: 'acessibilidade', labelKey: 'nav.accessibility' },
        { id: 'relacionados', labelKey: 'nav.related' },
        { id: 'notas', labelKey: 'nav.notes' },
      ],
    },
    {
      labelKey: 'nav.quality',
      sections: [
        { id: 'analytics', labelKey: 'nav.analytics' },
        { id: 'testes', labelKey: 'nav.testes' },
      ],
    },
  ];

  function buildNavGroups() {
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  }

  const pageLayout = createDocsPageLayout({ navGroups: buildNavGroups(), componentSlug: 'carousel' });
  const root = pageLayout.root;
  const headerSlot = pageLayout.headerSlot;
  const main = pageLayout.main;

  function renderHeader() {
    const header = createDocsHeader({
      title: t('title'),
      description: t('description'),
      category: t('category'),
      type: t('type'),
    });
    headerSlot.replaceChildren(header);
  }

  function buildSidebar() {
    pageLayout.rebuildNav(buildNavGroups());
  }

  function updateActiveNav(activeId: string) {
    pageLayout.setActiveSection(activeId);
  }

  // ── Sections (rebuilt on locale change) ───────────────────────────────────

  const sectionOrder = [
    'demonstracao',
    'anatomia',
    'quando-usar',
    'do-dont',
    'importacao',
    'variantes',
    'composicoes',
    'estados',
    'propriedades',
    'tokens',
    'acessibilidade',
    'relacionados',
    'notas',
    'analytics',
    'testes',
  ] as const;
  type SectionId = (typeof sectionOrder)[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          demoFactory: () => buildCarouselPreview(),
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [t('anatomy.item1'), t('anatomy.item2'), t('anatomy.item3'), t('anatomy.item4')],
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4].map((i) => t(`usage.guidelines.item${i}`)),
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario: t('usage.scenarios.cols.scenario'),
              use: t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: [1, 2, 3, 4, 5, 6].map((i) => ({
              s: t(`usage.scenarios.item${i}.s`),
              u: t(`usage.scenarios.item${i}.u`),
              a: t(`usage.scenarios.item${i}.a`),
            })),
          },
          uxWriting: {
            title: t('usage.uxWriting.title'),
            cols: {
              element: t('usage.uxWriting.table.element'),
              rules: t('usage.uxWriting.table.rules'),
              do: t('usage.uxWriting.table.correct'),
              dont: t('usage.uxWriting.table.avoid'),
            },
            items: ['previous', 'next', 'dots', 'caption'].map((key) => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: t(`usage.uxWriting.table.${key}.format`),
              do: t(`usage.uxWriting.table.${key}.good`),
              dont: t(`usage.uxWriting.table.${key}.bad`),
            })),
          },
          do: {
            title: t('usage.do.title'),
            items: [1, 2, 3, 4].map((i) => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1, 2, 3, 4].map((i) => t(`usage.dont.item${i}`)),
          },
        });

      case 'do-dont':
        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: stripHtml(t('doDont.pair1.do')),
              dontCaption: stripHtml(t('doDont.pair1.dont')),
              doPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-w-full nds-max-w-sm';
                const carousel = createCarousel({ items: slidesDeExemplo(3) });
                carousel.setAttribute('aria-label', stripHtml(t('doDont.pair1.do')));
                wrap.appendChild(carousel);
                return wrap;
              },
              dontPreviewFactory: () => {
                // Don't: carrossel sem botões de navegação (apenas um slide visível).
                const wrap = document.createElement('div');
                wrap.className = 'nds-w-full nds-max-w-sm';
                const fake = createCard({
                  className: 'nds-w-full nds-cluster nds-aspect-16-9 nds-bg-muted-soft nds-overflow-hidden',
                });
                fake.dataset.justify = 'center';
                fake.dataset.align = 'center';
                const content = createCardContent({ className: 'nds-cluster' });
                content.dataset.justify = 'center';
                content.dataset.align = 'center';
                const span = document.createElement('span');
                span.className = 'nds-text-h2 nds-font-semibold nds-text-foreground';
                span.textContent = 'Slide 1';
                content.appendChild(span);
                fake.appendChild(content);
                wrap.appendChild(fake);
                return wrap;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: stripHtml(t('doDont.pair2.do')),
              dontCaption: stripHtml(t('doDont.pair2.dont')),
              doPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-w-full nds-max-w-sm';
                const carousel =
                  createCarousel({ items: slidesDeExemplo(3), autoplay: true, autoplayInterval: 3500 });
                carousel.setAttribute('aria-label', stripHtml(t('doDont.pair2.do')));
                wrap.appendChild(carousel);
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-w-full nds-max-w-sm';
                const carousel =
                  createCarousel({ items: slidesDeExemplo(3), autoplay: true, autoplayInterval: 800 });
                carousel.setAttribute('aria-label', stripHtml(t('doDont.pair2.dont')));
                wrap.appendChild(carousel);
                return wrap;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import { createCarousel } from '@/components/ui/carousel';`,
          secondaryDescription: t('import.withPlugin'),
          secondaryCode: `// Autoplay embutido via options
const el = createCarousel({
  items: slides,
  autoplay: true,
  autoplayInterval: 3000,
});`,
        });

      case 'variantes': {
        const codeHorizontal = `const el = createCarousel({
  items: [slide1, slide2, slide3, slide4, slide5],
});`;

        const codeVertical = `// A implementação Nortear usa orientação horizontal.
// Para slides verticais, envolva cada item em um container de altura fixa
// e use translateY customizado ou uma extensão do componente.
const el = createCarousel({ items: slides });`;

        const codeSingle = `// Cada CarouselItem ocupa 100% do viewport (basis-full).
const el = createCarousel({ items: slidesDeExemplo(4) });`;

        const codeMulti = `// Multi-item: aplique largura reduzida no slide para exibir 2+ por vez.
items.forEach((i) => i.classList.add('basis-1/2'));
const el = createCarousel({ items });`;

        const buildAutoplayPreview = (): HTMLElement => {
          const wrap = document.createElement('div');
          wrap.className = 'nds-w-full nds-max-w-md';
          const carousel = createCarousel({
            items: slidesDeExemplo(4, { prefixo: stripHtml(t('demonstration.labels.slide')) }),
            autoplay: true,
            autoplayInterval: 4000,
          });
          carousel.setAttribute('aria-label', stripHtml(t('variants.items.autoplay.name')));
          wrap.appendChild(carousel);
          return wrap;
        };

        const codeAutoplay = `// Autoplay com pausa no hover
const carousel = createCarousel({
  items: slidesDeExemplo(4),
  autoplay: true,
  autoplayInterval: 4000,
});
// Pausa automática ao mouseenter (built-in da factory).`;

        return createDocsCompositions({
          id: 'variantes',
          title: t('variants.visualTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'carousel',
          items: [
            {
              name: 'horizontal',
              description: stripHtml(t('variants.items.horizontal')),
              code: codeHorizontal,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-w-full nds-max-w-md';
                const carousel = createCarousel({ items: slidesDeExemplo(5) });
                carousel.setAttribute('aria-label', 'horizontal');
                wrap.appendChild(carousel);
                return wrap;
              },
            },
            {
              name: 'vertical',
              description: stripHtml(t('variants.items.vertical')),
              code: codeVertical,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-w-full nds-max-w-md';
                const carousel = createCarousel({ items: slidesDeExemplo(4) });
                carousel.setAttribute('aria-label', 'vertical');
                wrap.appendChild(carousel);
                return wrap;
              },
            },
            {
              name: 'single',
              description: stripHtml(t('variants.items.single')),
              code: codeSingle,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-w-full nds-max-w-md';
                const carousel = createCarousel({ items: slidesDeExemplo(4) });
                carousel.setAttribute('aria-label', 'single');
                wrap.appendChild(carousel);
                return wrap;
              },
            },
            {
              name: 'multi',
              description: stripHtml(t('variants.items.multi')),
              code: codeMulti,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-w-full nds-max-w-md';
                const carousel = createCarousel({ items: slidesDeExemplo(5) });
                carousel.setAttribute('aria-label', 'multi');
                wrap.appendChild(carousel);
                return wrap;
              },
            },
            {
              name: stripHtml(t('variants.items.autoplay.name')),
              description: stripHtml(t('variants.items.autoplay.description')),
              useWhen: stripHtml(t('variants.items.autoplay.use')),
              trackId: 'autoplay',
              code: codeAutoplay,
              previewFactory: buildAutoplayPreview,
            },
          ],
        });
      }

      case 'composicoes': {
        // Dots preview builder
        const buildDotsPreview = (): HTMLElement => {
          const total = 5;
          const wrap = document.createElement('div');
          wrap.className = 'nds-w-full nds-max-w-md nds-stack';
          wrap.dataset.spacing = 'sm';

          const dotsRow = document.createElement('div');
          dotsRow.className = 'nds-cluster';
          dotsRow.dataset.spacing = 'sm';
          dotsRow.dataset.justify = 'center';

          // Toda a forma sai de `.nds-carousel-dot`: o atual vira pílula com o
          // rótulo à vista, os demais continuam pontos, e o alvo tem piso de
          // 24px nos dois estados. O ponto desenhado à mão com 8px de lado, que
          // estava aqui, reprova no `target-size` (WCAG 2.5.8) — e as classes
          // `bg-primary`/`bg-muted-foreground/30` que ele alternava nem existem
          // mais no vocabulário `.nds-*`: eram inertes desde a migração.
          const dots: HTMLButtonElement[] = [];
          const goToLabel = stripHtml(t('demonstration.labels.goToSlide'));
          const ofLabel = stripHtml(t('demonstration.labels.of'));
          const slideLabel = stripHtml(t('demonstration.labels.slide'));
          for (let i = 0; i < total; i++) {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'nds-carousel-dot';
            dot.setAttribute('aria-label', `${goToLabel} ${i + 1} ${ofLabel} ${total}`);
            const rotulo = document.createElement('span');
            rotulo.className = 'nds-carousel-dot-label';
            rotulo.textContent = `${slideLabel} ${i + 1}`;
            dot.appendChild(rotulo);
            dots.push(dot);
            dotsRow.appendChild(dot);
          }

          // `aria-current` SOME no inativo em vez de virar "false": a string
          // "false" casaria com o seletor de presença.
          const marcarAtual = (index: number) =>
            dots.forEach((d, i) => {
              if (i === index) d.setAttribute('aria-current', 'true');
              else d.removeAttribute('aria-current');
            });

          const carousel = createCarousel({
            items: slidesDeExemplo(total, { prefixo: slideLabel }),
            onIndexChange: (index) => marcarAtual(index),
          });

          carousel.setAttribute('aria-label', stripHtml(t('variants.compositions.withDots.name')));

          marcarAtual(0);

          wrap.append(carousel, dotsRow);
          return wrap;
        };

        // Gallery preview builder
        const buildGalleryPreview = (): HTMLElement => {
          const wrap = document.createElement('div');
          wrap.className = 'nds-w-full nds-max-w-md';

          const photos = [
            { title: 'Foto 1', description: 'Paisagem ao amanhecer' },
            { title: 'Foto 2', description: 'Detalhe arquitetônico' },
            { title: 'Foto 3', description: 'Cidade à noite' },
            { title: 'Foto 4', description: 'Praia vista do alto' },
          ];

          const items = photos.map((photo) => {
            const card = createCard({ className: 'nds-w-full nds-overflow-hidden' });

            const cover = document.createElement('div');
            cover.className = 'nds-w-full nds-cluster nds-aspect-16-9 nds-bg-muted-soft';
            cover.dataset.justify = 'center';
            cover.dataset.align = 'center';
            const coverLabel = document.createElement('span');
            coverLabel.className = 'nds-text-h3 nds-font-semibold nds-text-foreground';
            coverLabel.textContent = photo.title;
            cover.appendChild(coverLabel);

            const body = document.createElement('div');
            body.className = 'nds-p-4';
            const heading = document.createElement('h3');
            heading.className = 'nds-text-body nds-font-semibold';
            heading.textContent = photo.title;
            const desc = document.createElement('p');
            desc.className = 'nds-text-caption nds-text-muted-foreground';
            desc.textContent = photo.description;
            body.append(heading, desc);

            card.append(cover, body);
            return card;
          });

          const carousel = createCarousel({ items });
          carousel.setAttribute('aria-label', stripHtml(t('variants.compositions.gallery.name')));
          wrap.appendChild(carousel);
          return wrap;
        };

        const codeWithDots = `// Paginação controlada via onIndexChange. A forma sai toda de
// .nds-carousel-dot: o atual vira pílula rotulada, os demais são pontos.
const total = 5;
const dotsRow = document.createElement('div');
dotsRow.className = 'nds-cluster';
dotsRow.dataset.spacing = 'sm';
dotsRow.dataset.justify = 'center';

const dots = Array.from({ length: total }, (_, i) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.className = 'nds-carousel-dot';
  dot.setAttribute('aria-label', \`Ir para o slide \${i + 1} de \${total}\`);
  const rotulo = document.createElement('span');
  rotulo.className = 'nds-carousel-dot-label';
  rotulo.textContent = \`Slide \${i + 1}\`;
  dot.appendChild(rotulo);
  dotsRow.appendChild(dot);
  return dot;
});

const carousel = createCarousel({
  items: slidesDeExemplo(total),
  onIndexChange: (index) => {
    dots.forEach((d, i) => {
      // O inativo NÃO carrega o atributo: "false" casaria com [aria-current].
      if (i === index) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
  },
});`;

        const codeGallery = `// Galeria com capa + título + descrição
const items = photos.map((photo) => {
  const card = createCard({ className: 'nds-w-full nds-overflow-hidden' });

  const cover = document.createElement('div');
  cover.className = 'nds-w-full nds-aspect-16-9 nds-bg-muted-soft';
  card.appendChild(cover);

  const header = createCardHeader();
  header.appendChild(createCardTitle({ text: photo.title, level: 3 }));
  header.appendChild(createCardDescription({ text: photo.description }));
  card.appendChild(header);

  return card;
});

const carousel = createCarousel({ items });`;

        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'carousel',
          items: [
            {
              name: stripHtml(t('variants.compositions.withDots.name')),
              description: stripHtml(t('variants.compositions.withDots.description')),
              useWhen: stripHtml(t('variants.compositions.withDots.use')),
              code: codeWithDots,
              previewFactory: buildDotsPreview,
            },
            {
              name: stripHtml(t('variants.compositions.gallery.name')),
              description: stripHtml(t('variants.compositions.gallery.description')),
              useWhen: stripHtml(t('variants.compositions.gallery.use')),
              code: codeGallery,
              previewFactory: buildGalleryPreview,
            },
          ],
        });
      }

      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: t('states.cols.state'),
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          items: ['single', 'multi', 'autoplay', 'vertical', 'disabled'].map((key) => ({
            label: t(`states.${key}.label`),
            trigger: toPlainText(t(`states.${key}.trigger`)),
            behavior: toPlainText(t(`states.${key}.behavior`)),
          })),
        });

      case 'propriedades': {
        const interfaceCode = `// createCarousel(options)
export type CarouselOptions = {
  /** Slides renderizados no viewport. */
  items: HTMLElement[];
  /** Avanço automático entre slides. */
  autoplay?: boolean;
  /** Intervalo em milissegundos entre avanços automáticos. */
  autoplayInterval?: number;
  /** Callback disparado a cada mudança de slide, com a origem da navegação. */
  onIndexChange?: (index: number, source: CarouselNavSource) => void;
  /** Classes CSS adicionais aplicadas ao container. */
  class?: string;
  /** Classes aplicadas a cada slide — é por aqui que passa a base fracionária. */
  slideClass?: string;
};`;

        const propsCols = {
          prop: t('props.table.prop'),
          type: t('props.table.type'),
          default: t('props.table.default'),
          required: t('props.table.required'),
          description: t('props.table.description'),
        };

        return createDocsProps({
          title: t('props.title'),
          tables: [
            {
              title: t('props.carouselTitle'),
              cols: propsCols,
              items: [
                {
                  name: 'items',
                  type: 'HTMLElement[]',
                  defaultValue: '—',
                  required: 'Sim',
                  description: toPlainText(t('props.table.children')),
                },
                {
                  name: 'autoplay',
                  type: 'boolean',
                  defaultValue: 'false',
                  required: 'Não',
                  description: toPlainText(t('props.table.plugins')),
                },
                {
                  name: 'autoplayInterval',
                  type: 'number',
                  defaultValue: '3000',
                  required: 'Não',
                  description: toPlainText(t('props.table.opts')),
                },
                {
                  name: 'onIndexChange',
                  type: '(index: number, source: CarouselNavSource) => void',
                  defaultValue: '—',
                  required: 'Não',
                  description: toPlainText(t('props.table.setApi')),
                },
                {
                  name: 'class',
                  type: 'string',
                  defaultValue: '—',
                  required: 'Não',
                  description: toPlainText(t('props.table.className')),
                },
                // A fábrica constrói os slides, então a classe de cada um entra
                // por aqui — é o equivalente ao que as outras stacks penduram
                // em cada item da composição, e é por ela que passa a base
                // fracionária (mostrar 2 ou 3 slides por vez).
                {
                  name: 'slideClass',
                  type: 'string',
                  defaultValue: '—',
                  required: 'Não',
                  description: toPlainText(t('props.table.className')),
                },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: t('props.extensibility'),
        });
      }

      case 'tokens': {
        const customizationCode = `/* Em styles.css — tokens usados pelo Carousel (botões de navegação) */
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --border: 214 32% 91%;
  --accent: 210 40% 96%;
  --ring: 215 20% 65%;
  --primary: 222 47% 11%;
  --radius-button: 0.5rem;
}

.dark {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
}`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--background', value: 'bg-background', description: t('tokens.table.background') },
            { token: '--foreground', value: 'text-foreground', description: t('tokens.table.foreground') },
            { token: '--border', value: 'border', description: t('tokens.table.border') },
            { token: '--accent', value: 'nds-hover-bg-accent', description: t('tokens.table.accent') },
            { token: '--ring', value: 'nds-focus-ring', description: t('tokens.table.ring') },
            { token: '--radius-button', value: 'rounded-(--radius-button)', description: t('tokens.table.radiusButton') },
            { token: '--primary', value: 'bg-primary', description: t('tokens.table.primary') },
            { token: '--nds-carousel-slide-scale', value: '.nds-carousel-slide', description: t('tokens.table.slideScale') },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
          title: t('accessibility.title'),
          summary: stripHtml(t('accessibility.summary')),
          items: [1, 2, 3, 4, 5].map((i) => t(`accessibility.item${i}`)),
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: [
            { key: 'Tab', description: t('accessibility.keyboard.tab') },
            { key: 'Arrow Left', description: t('accessibility.keyboard.arrowLeft') },
            { key: 'Arrow Right', description: t('accessibility.keyboard.arrowRight') },
            { key: 'Enter', description: t('accessibility.keyboard.enter') },
            { key: 'Space', description: t('accessibility.keyboard.space') },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Tabs', description: toPlainText(t('related.tabs')), path: '?path=/docs/ui-tabs--docs' },
            { name: 'ScrollArea', description: toPlainText(t('related.scrollArea')), path: '?path=/docs/ui-scrollarea--docs' },
            { name: 'Card', description: toPlainText(t('related.card')), path: '?path=/docs/ui-card--docs' },
            { name: 'Pagination', description: toPlainText(t('related.pagination')), path: '?path=/docs/ui-pagination--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: t('notes.tip1') },
            { title: '', content: t('notes.tip2') },
            { title: '', content: t('notes.tip3') },
            { title: '', content: t('notes.tip4') },
          ],
        });

      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event: t('analytics.table.event'),
            trigger: toPlainText(t('analytics.table.trigger')),
            payload: t('analytics.table.payload'),
          },
          items: [
            {
              event: t('analytics.table.slideChange'),
              trigger: toPlainText(t('analytics.table.slideChangeTrigger')),
              payload: t('analytics.table.slideChangePayload'),
            },
            {
              event: t('analytics.table.autoplayPause'),
              trigger: toPlainText(t('analytics.table.autoplayPauseTrigger')),
              payload: t('analytics.table.autoplayPausePayload'),
            },
            {
              event: t('analytics.table.pageView'),
              trigger: toPlainText(t('analytics.table.pageViewTrigger')),
              payload: t('analytics.table.pageViewPayload'),
            },
            {
              event: t('analytics.table.sectionViewed'),
              trigger: toPlainText(t('analytics.table.sectionViewedTrigger')),
              payload: t('analytics.table.sectionViewedPayload'),
            },
            {
              event: t('analytics.table.langSwitch'),
              trigger: toPlainText(t('analytics.table.langSwitchTrigger')),
              payload: t('analytics.table.langSwitchPayload'),
            },
          ],
        });

      case 'testes': {
        return createDocsTestes({
          title: t('testes.title'),
          functional: {
            title: t('testes.functional.title'),
            cols: {
              action: tNav('common.userAction'),
              result: tNav('common.expectedResult'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => ({
              action: toPlainText(t(`testes.functional.item${i}.action`)),
              result: toPlainText(t(`testes.functional.item${i}.result`)),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: {
              criterion: tNav('common.criterion'),
              level: 'WCAG',
              how: tNav('common.howToVerify'),
            },
            items: [1, 2, 3, 4, 5, 6, 7].map((i) => ({
              criterion: toPlainText(t(`testes.accessibility.item${i}.criterion`)),
              level: t(`testes.accessibility.item${i}.level`),
              how: toPlainText(t(`testes.accessibility.item${i}.how`)),
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            cols: {
              story: tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5].map((i) => ({
              story: toPlainText(t(`testes.visual.item${i}.story`)),
              priority: priorityLabel(t(`testes.visual.item${i}.priority`)),
            })),
          },
        });
      }
    }
  }

  function renderAllSections() {
    for (const id of sectionOrder) {
      const fresh = buildSection(id);
      const existing = sectionEls[id];
      if (existing && existing.parentNode) {
        existing.replaceWith(fresh);
      } else {
        main.appendChild(fresh);
      }
      sectionEls[id] = fresh;
    }
    attachObserver();
  }

  // ── IntersectionObserver ─────────────────────────────────────────────────

  let activeSectionObserver: { disconnect: () => void } | null = null;

  function attachObserver() {
    activeSectionObserver?.disconnect();
    activeSectionObserver = createActiveSectionObserver(
      sectionOrder as unknown as string[],
      (id) => sectionEls[id as keyof typeof sectionEls] ?? null,
      (id) => updateActiveNav(id),
      (id) => track('docs_section_viewed', {
        section_id: id,
        component_name: 'carousel',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

  // ── Initial render ────────────────────────────────────────────────────────

  renderHeader();
  buildSidebar();
  renderAllSections();

  cleanups.push(
    subscribe(() => {
      renderHeader();
      buildSidebar();
      renderAllSections();
    }),
  );
  cleanups.push(
    onLocaleChange(() => {
      renderHeader();
      buildSidebar();
      renderAllSections();
    }),
  );

  // ── Cleanup on disconnect ────────────────────────────────────────────────

  const mo = new MutationObserver(() => {
    if (!document.body.contains(root)) {
      cleanups.forEach((fn) => fn());
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return root;
}
