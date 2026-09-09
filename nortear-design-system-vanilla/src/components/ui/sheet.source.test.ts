import { describe, expect, it } from 'vitest';
import {
  SHEET_BODY_TEXT,
  sheetControlledSnippet,
  sheetHeadingH3Source,
  sheetSnippet,
  sheetSource,
  sheetSourceWith,
} from './sheet.source';
import sheetTranslations from '@shared/content/sheet/translations.json';

describe('sheetSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do painel', () => {
    const code = sheetSnippet();
    expect(code).toContain("import { createSheet } from '@/components/ui/sheet';");
    expect(code).toContain('createSheet({');
    expect(code).not.toContain('data-slot="sheet-content"');
    expect(code).not.toContain('aria-modal="true"');
  });

  it('omite o que já é padrão da fábrica', () => {
    // `right` é o lado padrão e o X do canto vem pronto: nenhum dos dois entra.
    expect(sheetSnippet()).not.toContain('side:');
    expect(sheetSnippet()).not.toContain('showCloseButton');
    expect(sheetSnippet({ side: 'right' })).not.toContain('side:');
  });

  it('mostra o lado quando a story o troca', () => {
    expect(sheetSnippet({ side: 'left' })).toContain("side: 'left'");
    expect(sheetSnippet({ side: 'bottom' })).toContain("side: 'bottom'");
  });

  it('monta o gatilho com a fábrica de botão, sem helper de story', () => {
    const code = sheetSnippet({ triggerLabel: 'Abrir filtros' });
    expect(code).toContain("import { createButton } from '@/components/ui/button';");
    expect(code).toContain("trigger: createButton({ variant: 'outline', label: 'Abrir filtros' })");
    expect(code).not.toContain('buildPlayground');
    expect(code).not.toContain('makeFooter');
    expect(code).not.toContain('buildSheetSide');
  });

  it('mostra que quem fecha pelo rodapé é o overlay — não existe botão componível', () => {
    const code = sheetSnippet();
    expect(code).toContain('footer: rodape');
    expect(code).toContain("[data-slot=\"sheet-overlay\"]");
    expect(code).not.toContain('SheetClose');
  });

  it('monta o painel sem rodapé quando a story não tem ações', () => {
    const code = sheetSnippet({ cancelLabel: false, applyLabel: false });
    expect(code).not.toContain('footer:');
    expect(code).not.toContain('const rodape');
  });

  it('troca o corpo conforme a composição, sempre com peças do design system', () => {
    const form = sheetSnippet({ body: 'form' });
    expect(form).toContain("import { createFormField } from '@/components/ui/form';");
    expect(form).toContain('createFormField({ label:');

    const navigation = sheetSnippet({ body: 'navigation' });
    expect(navigation).toContain(
      "corpo.setAttribute('aria-label', 'Navegação secundária');",
    );

    const paragrafos = sheetSnippet({ body: 'paragraphs', paragrafos: 8 });
    expect(paragrafos).toContain('i <= 8');
  });

  it('mostra a limpeza só quando a story trata dela', () => {
    expect(sheetSnippet()).not.toContain('destroy()');
    expect(sheetSnippet({ mostrarDestroy: true })).toContain('painel.destroy();');
  });

  it('não repete o import do botão quando o corpo também o usa', () => {
    const code = sheetSnippet({ body: 'actions' });
    expect(code.match(/from '@\/components\/ui\/button'/g)).toHaveLength(1);
  });
});

/**
 * O snippet ENSINA o que o preview MOSTRA.
 *
 * Os três casos abaixo nasceram de uma divergência medida: o painel Code
 * publicava um corpo em `div` com um texto curto enquanto o Playground
 * renderizava o parágrafo da Demonstração, e o rodapé do snippet vinha com
 * `spacing=sm` contra o `md` de todos os previews. Quem copiava recebia um
 * exemplo parecido, e não o que estava vendo.
 */
