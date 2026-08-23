import { describe, expect, it } from 'vitest';
import {
  badgeWithIconSource,
  badgeAsButtonSource,
  badgeAsLinkSource,
  badgeCounterSource,
  badgeDefaultSource,
  badgeDestructiveSource,
  badgeOutlineSource,
  badgeSecundarioSource,
  badgeSemanticasSource,
  badgeSource,
} from './badge.source';

describe('badgeSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    expect(badgeSource()).toContain('import { Badge } from "@/components/ui/badge";');
  });

  it('omite o variant quando é o padrão', () => {
    expect(badgeSource(undefined, { args: { variant: 'default', children: 'Novo' } })).toContain(
      '<Badge>Novo</Badge>',
    );
  });

  it('escreve o variant quando difere do padrão', () => {
    expect(badgeSource(undefined, { args: { variant: 'success', children: 'Aprovado' } })).toContain(
      '<Badge variant="success">Aprovado</Badge>',
    );
  });

  it('não inventa variante fora da união', () => {
    const saida = badgeSource(undefined, { args: { variant: 'roxo' as never, children: 'X' } });
    expect(saida).toContain('<Badge>X</Badge>');
  });

  it('cai no texto padrão quando o control entrega um espião no lugar da string', () => {
    const spy = () => 'CORPO_DO_MOCK';
    const saida = badgeSource(undefined, { args: { children: spy as never } });
    expect(saida).toContain('<Badge>Novo</Badge>');
    expect(saida).not.toContain('CORPO_DO_MOCK');
  });
});

describe('variantes', () => {
  it('cada uma diz a sua, porque o arquivo desliga os controls', () => {
    expect(badgeDefaultSource()).toContain('<Badge>Novo</Badge>');
    expect(badgeSecundarioSource()).toContain('<Badge variant="secondary">Beta</Badge>');
    expect(badgeDestructiveSource()).toContain('<Badge variant="destructive">Urgente</Badge>');
    expect(badgeOutlineSource()).toContain('<Badge variant="outline">Rascunho</Badge>');
  });

  it('as semânticas aparecem juntas, que é o que a story afirma', () => {
    const saida = badgeSemanticasSource();
    for (const variant of ['warning', 'success', 'info']) {
      expect(saida).toContain(`variant="${variant}"`);
    }
  });
});

describe('composições', () => {
  it('o ícone sai da árvore de acessibilidade e o texto nomeia', () => {
    const saida = badgeWithIconSource();
    expect(saida).toContain('import { Check } from "lucide-react";');
    expect(saida).toContain('aria-hidden="true"');
    expect(saida).toContain('data-icon="inline-start"');
  });

  it('o contador ganha significado do contêiner, não do número', () => {
    const saida = badgeCounterSource();
    expect(saida).toContain('role="status"');
    expect(saida).toContain('aria-label="12 notificações não lidas"');
  });

  it('quem recebe o foco é o elemento que envolve — o badge não ganha tabindex', () => {
    for (const saida of [badgeAsLinkSource(), badgeAsButtonSource()]) {
      expect(saida).toContain('nds-focus-ring-inset');
      expect(saida).not.toContain('tabindex');
      expect(saida).not.toContain('tabIndex');
    }
    expect(badgeAsLinkSource()).toContain('<a');
    expect(badgeAsButtonSource()).toContain('type="button"');
  });

  it('nenhum snippet ensina o andaime da story', () => {
    for (const fn of [badgeWithIconSource, badgeCounterSource, badgeAsLinkSource, badgeAsButtonSource]) {
      expect(fn()).not.toContain('fixtures');
    }
  });
});
