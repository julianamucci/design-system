# Tom de Voz — Guia de Escrita para Interfaces

Este arquivo define a personalidade, o nível de formalidade e os padrões de linguagem usados em todos os textos de interface do produto. As regras aqui complementam as **regras estruturais** definidas na seção 4 do arquivo `12-documentacao-componentes.md` — leia as duas em conjunto ao documentar um componente.

> **Relação com o arquivo 12**: o arquivo 12 define *como formatar* o texto (capitalização, pontuação, limites de caracteres). Este arquivo define *como soar* — a personalidade por trás das palavras.

---

## Personalidade da Voz

O produto fala como um **colega experiente que explica com clareza** — não como um manual técnico frio, nem como um assistente excessivamente animado. A voz tem quatro atributos centrais:

| Atributo | O que significa | O que não é |
|----------|----------------|-------------|
| **Amigável** | Próximo, acessível, sem distância artificial | Informal demais, coloquial, íntimo |
| **Claro** | Direto, sem ambiguidade, fácil de entender na primeira leitura | Simplório, superficial, condescendente |
| **Instrucional** | Guia o usuário para a próxima ação, antecipa dúvidas | Impositivo, excessivamente detalhado, didático em excesso |
| **Neutro regionalmente** | Compreensível para qualquer falante de português | Sem gírias, expressões regionais ou referências culturais locais |

---

## Formalidade e Tratamento

**Tratamento**: sempre "você" — nunca "tu", "o usuário" ou construções impessoais como "deve-se" ou "é necessário".

**Nível de formalidade**: semi-formal. Não usamos linguagem burocrática nem linguagem de conversa casual. O ponto de equilíbrio é o de uma documentação técnica bem escrita — profissional e acessível ao mesmo tempo.

```
✅  "Adicione um título para identificar este relatório."
❌  "O usuário deve inserir um título para identificação do relatório."
❌  "Bota um título aí pra identificar o relatório."
```

---

## Tom por Contexto

O tom não é fixo — ele se calibra conforme a situação. A voz permanece a mesma, mas a intensidade e o foco mudam.

### Instrução (labels, placeholders, helper text, tooltips)

Tom: **neutro e objetivo**. O foco é na tarefa, não na emoção. Sem encorajamento desnecessário, sem advertências prematuras.

```
✅  "Nome completo"
✅  "ex: João da Silva"
✅  "Use entre 8 e 20 caracteres."
❌  "Por favor, insira seu nome completo aqui!"
❌  "Atenção: este campo é obrigatório"
```

### Ação (labels de botão, CTAs, links de ação)

Tom: **direto e afirmativo**. O verbo no infinitivo descreve o que acontece ao clicar — sem rodeios, sem suavizações desnecessárias.

```
✅  "Salvar"  /  "Criar conta"  /  "Excluir item"
❌  "Clique para salvar"  /  "Quero criar minha conta"  /  "Sim, excluir"
```

### Confirmação e sucesso (Toast, Alert de sucesso)

Tom: **positivo, breve e concreto**. Confirma o que aconteceu — sem exagero, sem exclamações, sem "parabéns". O usuário sabe que funcionou; não precisa de celebração.

```
✅  "Alterações salvas."
✅  "Arquivo enviado com sucesso."
❌  "Ótimo! Suas alterações foram salvas com sucesso!"
❌  "Tudo certo! O arquivo foi enviado."
```

### Aviso (Alert de aviso, mensagem preventiva)

Tom: **claro e sem alarme**. Informa a consequência antes que ela aconteça. Não ameaça, não dramatiza.

```
✅  "Suas alterações não foram salvas. Saia sem salvar ou retorne para continuar."
✅  "Esta ação não pode ser desfeita."
❌  "ATENÇÃO: você está prestes a perder todas as suas alterações!"
❌  "Cuidado! Se você sair agora, vai perder tudo."
```

### Erro (Alert de erro, mensagem de validação, FormMessage)

Tom: **informativo e orientado à solução**. Descreve o que aconteceu e o que fazer — sem culpar o usuário, sem ser técnico demais, sem ser vago.

