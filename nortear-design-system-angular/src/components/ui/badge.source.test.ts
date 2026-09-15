import { describe, expect, it } from 'vitest';
import badgeTranslations from '@shared/content/badge/translations.json';
import {
  badgeAsButtonSource,
  badgeAsLinkSource,
  badgeDefaultSource,
  badgeDestructiveSource,
  badgePlaygroundSource,
  badgeSemanticsSource,
  badgeVariantSnippet,
  badgeWithCounterSource,
  badgeWithIconSource,
} from './badge.source';

/**
 * A ausência deste arquivo era o `source_sem_teste` do auditor.
 *
 * A varredura genérica (`source-snippets.test.ts`) prova que o snippet importa o
 * que usa e liga só o que a classe declara. O que ela não prova é o que este
 * arquivo cobra: omitir o valor padrão, ensinar a peça certa em cada composição
 * e bater com a story ao lado.
 */

/** Texto do conteúdo compartilhado, lido cru do JSON — caminho independente do `t()`. */
function text(path: string): string {
  let node: unknown = (badgeTranslations as Record<string, unknown>)['pt-BR'];
  for (const key of path.split('.')) node = (node as Record<string, unknown>)[key];
  return String(node);
}

const label = (key: string) => text(`demonstration.labels.${key}`);

/** Os arquivos de story, como texto: cada story tem de ligar o construtor dela. */
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

describe('badgePlaygroundSource', () => {
  it('omite a variante padrão', () => {
    const code = badgePlaygroundSource();
    expect(code).toContain(`<span ndsBadge>${label('defaultLabel')}</span>`);
    expect(code).not.toContain('variant=');
  });

  it('acompanha os controls', () => {
    const code = badgePlaygroundSource('', { args: { variant: 'warning', label: 'Rascunho' } });
    expect(code).toContain('<span ndsBadge variant="warning">Rascunho</span>');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(badgePlaygroundSource('<span data-variant="success">', {})).not.toContain('success');
  });
});

describe('variantes', () => {
  it('Default não escreve `variant`, Destructive escreve', () => {
    expect(badgeDefaultSource()).not.toContain('variant=');
    expect(badgeDestructiveSource()).toContain(
      `<span ndsBadge variant="destructive">${label('destructiveLabel')}</span>`,
    );
  });

  it('Semantics mostra as cinco, com o rótulo de cada uma', () => {
    const code = badgeSemanticsSource();
    for (const v of ['destructive', 'warning', 'success', 'info']) {
      expect(code).toContain(`<span ndsBadge variant="${v}">${label(`${v}Label`)}</span>`);
    }
    expect(code).toContain(`<span ndsBadge>${label('defaultLabel')}</span>`);
    expect(code).toContain('class="nds-cluster"');
  });

  it('o snippet do card de variante é a etiqueta sozinha', () => {
    expect(badgeVariantSnippet('info')).toBe(
      `<span ndsBadge variant="info">${label('infoLabel')}</span>`,
    );
  });
});

describe('composições', () => {
  it('WithIcon: ícone antes do rótulo, com data-icon, sem aria-hidden duplicado', () => {
    const code = badgeWithIconSource();
    expect(code).toContain("import { NdsButtonIcon } from '@/components/ui/button';");
    expect(code).toContain('data-icon="inline-start"');
    // O `NdsButtonIcon` já emite `aria-hidden` no host: escrever de novo é ruído.
    expect(code).not.toContain('aria-hidden');
    expect(code.indexOf('<svg')).toBeLessThan(code.indexOf(label('statusLabel')));
  });

  it('WithCounter: o contador é a diretiva publicada, não uma classe à mão', () => {
    const code = badgeWithCounterSource();
    expect(code).toContain("import { NdsBadge, NdsBadgeCounter } from '@/components/ui/badge';");
    expect(code).toContain('<span ndsBadgeCounter>12</span>');
    expect(code).not.toContain('nds-badge-counter');
  });

  it('AsButton: Button ghost sm, com o nome acessível do filtro', () => {
    const code = badgeAsButtonSource();
    expect(code).toContain(
      `<button ndsButton variant="ghost" size="sm" aria-label="${label('categoryFilterLabel')}">`,
    );
    expect(code).toContain(label('categoryLabel'));
    expect(code).not.toContain('tabindex');
    expect(code).not.toContain('style=');
  });

  it('AsLink: a etiqueta dentro de um <a>, sem virar botão', () => {
    const code = badgeAsLinkSource();
    expect(code).toContain('<a href="#">');
    expect(code).toContain(label('categoryLabel'));
    expect(code).not.toContain('ndsButton');
    expect(code).not.toContain('tabindex');
  });
});

describe('cada story liga o próprio construtor', () => {
  const pairs: Array<[string, string]> = [
    ['Playground', 'badgePlaygroundSource'],
    ['Default', 'badgeDefaultSource'],
    ['Destructive', 'badgeDestructiveSource'],
    ['Semantics', 'badgeSemanticsSource'],
    ['WithIcon', 'badgeWithIconSource'],
    ['WithCounter', 'badgeWithCounterSource'],
    ['AsButton', 'badgeAsButtonSource'],
    ['AsLink', 'badgeAsLinkSource'],
  ];

  it('os três arquivos de story foram lidos', () => {
    expect(Object.keys(stories)).toHaveLength(3);
  });

  for (const [story, builder] of pairs) {
    it(`${story} → ${builder}`, () => {
      const block = storyBlock(story);
      expect(block, `a story ${story} não foi encontrada`).not.toBe('');
      expect(block).toContain(`transform: ${builder}`);
    });
  }

  it('a story e o snippet compõem as mesmas peças', () => {
    expect(storyBlock('AsButton')).toContain('<button ndsButton variant="ghost" size="sm"');
    expect(storyBlock('AsLink')).toContain('<a href="#">');
    expect(storyBlock('WithIcon')).toContain(
      '<svg ndsButtonIcon kind="check" size="sm" data-icon="inline-start"></svg>',
    );
    expect(storyBlock('WithCounter')).toContain('<span ndsBadgeCounter>12</span>');
  });
});
