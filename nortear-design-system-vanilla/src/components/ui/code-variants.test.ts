/**
 * Teste de nó do primitivo que decide o que é snippet no conteúdo compartilhado.
 *
 * Mora aqui, e não em `docs/shared/`, pelo mesmo motivo de `chat-protocol.test.ts`:
 * o módulo é compartilhado e não importa framework nenhum, e o vanilla é a stack
 * onde os testes de primitivo rodam.
 *
 * POR QUE ELE PASSOU A EXISTIR. `isCodeKey` não reconhecia a chave nua `code`, e
 * quatro nós de `composer` e `composer-trigger-popover` ficaram invisíveis ao
 * achatamento. Nó não achatado não vira string, `t()` cai no `?? key`, e a caixa
 * de código da seção de Formas mostrava para o leitor o literal
 * `variants.items.enter.code` — nas cinco stacks, em produção, sem nada acusar.
 *
 * O que este arquivo guarda é a fronteira entre as duas funções: `isCodeKey` é
 * larga de propósito, e quem recusa é `isCodeVariantNode`, pela FORMA do nó.
 * Alargar uma sem a outra é o que traria falso positivo.
 */
import { describe, expect, it } from 'vitest';
import { isCodeKey, isCodeVariantNode } from '@shared/primitives/code-variants';

describe('isCodeKey — o que é chave de snippet', () => {
  it('aceita o sufixo Code, que é a forma mais comum', () => {
    expect(isCodeKey('structureCode')).toBe(true);
    expect(isCodeKey('basicCode')).toBe(true);
    expect(isCodeKey('customizationCode')).toBe(true);
  });

  it('aceita a chave NUA `code`', () => {
    // Dentro de `variants.items.<x>.code` o sufixo seria redundante, e foi
    // exatamente aí que quatro nós nasceram invisíveis.
    expect(isCodeKey('code')).toBe(true);
  });

  it('aceita o prefixo `code` seguido de maiúscula', () => {
    expect(isCodeKey('codeBlock')).toBe(true);
  });

  it('recusa texto descritivo', () => {
    for (const key of ['description', 'title', 'label', 'encode', 'barcode']) {
      expect(isCodeKey(key)).toBe(false);
    }
  });
});

describe('isCodeVariantNode — quem de fato recusa é a FORMA', () => {
  const variantes = { react: '<A />', vanilla: 'createA()' };

  it('um nó de variantes sob chave de código passa', () => {
    expect(isCodeVariantNode('structureCode', variantes)).toBe(true);
    expect(isCodeVariantNode('code', variantes)).toBe(true);
  });

  it('a chave `code` com filhos que NÃO são stacks é recusada', () => {
    // É a guarda que torna seguro aceitar a chave nua: `props.table.code` do
    // `code-block` tem `name`/`type`/`description`, e continua sendo texto
    // auditável em vez de virar snippet.
    const linhaDeTabela = { name: 'code', type: 'string', description: 'O código exibido.' };
    expect(isCodeVariantNode('code', linhaDeTabela)).toBe(false);
  });

  it('mistura de stack com chave estranha é recusada por inteiro', () => {
    // Recusar só a chave estranha deixaria o nó meio achatado, que é pior:
    // metade vira snippet e metade some.
    expect(isCodeVariantNode('code', { react: '<A />', descricao: 'texto' })).toBe(false);
  });

  it('valor que não é objeto de strings é recusado', () => {
    expect(isCodeVariantNode('code', 'já é uma string')).toBe(false);
    expect(isCodeVariantNode('code', null)).toBe(false);
    expect(isCodeVariantNode('code', {})).toBe(false);
    expect(isCodeVariantNode('code', ['<A />'])).toBe(false);
    expect(isCodeVariantNode('code', { react: 42 })).toBe(false);
  });

  it('chave descritiva não vira snippet nem com forma de variante', () => {
    // As duas condições valem juntas: sem esta, um objeto de conteúdo que por
    // acaso tivesse uma chave `web` seria achatado errado.
    expect(isCodeVariantNode('description', variantes)).toBe(false);
  });
});