```
✅  "Email inválido. Use o formato nome@dominio.com"
✅  "Não foi possível salvar. Verifique sua conexão e tente novamente."
✅  "Senha muito curta. Use no mínimo 8 caracteres."
❌  "Erro!"
❌  "Campo inválido."
❌  "Você digitou o email errado."
❌  "Ocorreu um erro inesperado no servidor. Código: 500."
```

### Estado vazio (Empty state)

Tom: **encorajador sem exagero**. Reconhece que não há conteúdo, sugere a próxima ação de forma natural.

```
✅  "Nenhum item ainda. Adicione o primeiro para começar."
✅  "Sem resultados para esta busca. Tente outros termos."
❌  "Ops! Parece que não há nada aqui ainda..."
❌  "Lista vazia."
```

### Diálogo de confirmação (Dialog destrutivo)

Tom: **neutro e factual**. O título nomeia a ação. A descrição apresenta a consequência. Os botões confirmam ou cancelam sem drama.

```
✅  Título: "Excluir conta"
    Descrição: "Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita."
    Botão primário: "Excluir"  |  Botão secundário: "Cancelar"

❌  Título: "Tem certeza?"
    Descrição: "Isso vai apagar TUDO para sempre!"
    Botão primário: "Sim, pode excluir"  |  Botão secundário: "Não, voltar"
```

---

## Terminologia

### Termos aprovados

Use sempre os termos abaixo quando precisar nomear ações ou elementos de interface. Consistência na terminologia reduz confusão entre design, desenvolvimento e usuário final.

| Contexto | Use | Evite |
|----------|-----|-------|
| Persistir dados | Salvar | Gravar, registrar, guardar |
| Criar novo item | Adicionar, criar | Inserir, incluir, cadastrar |
| Remover item | Excluir | Deletar, apagar, remover (use "remover" apenas para desvincular, não destruir) |
| Voltar ao estado anterior | Cancelar, descartar | Abortar, sair sem salvar (use descrição completa em Dialogs) |
| Enviar formulário ou arquivo | Enviar | Submeter, fazer upload de (use "enviar" para a ação, "arquivo" para o objeto) |
| Alterar configuração | Editar, configurar | Modificar, ajustar, tweakar |
| Carregar conteúdo | Carregar | Fazer download de, baixar (use "baixar" só quando o arquivo vai para o dispositivo do usuário) |
| Elemento sem permissão | Desabilitado | Bloqueado, inativo, indisponível |
| Operação em andamento | Carregando, processando | Loading, aguarde, por favor espere |

### Termos técnicos — quando usar e quando traduzir

O produto é uma ferramenta técnica. Alguns termos em inglês são mais precisos e reconhecidos do que suas traduções. Use o critério abaixo:

| Termo técnico | Decisão | Razão |
|---------------|---------|-------|
| `Toast` | Manter em inglês na doc interna; traduzir para "notificação" na UI | Desenvolvedores conhecem o termo; usuários finais não |
| `Modal` / `Dialog` | Usar "janela de confirmação" ou "janela de diálogo" na UI | Mais claro para o usuário final |
| `Toggle` | Usar "alternar" ou "ativar/desativar" na UI | "Toggle" é jargão de interface |
| `Upload` | Manter na UI quando acompanhado de contexto | Amplamente reconhecido em português do Brasil |
| `Input` | Usar "campo" na UI | "Input" é jargão técnico |
| `Badge` | Usar "etiqueta" ou manter "badge" conforme o contexto | Depende do público da tela |
| `Checkbox` | Manter na UI | Amplamente reconhecido, sem tradução consolidada |

### Palavras a evitar

Estas palavras introduzem ambiguidade, tom inadequado ou regionalismos:

- **Gírias e coloquialismos**: "trampo", "tá", "né", "cara", "bacana", "massa", "show"
- **Regionalismos**: "saudade" (contexto inadequado), expressões típicas de uma região específica do Brasil
- **Falsa urgência**: "agora", "já", "imediatamente" (use apenas quando a urgência é real)
- **Eufemismos técnicos**: "solução", "plataforma", "ecossistema" (use o nome concreto do que é)
- **Verbos fracos em CTAs**: "clique aqui", "saiba mais", "veja" (prefira o verbo da ação: "ver detalhes", "explorar componentes")
- **Superlativos desnecessários**: "melhor", "incrível", "perfeito", "ótimo" em contextos funcionais