describe('paridade entre snippet e preview', () => {
  const CONTENT = sheetTranslations['pt-BR'];

  it('monta o corpo padrão como parágrafo, com o texto da Demonstração', () => {
    const code = sheetSnippet();
    expect(SHEET_BODY_TEXT).toBe(CONTENT.demonstration.labels.body);
    expect(code).toContain("const corpo = document.createElement('p');");
    expect(code).toContain(`corpo.textContent = '${SHEET_BODY_TEXT}';`);
    expect(code).not.toContain("const corpo = document.createElement('div');");
  });

  it('monta o rodapé com o mesmo espaçamento que os previews usam', () => {
    expect(sheetSnippet()).toContain("rodape.dataset.spacing = 'md';");
    expect(sheetSnippet()).not.toContain("rodape.dataset.spacing = 'sm';");
  });

  it('dá à edição de perfil os campos que o conteúdo compartilhado documenta', () => {
    const code = sheetSnippet({ body: 'profile' });
    const profile = CONTENT.variants.compositions.profileEdit;
    expect(code).toContain(
      `createFormField({ label: '${profile.fieldName}', input: createInput({ value: '${profile.fieldNameValue}' }) }),`,
    );
    expect(code).toContain(
      `createFormField({ label: '${profile.fieldHandle}', input: createInput({ value: '${profile.fieldHandleValue}' }) }),`,
    );
    expect(code).toContain(
      `createFormField({ label: '${profile.fieldBio}', input: createInput({ value: '${profile.fieldBioValue}' }) }),`,
    );
    // O corpo de filtros tem outros campos: trocar um pelo outro é o defeito
    // que esta composição existe para não repetir.
    expect(code).not.toContain('Categoria');
  });

  it('dá aos filtros os DOIS campos que o conteúdo compartilhado documenta', () => {
    const code = sheetSnippet({ body: 'form' });
    const filters = CONTENT.variants.compositions.advancedFilters;
    expect(code).toContain(
      `createFormField({ label: '${filters.fieldCategory}', input: createInput({ value: '${filters.categoryValue}' }) }),`,
    );
    expect(code).toContain(`createFormField({ label: '${filters.fieldMinPrice}',`);
    // O terceiro campo era invenção do snippet: nem o conteúdo nem a docs page
    // o descrevem.
    expect(code).not.toContain('Preço máximo');
    // `\x27` no lugar da aspa simples: o portão `identificador_pt_novo` descasca
    // literal de texto por PAREAMENTO de aspas, e não descasca regex — uma aspa
    // ímpar aqui inverte a paridade do arquivo inteiro daqui para baixo, e nomes
    // dentro de strings passam a contar como código. Medido nesta rodada.
    const labels = [...code.matchAll(/createFormField\(\{ label: \x27([^\x27]*)\x27/g)].map(
      (m) => m[1],
    );
    expect(labels).toEqual([filters.fieldCategory, filters.fieldMinPrice]);
  });

  it('religa a primária ao <form> pelo id quando o corpo é formulário (D10)', () => {
    // O rodapé é IRMÃO do corpo por construção da fábrica — é o que o mantém
    // visível enquanto o formulário rola —, então a primária nunca está dentro
    // do `<form>`. Sem `type: 'submit'` e sem o atributo `form`, o snippet
    // ensinaria um painel com formulário e NENHUMA forma de submeter: com dois
    // ou mais campos o navegador não faz o envio implícito, e o Enter não
    // dispara nada. É o defeito silencioso da ponta oposta ao submit órfão.
    for (const [body, id] of [
      ['form', 'filters'],
      ['profile', 'profile'],
    ] as const) {
      const code = sheetSnippet({ body });
      expect(code).toContain(`corpo.id = '${id}';`);
      expect(code).toContain("corpo.addEventListener('submit', (e) => e.preventDefault());");
      expect(code).toContain("type: 'submit' });");
      expect(code).toContain(`enviar.setAttribute('form', '${id}');`);
      expect(code).toContain('  enviar,');
    }

    // E só ali: sem formulário no corpo, `type: 'submit'` seria promessa vazia.
    for (const body of ['text', 'paragraphs', 'actions'] as const) {
      const code = sheetSnippet({ body });
      expect(code).not.toContain("type: 'submit'");
      expect(code).not.toContain("setAttribute('form'");
    }
  });

  it('dá ao painel inferior as TRÊS ações, com a destrutiva por último', () => {
    const code = sheetSnippet({ body: 'actions' });
    const [share, duplicate, remove] = CONTENT.variants.compositions.bottomPanel.actions;
    expect(code).toContain(`createButton({ variant: 'outline', label: '${share}' }),`);
    expect(code).toContain(`createButton({ variant: 'outline', label: '${duplicate}' }),`);
    // Só a última leva a variante que anuncia o peso: três destrutivas lado a
    // lado tirariam o peso justamente de quem precisa dele.
    expect(code).toContain(`createButton({ variant: 'destructive', label: '${remove}' }),`);
    // A fileira inteira, e não três substrings soltas: eram SEIS rótulos
    // inventados aqui, e uma asserção por rótulo teria passado com os outros
    // três ainda de pé.
    const row = [
      'corpo.append(',
      `  createButton({ variant: 'outline', label: '${share}' }),`,
      `  createButton({ variant: 'outline', label: '${duplicate}' }),`,
      `  createButton({ variant: 'destructive', label: '${remove}' }),`,
      ');',
    ].join('\n');
    expect(code).toContain(row);
  });

  it('dá ao menu as CINCO seções que o conteúdo compartilhado descreve', () => {
    const code = sheetSnippet({ body: 'navigation' });
    const nav = CONTENT.variants.compositions.secondaryNavigation;
    expect(code).toContain(`corpo.setAttribute('aria-label', '${nav.navLabel}');`);
    const sections = nav.items.map((item) => `'${item}'`).join(', ');
    expect(code).toContain(`for (const rotulo of [${sections}]) {`);
  });
});

describe('sheetSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const atDefaults = sheetSource('<div data-slot="sheet-content">', {});
    const atLeft = sheetSource('<div data-slot="sheet-content">', {
      args: { side: 'left', title: 'Menu' },
    });
    expect(atDefaults).not.toBe(atLeft);
    expect(atLeft).toContain("side: 'left'");
    expect(atLeft).toContain("title: 'Menu'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(sheetSource('<div data-slot="sheet-content" data-side="right">', {})).not.toContain(
      'data-side=',
    );
  });

  it('liga a linha do callback quando a story passa um spy nos args', () => {
    const code = sheetSource('', { args: { onOpenChange: () => {} } });
    expect(code).toContain('onOpenChange: (aberto) => registrarPainel(aberto)');
  });
});

