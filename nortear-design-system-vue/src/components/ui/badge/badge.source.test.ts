import { describe, expect, it } from 'vitest';
import {
  badgeWithIconSource,
  badgeAsButtonSource,
  badgeDefaultSource,
  badgeDestructiveSource,
  badgeSemanticasSource,
  badgeSource,
  badgeWithCounterSource,
} from './badge.source';

describe('badgeSource', () => {
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
    // Um elemento de bloco aqui quebraria a linha do texto que acompanha o
    // badge, e não caberia dentro de parágrafo.
    expect(badgeSource()).not.toContain(' as=');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const output = badgeSource('', { args: { variant: (() => {}) as never } });
    expect(output).not.toContain('function');
    expect(output).toBe(badgeSource());
  });
});

describe('transforms das stories de variante', () => {
  it('cada variante leva o próprio rótulo, e o padrão sai sem prop', () => {
    expect(badgeDefaultSource()).toContain('<Badge>Novo</Badge>');
    expect(badgeDefaultSource()).not.toContain('variant=');
    expect(badgeDestructiveSource()).toContain('<Badge variant="destructive">Urgente</Badge>');
  });

  it('nenhuma variante pinta o texto por fora: a cor vem do componente', () => {
    for (const fn of [badgeDefaultSource, badgeDestructiveSource, badgeSemanticasSource]) {
      expect(fn()).not.toContain('nds-text-destructive');
      expect(fn()).not.toContain('class="nds-badge');
    }
  });

  it('as semânticas aparecem juntas, porque o assunto é distingui-las', () => {
    const output = badgeSemanticasSource();
    expect(output).toContain('<div class="nds-cluster" data-spacing="sm">');
    const variantNames = [...output.matchAll(/variant="([a-z]+)"/g)].map((m) => m[1]);
    expect(variantNames).toEqual(['warning', 'success', 'info']);
    const labels = [...output.matchAll(/>([^<>]+)<\/Badge>/g)].map((m) => m[1]);
    // Três rótulos diferentes: repetir um faria as três parecerem a mesma coisa.
    expect(new Set(labels).size).toBe(3);
  });

  it('nenhum snippet cita variante que saiu da folha', () => {
    // `secondary` e `outline` deixaram de existir: um snippet que as escrevesse
    // ensinaria a passar um valor que o componente não aceita mais.
    const allSnippets = [
      badgeSource(),
      badgeDefaultSource(),
      badgeDestructiveSource(),
      badgeSemanticasSource(),
      badgeWithIconSource(),
      badgeWithCounterSource(),
      badgeAsButtonSource(),
    ].join('\n');
    expect(allSnippets).not.toContain('variant="secondary"');
    expect(allSnippets).not.toContain('variant="outline"');
  });
});

describe('transforms das stories de composição', () => {
  it('o ícone é decorativo e declara de que lado está', () => {
    const output = badgeWithIconSource();
    expect(output).toContain(`import { Check } from 'lucide-vue-next'`);
    expect(output).toContain('<Check aria-hidden="true" data-icon="inline-start" />');
    // O respiro é do próprio badge: margem à mão somaria ao gap e o dobraria.
    expect(output).not.toContain('nds-mr-');
    expect(output).not.toContain('margin');
  });

  it('o contador dentro da etiqueta vem do subcomponente, sem classe à mão', () => {
    const output = badgeWithCounterSource();
    expect(output).toContain(`import { Badge, BadgeCounter } from '@/components/ui/badge'`);
    expect(output).toContain('<BadgeCounter>12</BadgeCounter>');
    // O número fica DEPOIS do texto: é o que a composição promete.
    expect(output.indexOf('Urgente')).toBeLessThan(output.indexOf('<BadgeCounter>'));
    // A peça já traz a própria classe; escrevê-la no snippet ensinaria a
    // contornar o componente.
    expect(output).not.toContain('nds-badge-counter');
    // O contador é neutro em qualquer variante — nada de variante nele.
    expect(output).not.toMatch(/<BadgeCounter[^>]*variant=/);
  });

  it('dentro do botão, quem recebe o foco é o elemento de fora', () => {
    const output = badgeAsButtonSource();
    expect(output).toContain('nds-focus-ring-inset');
    // O badge não vira controle: sem tabulação própria e sem papel próprio.
    expect(output).not.toContain('tabindex');
    expect(output).not.toContain('<Badge role=');
    expect(output).toContain('type="button"');
  });

  it('o rótulo de exemplo do botão não cita o nome de outra stack', () => {
    // A story usa uma categoria de filtro como exemplo; docs de cada stack são
    // consumidas isoladamente, e o nome de outra vazaria no painel.
    const output = badgeAsButtonSource();
    expect(output).toContain('aria-label="Filtrar por acessibilidade"');
    expect(output).toContain('<Badge variant="info">Acessibilidade</Badge>');
  });
});
