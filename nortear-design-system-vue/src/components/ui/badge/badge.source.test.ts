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

  it('nenhuma variante pinta o texto por fora: a cor vem do componente', () => {
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
