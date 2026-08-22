import { describe, expect, it } from 'vitest';
import {
  badgeWithIconSource,
  badgeCounterSource,
  badgeDestructiveSource,
  buttonBadgeSource,
  badgeEmLinkSource,
  badgeOutlineSource,
  badgeSecundarioSource,
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
    expect(badgeSource('', { args: { variant: 'outline' } })).toContain(
      '<Badge variant="outline">Novo</Badge>',
    );
  });
});

describe('transforms das stories de variante', () => {
  it('cada variante leva o próprio rótulo, e não o do playground', () => {
    expect(badgeSecundarioSource()).toContain('<Badge variant="secondary">Beta</Badge>');
    expect(badgeDestructiveSource()).toContain('<Badge variant="destructive">Urgente</Badge>');
    expect(badgeOutlineSource()).toContain('<Badge variant="outline">Rascunho</Badge>');
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

  it('o contador é nomeado pelo container, e não pelo número solto', () => {
    const saida = badgeCounterSource();
    expect(saida).toContain('role="status"');
    expect(saida).toContain('aria-label="12 notificações não lidas"');
    expect(saida).toContain('<Badge variant="destructive">12</Badge>');
  });

  it('na navegação, quem envolve a etiqueta é o link', () => {
    const saida = badgeEmLinkSource();
    expect(saida).toContain('href="/categorias/design"');
    expect(saida).toContain('<Badge variant="secondary">Design</Badge>');
    // Nenhuma prop de destino na etiqueta: o elemento interativo é o de fora.
    expect(saida).not.toContain('<Badge href');
  });

  it('no clique, quem recebe o foco é o botão que envolve a etiqueta', () => {
    const saida = buttonBadgeSource();
    expect(saida).toContain('type="button"');
    expect(saida).toContain('<Badge variant="outline">Acessibilidade</Badge>');
  });
});
