import { describe, expect, it } from 'vitest';
import badgeTranslations from '@shared/content/badge/translations.json';
import {
  badgeWithIconSource,
  badgeAsButtonSource,
  badgeAsLinkSource,
  badgeDefaultSource,
  badgeDestructiveSource,
  badgeSemanticsSource,
  badgeSource,
  badgeVariantSource,
  badgeWithCounterSource,
} from './badge.source';

describe('badgeSource (Playground)', () => {
  it('sem args, entrega a etiqueta canônica na variante padrão', () => {
    expect(badgeSource()).toBe(
      `<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
</script>

<template>
  <Badge>Novo</Badge>
</template>`,
    );
  });

  it('a variante acompanha o control, e a padrão não é escrita', () => {
    expect(badgeSource('', { args: { variant: 'default' } })).not.toContain('variant=');
    expect(badgeSource('', { args: { variant: 'info' } })).toContain(
      '<Badge variant="info">Novo</Badge>',
    );
  });

  it('nenhum exemplo escreve o elemento: o badge já nasce inline', () => {
    expect(badgeSource()).not.toContain(' as=');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const output = badgeSource('', { args: { variant: (() => {}) as never } });
    expect(output).not.toContain('function');
    expect(output).toBe(badgeSource());
  });
});

describe('Default e Destructive', () => {
  it('Default: o rótulo da story, e o padrão sai sem prop', () => {
    expect(badgeDefaultSource()).toContain('<Badge>Novo</Badge>');
    expect(badgeDefaultSource()).not.toContain('variant=');
  });

  it('Destructive: a variante escrita com o rótulo da story', () => {
    expect(badgeDestructiveSource()).toContain('<Badge variant="destructive">Urgente</Badge>');
  });

  it('nenhuma variante pinta o rótulo por fora: a cor vem do componente', () => {
    for (const fn of [badgeDefaultSource, badgeDestructiveSource, badgeSemanticsSource]) {
      expect(fn()).not.toContain('nds-text-destructive');
      expect(fn()).not.toContain('class="nds-badge');
    }
  });
});

describe('Semantics', () => {
  it('as cinco variantes aparecem juntas, porque o assunto é distingui-las', () => {
    const output = badgeSemanticsSource();
    expect(output).toContain('<div class="nds-cluster" data-spacing="sm">');
    const variantNames = [...output.matchAll(/variant="([a-z]+)"/g)].map((m) => m[1]);
    // A padrão não é escrita: a primeira etiqueta sai sem prop.
    expect(variantNames).toEqual(['destructive', 'warning', 'success', 'info']);
    expect(output).toContain('<Badge>Novo</Badge>');
    const labels = [...output.matchAll(/>([^<>]+)<\/Badge>/g)].map((m) => m[1]);
    // Cinco rótulos diferentes: repetir um faria duas parecerem a mesma coisa.
    expect(new Set(labels).size).toBe(5);
  });

  it('nenhum snippet cita variante que saiu da folha', () => {
    const allSnippets = [
      badgeSource(),
      badgeDefaultSource(),
      badgeDestructiveSource(),
      badgeSemanticsSource(),
      badgeWithIconSource(),
      badgeWithCounterSource(),
      badgeAsButtonSource(),
      badgeAsLinkSource(),
    ].join('\n');
    expect(allSnippets).not.toContain('variant="secondary"');
    expect(allSnippets).not.toContain('variant="outline"');
  });
});

describe('WithIcon', () => {
  it('o ícone é decorativo e declara de que lado está', () => {
    const output = badgeWithIconSource();
    expect(output).toContain(`import { Check } from 'lucide-vue-next'`);
    expect(output).toContain('<Check aria-hidden="true" data-icon="inline-start" />');
    expect(output).not.toContain('nds-mr-');
    expect(output).not.toContain('margin');
  });
});

describe('WithCounter', () => {
  it('o contador dentro da etiqueta vem do subcomponente, sem classe à mão', () => {
    const output = badgeWithCounterSource();
    expect(output).toContain(`import { Badge, BadgeCounter } from '@/components/ui/badge'`);
    expect(output).toContain('<BadgeCounter>12</BadgeCounter>');
    expect(output.indexOf('Urgente')).toBeLessThan(output.indexOf('<BadgeCounter>'));
    expect(output).not.toContain('nds-badge-counter');
    expect(output).not.toMatch(/<BadgeCounter[^>]*variant=/);
    expect(output).not.toContain('aria-hidden');
  });
});

describe('AsButton', () => {
  it('a etiqueta mora no Button do design system, ghost e pequeno', () => {
    const output = badgeAsButtonSource();
    expect(output).toContain(`import { Button } from '@/components/ui/button'`);
    expect(output).toMatch(/<Button variant="ghost" size="sm" aria-label="[^"]+">/);
    // Nada de `<button>` cru, classe de foco à mão ou estilo inline.
    expect(output).not.toContain('<button');
    expect(output).not.toContain('style=');
    expect(output).not.toContain('nds-focus-ring');
  });

  it('o badge não vira controle: sem tabulação e sem papel próprios', () => {
    const output = badgeAsButtonSource();
    expect(output).not.toContain('tabindex');
    expect(output).not.toContain('<Badge role=');
  });

  it('rótulo e nome acessível são os do conteúdo compartilhado', () => {
    const labels = badgeTranslations['pt-BR'].demonstration.labels;
    const output = badgeAsButtonSource();
    expect(output).toContain(`aria-label="${labels.categoryFilterLabel}"`);
    expect(output).toContain(`>${labels.categoryLabel}</Badge>`);
  });

  it('a docs page passa os rótulos do idioma ativo', () => {
    const labels = badgeTranslations.en.demonstration.labels;
    const output = badgeAsButtonSource({
      label: labels.categoryLabel,
      accessibleName: labels.categoryFilterLabel,
    });
    expect(output).toContain(`aria-label="${labels.categoryFilterLabel}"`);
    expect(output).toContain(`<Badge variant="info">${labels.categoryLabel}</Badge>`);
  });
});

