import { describe, expect, it } from 'vitest';
import {
  badgeWithIconSource,
  badgeAsButtonSource,
  badgeAsLinkSource,
  badgeCounterSource,
  badgeDefaultSource,
  badgeDestructiveSource,
  badgeOutlineSource,
  badgeSecondarySource,
  badgeSemanticasSource,
  badgeSource,
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
    expect(badgeSource('', { args: { variant: 'outline' } })).toContain(
      '<Badge variant="outline">Novo</Badge>',
    );
  });

  it('nenhum exemplo escreve o elemento: o badge já nasce inline', () => {
    // Um elemento de bloco aqui quebraria a linha do texto que acompanha o
    // badge, e não caberia dentro de parágrafo.
    expect(badgeSource()).not.toContain(' as=');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const saida = badgeSource('', { args: { variant: (() => {}) as never } });
    expect(saida).not.toContain('function');
    expect(saida).toBe(badgeSource());
  });
});

describe('transforms das stories de variante', () => {
  it('cada variante leva o próprio rótulo, e o padrão sai sem prop', () => {
    expect(badgeDefaultSource()).toContain('<Badge>Novo</Badge>');
    expect(badgeDefaultSource()).not.toContain('variant=');
    expect(badgeSecondarySource()).toContain('<Badge variant="secondary">Beta</Badge>');
    expect(badgeDestructiveSource()).toContain('<Badge variant="destructive">Urgente</Badge>');
    expect(badgeOutlineSource()).toContain('<Badge variant="outline">Rascunho</Badge>');
  });

  it('nenhuma variante pinta o texto por fora: a cor vem do componente', () => {
    for (const fn of [badgeDestructiveSource, badgeOutlineSource, badgeSemanticasSource]) {
      expect(fn()).not.toContain('nds-text-destructive');
      expect(fn()).not.toContain('class="nds-badge');
    }
  });

  it('as semânticas aparecem juntas, porque o assunto é distingui-las', () => {
    const saida = badgeSemanticasSource();
    expect(saida).toContain('<div class="nds-cluster" data-spacing="sm">');
    const variantes = [...saida.matchAll(/variant="([^"]+)"/g)].map((m) => m[1]);
    expect(variantes).toEqual(['warning', 'success', 'info']);
    const rotulos = [...saida.matchAll(/>([^<>]+)<\/Badge>/g)].map((m) => m[1]);
    // Três rótulos diferentes: repetir um faria as três parecerem a mesma coisa.
    expect(new Set(rotulos).size).toBe(3);
  });
});

describe('transforms das stories de composição', () => {
  it('o ícone é decorativo e declara de que lado está', () => {
    const saida = badgeWithIconSource();
    expect(saida).toContain(`import { Check } from 'lucide-vue-next'`);
    expect(saida).toContain('<Check aria-hidden="true" data-icon="inline-start" />');
    // O respiro é do próprio badge: margem à mão somaria ao gap e o dobraria.
    expect(saida).not.toContain('nds-mr-');
    expect(saida).not.toContain('margin');
  });

  it('o contador tira o significado do contêiner, não do número', () => {
    const saida = badgeCounterSource();
    expect(saida).toContain('role="status"');
    expect(saida).toContain('aria-label="12 notificações não lidas"');
    expect(saida).toContain('<Badge variant="destructive">12</Badge>');
  });

  it('dentro de link e de botão, quem recebe o foco é o elemento de fora', () => {
    for (const saida of [badgeAsLinkSource(), badgeAsButtonSource()]) {
      expect(saida).toContain('nds-focus-ring-inset');
      // O badge não vira controle: sem tabulação própria e sem papel próprio.
      expect(saida).not.toContain('tabindex');
      expect(saida).not.toContain('<Badge role=');
    }
    expect(badgeAsLinkSource()).toContain('href="#design"');
    expect(badgeAsButtonSource()).toContain('type="button"');
  });

  it('o rótulo de exemplo do botão não cita o nome de outra stack', () => {
    // A story usa "React" como categoria de filtro; docs de cada stack são
    // consumidas isoladamente, e o nome vazaria no painel.
    const saida = badgeAsButtonSource();
    expect(saida).toContain('aria-label="Filtrar por acessibilidade"');
    expect(saida).toContain('<Badge variant="outline">Acessibilidade</Badge>');
  });
});