describe('sheetSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const code = sheetSourceWith({ side: 'bottom' })('', { args: { side: 'right' } });
    expect(code).toContain("side: 'bottom'");
  });
});

describe('sheetHeadingH3Source', () => {
  it('imprime o nível do título que a story pede', () => {
    expect(sheetHeadingH3Source('', {})).toContain('titleLevel: 3');
  });

  it('e o nível padrão continua fora do snippet', () => {
    // A fábrica assume `2`. Repetir o padrão ensinaria ruído e apagaria a
    // informação de que existe um padrão — é a mesma regra do `side: 'right'`.
    expect(sheetSnippet()).not.toContain('titleLevel');
    expect(sheetSnippet({ titleLevel: 2 })).not.toContain('titleLevel');
  });
});

describe('sheetControladoSnippet', () => {
  it('abre pelo gatilho interno — a fábrica não expõe prop de estado', () => {
    const code = sheetControlledSnippet();
    expect(code).toContain("gatilhoInterno.classList.add('nds-sr-only');");
    expect(code).toContain('gatilhoInterno.click();');
    expect(code).toContain('onOpenChange: (estado) => { aberto = estado; }');
    expect(code).not.toContain('open: true');
  });
});

/**
 * Guarda de COERÊNCIA do snippet: toda referência tem de estar declarada.
 *
 * Nasceu de um defeito real — o snippet controlado declarava `gatilhoInterno` e
 * passava `trigger: triggerInterno`, um símbolo que não existia em lugar
 * nenhum. Quem copiasse recebia código que não roda, e nenhum portão via: os
 * três casos acima olhavam só linhas isoladas, e o snippet inteiro nunca foi
 * lido como programa.
 *
 * A varredura é sobre `chave: identificador,` — só identificador nu, porque
 * literal, chamada e arrow já se explicam sozinhos na própria linha.
 */
function referenciasSoltas(code: string): string[] {
  const declarados = new Set<string>();
  for (const m of code.matchAll(/\b(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/g)) {
    declarados.add(m[1]);
  }
  const soltas: string[] = [];
  for (const m of code.matchAll(/^\s{2,}[A-Za-z_$][\w$]*:\s*([A-Za-z_$][\w$]*),?\s*$/gm)) {
    const ref = m[1];
    if (ref === 'true' || ref === 'false' || ref === 'null' || ref === 'undefined') continue;
    if (!declarados.has(ref)) soltas.push(ref);
  }
  return soltas;
}

describe('coerência dos snippets', () => {
  it('não referencia símbolo que o próprio snippet não declara', () => {
    expect(referenciasSoltas(sheetSnippet({ body: 'form' }))).toEqual([]);
    expect(referenciasSoltas(sheetControlledSnippet())).toEqual([]);
    // Construtor de story entra na varredura como os demais: o que fica de fora
    // da lista sai da medição sem uma palavra, e foi assim que uma varredura
    // desta casa encolheu 28 exports com a suíte verde.
    expect(referenciasSoltas(sheetHeadingH3Source('', {}))).toEqual([]);
  });

  it('mostra showCloseButton só quando ele é desligado', () => {
    expect(sheetSnippet({})).not.toContain('showCloseButton');
    expect(sheetSnippet({ showCloseButton: false })).toContain('showCloseButton: false');
  });
});
