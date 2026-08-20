import { describe, expect, it } from 'vitest';
import {
  badgeComIconeSource,
  badgeComoBotaoSource,
  badgeComoLinkSource,
  badgeContadorSource,
  badgeDefaultSource,
  badgeDestrutivoSource,
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
    const espiao = () => 'CORPO_DO_MOCK';
    const saida = badgeSource(undefined, { args: { children: espiao as never } });
    expect(saida).toContain('<Badge>Novo</Badge>');
    expect(saida).not.toContain('CORPO_DO_MOCK');
  });
});

describe('variantes', () => {
  it('cada uma diz a sua, porque o arquivo desliga os controls', () => {
    expect(badgeDefaultSource()).toContain('<Badge>Novo</Badge>');
    expect(badgeSecundarioSource()).toContain('<Badge variant="secondary">Beta</Badge>');
    expect(badgeDestrutivoSource()).toContain('<Badge variant="destructive">Urgente</Badge>');
    expect(badgeOutlineSource()).toContain('<Badge variant="outline">Rascunho</Badge>');
  });

  it('as semânticas aparecem juntas, que é o que a story afirma', () => {
    const saida = badgeSemanticasSource();
    for (const variante of ['warning', 'success', 'info']) {
      expect(saida).toContain(`variant="${variante}"`);
    }
  });
});

describe('composições', () => {
  it('o ícone sai da árvore de acessibilidade e o texto nomeia', () => {
    const saida = badgeComIconeSource();
    expect(saida).toContain('import { Check } from "lucide-react";');
    expect(saida).toContain('aria-hidden="true"');
    expect(saida).toContain('data-icon="inline-start"');
  });

  it('o contador ganha significado do contêiner, não do número', () => {
    const saida = badgeContadorSource();
    expect(saida).toContain('role="status"');
    expect(saida).toContain('aria-label="12 notificações não lidas"');
  });

  it('quem recebe o foco é o elemento que envolve — o badge não ganha tabindex', () => {
    for (const saida of [badgeComoLinkSource(), badgeComoBotaoSource()]) {
      expect(saida).toContain('nds-focus-ring-inset');
      expect(saida).not.toContain('tabindex');
      expect(saida).not.toContain('tabIndex');
    }
    expect(badgeComoLinkSource()).toContain('<a');
    expect(badgeComoBotaoSource()).toContain('type="button"');
  });

  it('nenhum snippet ensina o andaime da story', () => {
    for (const fn of [badgeComIconeSource, badgeContadorSource, badgeComoLinkSource, badgeComoBotaoSource]) {
      expect(fn()).not.toContain('fixtures');
    }
  });
});
