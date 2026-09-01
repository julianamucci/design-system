// Rótulos falados do CodeBlock.
//
// Vive na stack de referência porque é lá que o projeto roda `--project unit`;
// o módulo em si é compartilhado e não importa framework nenhum.
//
// O que este arquivo guarda não é a tradução — é que exista uma. Um rótulo
// falado vazio não quebra nada: o botão continua clicando, a região continua
// rolando, e o defeito só aparece para quem ouve a página.

import { describe, expect, it } from 'vitest';
import {
  LABELS_CODE_BLOCK_DEFAULT,
  codeBlockLabels,
  type CodeBlockLabels,
} from '@shared/primitives/code-block-labels';

const LOCALES = ['pt-BR', 'en', 'es'] as const;
const KEYS: Array<keyof CodeBlockLabels> = [
  'copy',
  'copied',
  'region',
  'lineAdded',
  'lineRemoved',
];

describe('rótulos do CodeBlock', () => {
  it.each(LOCALES)('%s traz os cinco rótulos, nenhum vazio', (locale) => {
    const labels = codeBlockLabels(locale);
    for (const key of KEYS) {
      expect(labels[key], `${locale}.${key}`).toBeTruthy();
      expect(labels[key].trim(), `${locale}.${key}`).not.toBe('');
    }
  });

  it('a região tem nome em todas as línguas — é o que a regra 6 da §8 pede', () => {
    // Asserção separada de propósito: é ela que reprova se alguém devolver a
    // região ao estado anônimo. Sem nome, `tabindex="0"` faz uma parada de
    // teclado que o leitor de tela não sabe anunciar.
    for (const locale of LOCALES) {
      expect(codeBlockLabels(locale).region.trim().length, locale).toBeGreaterThan(0);
    }
  });

  it('as duas espécies de linha falam palavras DIFERENTES', () => {
    // Se as duas dissessem a mesma coisa, a distinção voltaria a depender só da
    // tinta — que é o que a regra 4 da §8 recusa, e o exemplo que ela dá é este.
    for (const locale of LOCALES) {
      const labels = codeBlockLabels(locale);
      expect(labels.lineAdded, locale).not.toBe(labels.lineRemoved);
    }
  });

  it('aceita a tag inteira e cai na língua base', () => {
    expect(codeBlockLabels('es-ES')).toBe(codeBlockLabels('es'));
    expect(codeBlockLabels('en-GB')).toBe(codeBlockLabels('en'));
  });

  it('idioma desconhecido e ausência de idioma usam o português', () => {
    expect(codeBlockLabels('de')).toBe(LABELS_CODE_BLOCK_DEFAULT);
    expect(codeBlockLabels(undefined)).toBe(LABELS_CODE_BLOCK_DEFAULT);
    expect(LABELS_CODE_BLOCK_DEFAULT).toBe(codeBlockLabels('pt-BR'));
  });
});
