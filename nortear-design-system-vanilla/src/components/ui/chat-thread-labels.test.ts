// Rótulo falado do ChatThread que o design system escreve.
//
// Vive na stack de referência porque é lá que o projeto roda `--project unit`;
// o módulo em si é compartilhado e não importa framework nenhum.
//
// O que este arquivo guarda não é a tradução — é que exista uma. Um rótulo
// falado vazio não quebra nada: a conversa continua rolando, o botão continua
// clicando, e o defeito só aparece para quem ouve a página.

import { describe, expect, it } from 'vitest';
import {
  LABELS_CHAT_THREAD_DEFAULT,
  chatThreadLabels,
} from '@shared/primitives/chat-thread-labels';

const LOCALES = ['pt-BR', 'en', 'es'] as const;

describe('rótulos falados do ChatThread', () => {
  it('a região tem nome em todas as línguas — é o que a regra 6 da §8 pede', () => {
    // É esta asserção que reprova se alguém devolver a região ao estado
    // anônimo. Sem nome, `tabindex="0"` faz uma parada de teclado que o leitor
    // de tela não sabe anunciar.
    for (const locale of LOCALES) {
      const { region } = chatThreadLabels(locale);
      expect(region, locale).toBeTruthy();
      expect(region.trim(), locale).not.toBe('');
    }
  });

  it('as três línguas dizem coisas DIFERENTES', () => {
    // Nome igual nas três é o sintoma de tradução esquecida: passaria em toda
    // asserção de "não vazio" e continuaria falando português para quem lê em
    // espanhol.
    const nomes = LOCALES.map((locale) => chatThreadLabels(locale).region);
    expect(new Set(nomes).size).toBe(LOCALES.length);
  });

  it('o nome diz ONDE a pessoa entrou, e não o que o elemento faz', () => {
    // "Região de rolagem" descreve o mecanismo e não informa nada: quem chegou
    // ali por Tab já sabe que rola, o que não sabe é onde entrou.
    for (const locale of LOCALES) {
      expect(chatThreadLabels(locale).region.toLowerCase(), locale).not.toMatch(
        /rolagem|scroll|desplaz/,
      );
    }
  });

  it('aceita a tag inteira e cai na língua base', () => {
    expect(chatThreadLabels('es-ES')).toBe(chatThreadLabels('es'));
    expect(chatThreadLabels('en-GB')).toBe(chatThreadLabels('en'));
  });

  it('idioma desconhecido e ausência de idioma usam o português', () => {
    expect(chatThreadLabels('de')).toBe(LABELS_CHAT_THREAD_DEFAULT);
    expect(chatThreadLabels(undefined)).toBe(LABELS_CHAT_THREAD_DEFAULT);
    expect(LABELS_CHAT_THREAD_DEFAULT).toBe(chatThreadLabels('pt-BR'));
  });
});
