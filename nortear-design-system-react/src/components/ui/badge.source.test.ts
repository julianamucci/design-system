import { describe, expect, it } from 'vitest';
import {
  badgeAsButtonSnippet,
  badgeAsButtonSource,
  badgeAsLinkSnippet,
  badgeAsLinkSource,
  badgeWithCounterSnippet,
  badgeWithIconSnippet,
  badgeDefaultSource,
  badgeDestructiveSource,
  badgeSemanticsSource,
  badgeSource,
  badgeWithCounterSource,
  badgeWithIconSource,
} from './badge.source';

describe('badgeSource (Playground)', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    expect(badgeSource()).toContain('import { Badge } from "@/components/ui/badge";');
  });

  it('omite o variant quando é o padrão', () => {
    expect(badgeSource(undefined, { args: { variant: 'default', children: 'Novo' } })).toContain(
      '<Badge>Novo</Badge>',
    );
  });

  it('omite o variant quando o Playground não passa nenhum', () => {
    expect(badgeSource(undefined, { args: { children: 'Novo' } })).toContain('<Badge>Novo</Badge>');
  });

  it('escreve o variant quando difere do padrão', () => {
    expect(badgeSource(undefined, { args: { variant: 'success', children: 'Aprovado' } })).toContain(
      '<Badge variant="success">Aprovado</Badge>',
    );
  });

  it('não inventa variante fora da união', () => {
    const output = badgeSource(undefined, { args: { variant: 'roxo' as never, children: 'X' } });
    expect(output).toContain('<Badge>X</Badge>');
  });

  it('cai no texto padrão quando o control entrega um espião no lugar da string', () => {
    const spy = () => 'CORPO_DO_MOCK';
    const output = badgeSource(undefined, { args: { children: spy as never } });
    expect(output).toContain('<Badge>Novo</Badge>');
    expect(output).not.toContain('CORPO_DO_MOCK');
  });
});

describe('Default', () => {
  it('é o padrão, então sai sem atributo de variante', () => {
    expect(badgeDefaultSource()).toContain('<Badge>Novo</Badge>');
    expect(badgeDefaultSource()).not.toContain('variant=');
  });
});

describe('Destructive', () => {
  it('diz a variante, porque o arquivo desliga os controls', () => {
    expect(badgeDestructiveSource()).toContain('<Badge variant="destructive">Urgente</Badge>');
  });
});

describe('Semantics', () => {
  it('mostra as cinco variantes, que é o que a story mede', () => {
    const output = badgeSemanticsSource();
    expect(output).toContain('<Badge>Novo</Badge>');
    for (const variant of ['destructive', 'warning', 'success', 'info']) {
      expect(output).toContain(`variant="${variant}"`);
    }
    expect(output).not.toContain('variant="default"');
  });

  it('nunca ensina a classe de variante escrita à mão', () => {
    expect(badgeSemanticsSource()).not.toContain('nds-badge-');
  });
});

describe('WithIcon', () => {
  it('o ícone sai da árvore de acessibilidade e encurta o padding do seu lado', () => {
    const output = badgeWithIconSource();
    expect(output).toContain('import { Check } from "lucide-react";');
    expect(output).toContain('aria-hidden="true"');
    expect(output).toContain('data-icon="inline-start"');
  });
});

describe('WithCounter', () => {
  it('o contador vem da peça publicada, dentro da etiqueta e depois do rótulo', () => {
    const output = badgeWithCounterSource();
    expect(output).toContain('import { Badge, BadgeCounter } from "@/components/ui/badge";');
    expect(output).toContain('<BadgeCounter>12</BadgeCounter>');
    expect(output.indexOf('<BadgeCounter>')).toBeGreaterThan(output.indexOf('Urgente'));
    expect(output).not.toContain('aria-hidden');
  });
});

describe('AsButton', () => {
  it('envolve a etiqueta no Button do design system, ghost e sm', () => {
    const output = badgeAsButtonSource();
    expect(output).toContain('import { Button } from "@/components/ui/button";');
    expect(output).toContain('<Button variant="ghost" size="sm" aria-label="Filtrar por Design">');
    expect(output).toContain('<Badge variant="info">Design</Badge>');
  });

  it('não ensina <button> cru, reset inline nem tabIndex na etiqueta', () => {
    const output = badgeAsButtonSource();
    expect(output).not.toContain('<button');
    expect(output).not.toContain('style=');
    expect(output).not.toMatch(/tab[iI]ndex/);
  });
});

describe('AsLink', () => {
  it('a etiqueta é filha direta do link, que é o que a regra de hover exige', () => {
    const output = badgeAsLinkSource();
    expect(output).toMatch(/<a href="#">\s*<Badge variant="info">Design<\/Badge>\s*<\/a>/);
    expect(output).not.toMatch(/tab[iI]ndex/);
  });
});

describe('construtores com rótulo (docs page)', () => {
  it('o card da docs page recebe o rótulo do conteúdo sem mudar o markup', () => {
    expect(badgeWithIconSnippet({ label: 'Ativo' })).toBe(badgeWithIconSource());
    expect(badgeWithCounterSnippet({ variant: 'destructive', label: 'Urgente', count: '12' })).toBe(
      badgeWithCounterSource(),
    );
    expect(
      badgeAsButtonSnippet({ label: 'Design', accessibleName: 'Filtrar por Design' }),
    ).toBe(badgeAsButtonSource());
    expect(badgeAsLinkSnippet({ label: 'Design' })).toBe(badgeAsLinkSource());
  });

  it('o rótulo traduzido entra no lugar do padrão', () => {
    expect(badgeAsButtonSnippet({ label: 'Diseño', accessibleName: 'Filtrar por Diseño' })).toContain(
      '<Button variant="ghost" size="sm" aria-label="Filtrar por Diseño">\n  <Badge variant="info">Diseño</Badge>',
    );
    expect(badgeAsLinkSnippet({ label: 'Diseño' })).toContain('<Badge variant="info">Diseño</Badge>');
    expect(badgeWithIconSnippet({ label: 'Status' })).toContain('\n  Status\n</Badge>');
  });
});

describe('todas as stories', () => {
  it('nenhum snippet ensina o andaime da story', () => {
    for (const fn of [
      badgeDefaultSource,
      badgeDestructiveSource,
      badgeSemanticsSource,
      badgeWithIconSource,
      badgeWithCounterSource,
      badgeAsButtonSource,
      badgeAsLinkSource,
    ]) {
      expect(fn()).not.toContain('fixtures');
      expect(fn()).not.toContain('args.');
    }
  });
});