describe('badgeVariantSource (cartões de variante)', () => {
  it('sem argumento, a etiqueta padrão com o rótulo do conteúdo', () => {
    expect(badgeVariantSource()).toBe(badgeDefaultSource());
    expect(badgeVariantSource()).toContain(
      `<Badge>${badgeTranslations['pt-BR'].demonstration.labels.defaultLabel}</Badge>`,
    );
  });

  it('a variante e o rótulo dados chegam ao snippet', () => {
    const label = badgeTranslations.es.demonstration.labels.warningLabel;
    expect(badgeVariantSource('warning', label)).toContain(
      `<Badge variant="warning">${label}</Badge>`,
    );
  });
});

describe('AsLink', () => {
  it('o link envolve a etiqueta, e quem tem foco é ele', () => {
    const output = badgeAsLinkSource();
    expect(output).toContain('<a href="#">');
    expect(output).toContain(
      `<Badge variant="info">${badgeTranslations['pt-BR'].demonstration.labels.categoryLabel}</Badge>`,
    );
    expect(output).not.toContain('tabindex');
    expect(badgeAsLinkSource({ label: 'Tag' })).toContain('<Badge variant="info">Tag</Badge>');
    // O hover é da folha: escrever classe ou estilo ensinaria a contorná-la.
    expect(output).not.toContain('class=');
    expect(output).not.toContain('style=');
  });
});

/** Rótulos do conteúdo compartilhado — a fonte que story e construtor leem. */
const LABELS = badgeTranslations['pt-BR'].demonstration.labels;

/** Os arquivos de story, em forma crua: cada story tem de ligar a PRÓPRIA transform. */
const stories = import.meta.glob<string>('./badge*.stories.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const allStories = Object.values(stories).join('\n');

/** O bloco de uma story, do `export const Nome` até o próximo export. */
function storyBlock(name: string): string {
  const match = new RegExp(`export const ${name}: Story = \\{([\\s\\S]*?)(?=\\nexport |$)`).exec(
    allStories,
  );
  return match?.[1] ?? '';
}

describe('o painel diz o que a tela mostra', () => {
  it('os três arquivos de story foram lidos', () => {
    // Contagem gerada some sem deixar rastro: se o glob deixar de alcançar um
    // arquivo, os casos abaixo passariam medindo menos.
    expect(Object.keys(stories)).toHaveLength(3);
  });

  // Cada linha é: story, o construtor que ela declara, e o trecho que o snippet
  // precisa conter — o MESMO rótulo e a MESMA variante que o template monta.
  const pairs: Array<[string, string, () => string, string]> = [
    ['Playground', 'badgeSource', () => badgeSource(), `<Badge>${LABELS.defaultLabel}</Badge>`],
    [
      'Default',
      'badgeDefaultSource',
      badgeDefaultSource,
      `<Badge>${LABELS.defaultLabel}</Badge>`,
    ],
    [
      'Destructive',
      'badgeDestructiveSource',
      badgeDestructiveSource,
      `<Badge variant="destructive">${LABELS.destructiveLabel}</Badge>`,
    ],
    ['WithIcon', 'badgeWithIconSource', badgeWithIconSource, 'Ativo'],
    ['WithCounter', 'badgeWithCounterSource', badgeWithCounterSource, 'Urgente'],
    [
      'AsButton',
      'badgeAsButtonSource',
      badgeAsButtonSource,
      `<Badge variant="info">${LABELS.categoryLabel}</Badge>`,
    ],
    [
      'AsLink',
      'badgeAsLinkSource',
      badgeAsLinkSource,
      `<Badge variant="info">${LABELS.categoryLabel}</Badge>`,
    ],
  ];

  for (const [story, builder, fn, fragmento] of pairs) {
    it(`${story}: o snippet traz o rótulo e a variante que a story renderiza`, () => {
      expect(fn()).toContain(fragmento);
      const block = storyBlock(story);
      expect(block, `a story ${story} não foi encontrada`).not.toBe('');
      expect(block).toContain(builder);
    });
  }

  it('Semantics traz as cinco variantes, cada uma com o rótulo que a story mostra', () => {
    const code = badgeSemanticsSource();
    expect(code).toContain('<Badge>Novo</Badge>');
    expect(code).toContain('<Badge variant="destructive">Urgente</Badge>');
    expect(code).toContain('<Badge variant="warning">Vence hoje</Badge>');
    expect(code).toContain('<Badge variant="success">Aprovado</Badge>');
    expect(code).toContain('<Badge variant="info">Novidade</Badge>');
    expect(storyBlock('Semantics')).toContain('badgeSemanticsSource');
  });

  it('toda story declara a própria transform, sem herdar a do meta', () => {
    // Herança acerta por coincidência: o `meta` de cada arquivo aponta para a
    // transform de UMA das stories dele, e trocá-lo mudaria o painel das outras
    // em silêncio — nada compara o painel com a tela.
    for (const story of [
      'Playground',
      'Default',
      'Destructive',
      'Semantics',
      'WithIcon',
      'WithCounter',
      'AsButton',
      'AsLink',
    ]) {
      const block = storyBlock(story);
      expect(block, `a story ${story} não foi encontrada`).not.toBe('');
      expect(block, `${story} herda a transform do meta`).toMatch(/source:\s*\{\s*transform:/);
    }
  });
});