---

## Padrões de Frase por Tipo de Texto

### Helper text (texto de apoio abaixo de campos)

Estrutura: **restrição ou formato esperado**, em frase curta afirmativa.

```
✅  "Use entre 8 e 20 caracteres."
✅  "Apenas letras e números."
✅  "O nome será exibido publicamente."
❌  "Por favor, certifique-se de usar entre 8 e 20 caracteres."
❌  "Atenção: só são aceitos letras e números!"
```

### Placeholder

Estrutura: **exemplo real do formato esperado**, não uma instrução disfarçada de exemplo.

```
✅  "ex: joao@empresa.com.br"
✅  "ex: (11) 99999-9999"
✅  "ex: Janeiro 2025"
❌  "Digite seu email"
❌  "Insira o número de telefone com DDD"
```

### Mensagem de validação inline (FormMessage)

Estrutura: **o que está errado + o que fazer**, em uma frase.

```
✅  "Email inválido. Use o formato nome@dominio.com"
✅  "Senha muito curta. Mínimo de 8 caracteres."
✅  "Selecione pelo menos uma opção."
❌  "Campo obrigatório."       (vago — não orienta)
❌  "Valor inválido."           (vago — não orienta)
❌  "Erro de validação: email." (jargão técnico)
```

### Título de Dialog

Estrutura: **substantivo + complemento** descrevendo a ação, sem ponto final.

```
✅  "Excluir relatório"
✅  "Alterar senha"
✅  "Confirmar envio"
❌  "Tem certeza?"       (pergunta — gera ambiguidade)
❌  "Atenção!"           (alarmista — não descreve a ação)
❌  "Excluir relatório." (ponto final desnecessário)
```

### Descrição de Dialog

Estrutura: **consequência da ação** em frase completa com ponto final. Máximo 2 frases.

```
✅  "O relatório será excluído permanentemente. Esta ação não pode ser desfeita."
✅  "Sua senha atual será substituída. Você precisará usar a nova senha no próximo acesso."
❌  "Isso vai excluir o relatório para sempre e você não vai conseguir recuperar depois, então tenha certeza antes de prosseguir."
```

### Label de Badge de status

Estrutura: **adjetivo ou substantivo**, 1–2 palavras, sem verbo, sem ponto final.

```
✅  "Ativo"  /  "Pendente"  /  "Em análise"  /  "Concluído"
❌  "Está ativo"  /  "Aguardando análise"  /  "Foi concluído"
```

---

## Aplicação nos Componentes com UX Writing

Referência rápida de como o tom se aplica a cada componente com texto obrigatório (definidos na seção 4 do arquivo `12-documentacao-componentes.md`):

| Componente | Tom | Observação |
|------------|-----|------------|
| Button | Direto, afirmativo | Verbo no infinitivo. Sem pontuação. Máximo 3 palavras |
| Input / Textarea | Neutro, objetivo | Label: substantivo. Placeholder: exemplo real. Helper: restrição afirmativa |
| Select | Neutro, objetivo | Placeholder: "Selecione..." (não "-- Escolha --"). Opções consistentes entre si |
| Checkbox / Switch | Neutro | Label descreve o estado ativo: "Receber notificações" (não "Notificações") |
| Dialog (destrutivo) | Factual, sem drama | Título: ação. Descrição: consequência. Botão primário: repete o verbo do título |
| Dialog (neutro) | Instrucional | Título: ação. Descrição: contexto ou instrução. Botão primário: confirma |
| Alert (sucesso) | Positivo, breve | Passado simples. Sem exclamação. Sem "parabéns" |
| Alert (erro) | Informativo, orientado | Causa + orientação. Sem culpar o usuário |
| Alert (aviso) | Claro, sem alarme | Consequência + opção de ação |
| Toast / Sonner | Conciso | Máximo 1 frase. Sem pontuação de ênfase |
| Badge | Neutro | Adjetivo ou estado. 1–2 palavras |
| Tooltip | Informativo | Complementa, não repete o label do trigger |
| Empty State | Encorajador, natural | Título: o que não existe. Descrição: o que fazer |
| Pagination | Neutro | "Anterior" e "Próxima" — sem abreviações |
| Card (com título) | Neutro | Título: substantivo ou frase nominal. Descrição: complemento direto |

