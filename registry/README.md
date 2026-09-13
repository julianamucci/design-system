# Nortear registry

JSONs gerados por [`scripts/build-registry.mjs`](../scripts/build-registry.mjs) a partir dos fontes em [`nortear-design-system-vanilla/`](../nortear-design-system-vanilla/). Consumidos pelo CLI [`nortear-cli`](../nortear-cli/).

```
registry/
└── v1/
    ├── index.json     ← índice (nomes, versões, deps internas)
    ├── init.json      ← camada base (lib/, tokens, themes) — rodar 1x via `nortear init`
    ├── button.json    ← componente + CSS
    └── alert.json     ← componente + CSS
```

Para regenerar:

```bash
node scripts/build-registry.mjs
```

Para servir em produção: publique `registry/v1/` em qualquer host HTTPS (GitHub Pages, Cloudflare Pages, R2, raw GitHub). O CLI aceita a URL via `--registry` ou no `nortear.json` do projeto consumidor.

Para incluir mais componentes, adicione o slug em `COMPONENTS`, que mora em [`scripts/registry-fontes.mjs`](../scripts/registry-fontes.mjs). Para alterar a camada base, edite `INIT_FILES` no mesmo módulo, e `INIT_ENTRY_IMPORTS` / `INIT_DEPS` no gerador.

## Editar um fonte e não regerar publica a versão anterior

Os manifestos **inlinam** o conteúdo dos fontes, e o que está aqui é o que outro projeto copia. Até 2026-09-13 nada vigiava isso: o gerador não tem `--check`, e editar `tokens.css`, um tema ou o `.ts`/`.css` de um componente empacotado sem rodar o comando acima deixava o registry distribuindo o texto velho — sem erro, sem aviso.

Foi descoberto por acaso, consertando o comentário de um token: a frase errada estava publicada no `init.json` também. Naquele dia o resto estava em dia, mas por disciplina e não por portão.

Agora o portão é `registry_defasado`, em `scripts/audit.mjs`. Ele confere três coisas: conteúdo publicado igual ao do fonte, arquivo do mapa presente no manifesto, e fonte do mapa existindo no disco.

**A régua sai de `registry-fontes.mjs`, o MESMO módulo que o gerador lê**, e isso é o ponto: o manifesto guarda só o `name` do arquivo, sem o caminho de origem. Um portão com mapa próprio compararia contra um caminho que o gerador já teria deixado de usar — verde medindo a coisa errada. Mover um fonte é uma edição só, e as duas pontas acompanham.

Schema completo em [`nortear-cli/README.md`](../nortear-cli/README.md#schema-do-manifesto).
