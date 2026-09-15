import { describe, expect, it } from 'vitest';
import {
  badgeAsButtonSource,
  badgeAsLinkSource,
  badgeDestructiveSource,
  badgeSemanticsSource,
  badgeSource,
  badgeVariantSnippet,
  badgeWithCounterSource,
  badgeWithIconSource,
} from './badge.source';

describe('badgeSource (Playground)', () => {
  it('sem args, entrega uma etiqueta na variante padrão, sem escrever a prop', () => {
    expect(badgeSource()).toBe(
      `<script lang="ts">
  import { Badge } from "@/components/ui/badge";
</script>

<Badge>Novo</Badge>`,
    );
  });

  it('acompanha o control de variante, e só o escreve quando difere do padrão', () => {
    expect(badgeSource('', { args: { variant: 'default' } })).not.toContain('variant');
    expect(badgeSource('', { args: { variant: 'info' } })).toContain(
      '<Badge variant="info">Novo</Badge>',
    );
  });
});

describe('badgeDestructiveSource (Destructive)', () => {
  it('leva o próprio rótulo, e não o do playground', () => {
    expect(badgeDestructiveSource()).toContain('<Badge variant="destructive">Urgente</Badge>');
  });
});

describe('badgeSemanticsSource (Semantics)', () => {
  it('as cinco variantes aparecem juntas, que é o que a story ensina', () => {
    const output = badgeSemanticsSource();
    // A default omite a prop: é o padrão do componente.
    expect(output).toContain('<Badge>Novo</Badge>');
    for (const variant of ['destructive', 'warning', 'success', 'info']) {
      expect(output).toContain(`variant="${variant}"`);
    }
    // O respiro entre elas é do container, não uma margem em cada etiqueta.
    expect(output).toContain('class="nds-cluster" data-spacing="sm"');
  });
});

describe('badgeWithIconSource (WithIcon)', () => {
  it('o ícone entra decorativo e marcado para o ajuste de padding', () => {
    const output = badgeWithIconSource();
    expect(output).toContain('@lucide/svelte/icons/check');
    expect(output).toContain('<Check aria-hidden="true" data-icon="inline-start" />');
  });
});

describe('badgeWithCounterSource (WithCounter)', () => {
  it('o contador dentro da etiqueta sai como peça, não como número solto', () => {
    const output = badgeWithCounterSource();
    // A peça precisa aparecer no import: sem ela o leitor copia o snippet e o
    // número renderiza como texto, sem a pílula.
    expect(output).toContain('import { Badge, BadgeCounter } from "@/components/ui/badge";');
    expect(output).toContain('<BadgeCounter>12</BadgeCounter>');
    expect(output).not.toContain('nds-badge-counter');
    // À direita do texto, dentro da mesma etiqueta.
    expect(output.indexOf('Urgente')).toBeLessThan(output.indexOf('<BadgeCounter>'));
    expect(output.indexOf('<BadgeCounter>')).toBeLessThan(output.indexOf('</Badge>'));
  });
});

describe('badgeVariantSnippet (card da seção Variantes)', () => {
  it('sem args, a default com o rótulo do conteúdo e sem escrever a prop', () => {
    const output = badgeVariantSnippet();
    expect(output).toContain('import { Badge } from "@/components/ui/badge";');
    expect(output).toContain('<Badge>Novo</Badge>');
    expect(output).not.toContain('variant=');
  });

  it('as outras variantes escrevem a prop, com o rótulo recebido', () => {
    expect(badgeVariantSnippet('warning')).toContain('<Badge variant="warning">Vence hoje</Badge>');
    expect(badgeVariantSnippet('info', 'News')).toContain('<Badge variant="info">News</Badge>');
    expect(badgeVariantSnippet('default', 'New')).toContain('<Badge>New</Badge>');
  });
});

describe('rótulos das composições por opção', () => {
  it('o texto recebido substitui o padrão pt-BR — é o que a docs page passa por idioma', () => {
    expect(badgeWithIconSource({ label: 'Active' })).toContain('  Active\n');
    expect(badgeWithCounterSource({ label: 'Urgent' })).toContain('  Urgent\n');
    const button = badgeAsButtonSource({ label: 'Design', accessibleName: 'Filter by Design' });
    expect(button).toContain('aria-label="Filter by Design"');
    expect(badgeAsLinkSource({ label: 'Diseño' })).toContain('<Badge variant="info">Diseño</Badge>');
  });

  it('usado como transform, o código gerado no primeiro argumento NÃO vira rótulo', () => {
    // O Storybook chama `transform(codigoGerado, ctx)`: o objeto de opção é o
    // que impede a string de entrar no snippet.
    const asTransform = badgeAsLinkSource as unknown as (generated: string) => string;
    expect(asTransform('<Gerado />')).not.toContain('Gerado');
    expect(asTransform('<Gerado />')).toContain('<Badge variant="info">Design</Badge>');
  });
});

describe('badgeAsButtonSource (AsButton)', () => {
  it('a etiqueta entra no Button do design system, ghost e sm, com o nome acessível no botão', () => {
    const output = badgeAsButtonSource();
    expect(output).toContain('import { Button } from "@/components/ui/button";');
    expect(output).toContain('variant="ghost"');
    expect(output).toContain('size="sm"');
    expect(output).toContain('aria-label="Filtrar por Design"');
    expect(output).toContain('<Badge variant="info">Design</Badge>');
    // Nada de <button> cru, classe de reinicialização ou estilo inline.
    expect(output).not.toContain('<button');
    expect(output).not.toContain('style=');
    expect(output).not.toContain('tabindex');
  });
});

describe('badgeAsLinkSource (AsLink)', () => {
  it('o link envolve a etiqueta, e a etiqueta não compete pelo foco', () => {
    const output = badgeAsLinkSource();
    expect(output).toContain('<a href="#">');
    expect(output).toContain('<Badge variant="info">Design</Badge>');
    expect(output.indexOf('<a href')).toBeLessThan(output.indexOf('<Badge variant="info">'));
    expect(output).not.toContain('tabindex');
    expect(output).not.toContain('<Badge href');
  });
});