---

## Checklist de Revisão de Texto

Antes de considerar o texto de um componente finalizado:

**Voz e tom:**
- [ ] O texto soa como um colega experiente — nem frio demais, nem informal demais
- [ ] Não há gírias, regionalismos ou expressões coloquiais
- [ ] Não há "por favor", "atenção!" ou falsa urgência
- [ ] O tom está calibrado para o contexto (instrução, erro, sucesso, aviso)

**Clareza:**
- [ ] O texto é compreensível na primeira leitura, sem conhecimento técnico prévio
- [ ] Termos técnicos foram traduzidos ou contextualizados quando o público é o usuário final
- [ ] Não há ambiguidade — uma leitura, um significado

**Formato (aplicar em conjunto com arquivo 12, seção 4):**
- [ ] Voz ativa — sujeito + verbo + objeto
- [ ] Tratamento em "você" quando há sujeito explícito
- [ ] Capitalização: apenas primeira palavra
- [ ] Pontuação: ponto final só em frases completas
- [ ] Limite de caracteres respeitado para o tipo de elemento

**Ícones e emojis nas translations:**
- [ ] Nenhum emoji (✅, ❌, 🎉...) ou símbolo de ícone (✓, ✗) foi inserido dentro de chaves de `translations.json`
- [ ] Ícones e símbolos são sempre renderizados por JSX — nunca embutidos no texto das translations
- [ ] Razão: emojis no texto + ícone JSX = duplicação visual; emojis em translations = inconsistência quando o JSX de outra seção usa símbolos

**Padrão obrigatório para ícones ✓/✗ (certo/errado):**

Use sempre os pill classes abaixo — garantem tamanho, cor, background e espaçamento consistentes:

```tsx
{/* ✓ certo / do — green pill */}
<span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>

{/* ✗ errado / don't — red pill */}
<span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
```

Regras de espaçamento:
- Em containers `flex` com `gap-*` (ex: `<h4 className="flex items-center gap-2">`): **não adicione `mr-*`** — o gap já controla o espaço
- Em `<th>` / `<td>` ou qualquer contexto não-flex: envolva ícone + texto em um `<span className="flex items-center gap-1.5">` — **nunca use `mr-*` em elemento inline**, o comportamento de margem em contexto não-flex é inconsistente entre browsers

```tsx
{/* ✅ Correto — wrapper flex dentro do th */}
<th className="p-3 font-semibold text-green-700 dark:text-green-400">
  <span className="flex items-center gap-1.5">
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
    Correto
  </span>
</th>

{/* ❌ Errado — mr-* em inline-flex dentro de contexto não-flex */}
<th><span className="inline-flex ... mr-1.5">✓</span>Correto</th>
```

Para outros indicadores de estado (ex: "feature presente" na seção de acessibilidade), use a mesma estrutura mas com a cor semântica do contexto:

```tsx
{/* ✓ feature presente — primary pill */}
<span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">✓</span>
```

**Terminologia:**
- [ ] Termos de ação seguem a tabela de termos aprovados (Salvar, Adicionar, Excluir...)
- [ ] Nenhuma palavra da lista de termos a evitar foi usada

---

## Relação com Outros Arquivos

| Arquivo | O que define | Relação com este arquivo |
|---------|-------------|--------------------------|
| `12-documentacao-componentes.md` seção 4 | Regras estruturais de escrita (formato, capitalização, pontuação, limites) | Base obrigatória — aplique antes das regras deste arquivo |
| `06-form-components.md` | Labels e placeholders específicos de cada componente de formulário | Terminologia específica deve ser consistente com este arquivo |
| `07-feedback-components.md` | Alert, Badge, Progress, Sonner | Tom de feedback deve seguir as seções "Confirmação", "Aviso" e "Erro" deste arquivo |
| `10-overlay-components.md` | Dialog, Drawer, Sheet, Tooltip | Títulos e descrições de overlays seguem as seções "Ação" e "Diálogo" deste arquivo |