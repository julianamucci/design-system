import { describe, expect, it } from 'vitest';
import {
  badgeWithIconSource,
  badgeWithCounterSource,
  badgeDestructiveSource,
  buttonBadgeSource,
  badgeSemanticasSource,
  badgeSource,
} from './badge.source';

describe('badgeSource', () => {
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

describe('transforms das stories de variante', () => {
  it('cada variante leva o próprio rótulo, e não o do playground', () => {
    expect(badgeDestructiveSource()).toContain('<Badge variant="destructive">Urgente</Badge>');
  });

  it('as semânticas aparecem juntas, que é o que a story ensina', () => {
    const saida = badgeSemanticasSource();
    expect(saida).toContain('variant="warning"');
    expect(saida).toContain('variant="success"');
    expect(saida).toContain('variant="info"');
    // O respiro entre as três é do container, não uma margem em cada etiqueta.
    expect(saida).toContain('class="nds-cluster" data-spacing="sm"');
  });
});

describe('transforms das stories de composição', () => {
  it('o ícone entra decorativo e marcado para o ajuste de padding', () => {
    const saida = badgeWithIconSource();
    expect(saida).toContain('@lucide/svelte/icons/check');
    expect(saida).toContain('<Check aria-hidden="true" data-icon="inline-start" />');
  });

  it('o contador dentro da etiqueta sai como peça, não como número solto', () => {
    const saida = badgeWithCounterSource();
    // A peça precisa aparecer no import: sem ela o leitor copia o snippet e o
    // número renderiza como texto, sem a pílula.
    expect(saida).toContain('import { Badge, BadgeCounter } from "@/components/ui/badge";');
    expect(saida).toContain('<BadgeCounter>12</BadgeCounter>');
    // À direita do texto, dentro da mesma etiqueta.
    expect(saida.indexOf('Urgente')).toBeLessThan(saida.indexOf('<BadgeCounter>'));
    expect(saida.indexOf('<BadgeCounter>')).toBeLessThan(saida.indexOf('</Badge>'));
  });

  it('no clique, quem recebe o foco é o botão que envolve a etiqueta', () => {
    const saida = buttonBadgeSource();
    expect(saida).toContain('type="button"');
    expect(saida).toContain('<Badge variant="info">Acessibilidade</Badge>');
    // Nenhuma prop de destino na etiqueta: o elemento interativo é o de fora.
    expect(saida).not.toContain('<Badge href');
  });
});
