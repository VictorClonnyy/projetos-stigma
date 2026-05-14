# Apickli Studio v4 — Referências Inteligentes + OpenRouter

Interface web local para importar Swagger/OpenAPI, gerar features Apickli/Cucumber com IA, usar ZIPs de projetos resolvidos como referência e manter uma memória local de aprendizado.

## Como rodar

Entre na pasta que contém `index.html` e rode:

```bash
python -m http.server 8000
```

Depois abra:

```text
http://localhost:8000/index.html
```

## O que há de novo na v4

### Base de Referências

A aba **Base de Referências** permite enviar vários ZIPs de projetos já resolvidos. O sistema lê os arquivos, extrai padrões e salva localmente no navegador via IndexedDB.

Ele analisa:

- arquivos `.feature`;
- `steps.js` e step definitions;
- configs JSON;
- apps OK/NPER/NQ;
- bodies default;
- códigos de status usados;
- prefixos de errorCode;
- padrões de cenários 400, 401, 403, 405, 415, 429;
- score de qualidade do projeto.

### Controle de confiança por ZIP

Cada projeto pode ser marcado como:

- **Ativo**: pode ser usado normalmente;
- **Confiável**: recebe mais peso no ranking;
- **Legado**: recebe menos peso;
- **Ignorado**: não é usado pela IA.

### Ranking de referências usadas

Durante a geração, o sistema mostra quais projetos foram usados como base e por quê.

Exemplo:

```text
1. orders-v1.zip — score 92 — termo parecido: orders; mesmo método POST; alta qualidade
2. customers-v2.zip — score 71 — validação 400; app NPER; steps reais
```

### Logs em tempo real

A geração agora exibe etapas como:

```text
Etapa 1/6 — Preparando contexto do endpoint
Etapa 2/6 — Buscando referências locais
Etapa 3/6 — Aplicando memória local
Etapa 4/6 — Chamando OpenRouter
Etapa 5/6 — Pedindo autocorreção para a IA
Etapa 6/6 — Montando steps.js e config.json
```

### Validação automática da resposta da IA

Depois da resposta, o sistema valida se a feature possui:

- `Feature:`;
- `Scenario:`;
- `Given/When/Then`;
- nome esperado da feature;
- método HTTP esperado;
- path esperado.

Se algo estiver inconsistente, ele chama a IA novamente para tentar corrigir.

### Analisador com IA

Na aba **Analisador**, você pode colar o output do `npm test` e a feature original. O sistema usa:

- erro do teste;
- feature original;
- referências locais;
- memória de aprendizado;
- OpenRouter.

Ele retorna:

- resumo dos problemas;
- referências usadas;
- mudanças sugeridas;
- feature corrigida;
- diff antes/depois;
- regra de aprendizado sugerida.

A regra só entra na memória quando você clicar em **Salvar aprendizado da revisão com IA**.

### Memória local de aprendizado

Na aba **Base de Referências**, você pode criar regras manuais, como:

```text
Para validação de schema nesse padrão, usar 422 em vez de 400.
```

As regras ficam salvas no navegador e são enviadas junto nos próximos prompts de geração.

### Exportar/importar conhecimento

Você pode exportar um JSON com:

- análises dos projetos de referência;
- status de confiança;
- observações;
- regras aprendidas;
- correções aceitas.

Arquivo gerado:

```text
apickli-knowledge-base.json
```

Por segurança e tamanho, esse JSON exporta o conhecimento extraído, não os ZIPs binários.

## API de IA

O projeto usa OpenRouter:

```js
openrouter/free
```

A API key é salva localmente no navegador em:

```text
apickli_openrouter_apikey
```

Para uso público, o ideal é criar um backend/proxy para proteger a chave.

## Estrutura

```text
apickli-studio-modular/
├── index.html
├── assets/
│   ├── css/styles.css
│   └── js/
│       ├── 01-config.js
│       ├── 02-init.js
│       ├── 03-api-key.js
│       ├── 04-navigation.js
│       ├── 05-swagger-import.js
│       ├── 06-ai-generation.js
│       ├── 07-manual-generator.js
│       ├── 08-state.js
│       ├── 09-swagger-helpers.js
│       ├── 10-openrouter-client.js
│       ├── 11-info-page.js
│       ├── 12-chat.js
│       ├── 13-analyzer.js
│       ├── 14-utils-and-start.js
│       ├── 15-reference-base.js
│       ├── 16-reference-analyzer.js
│       ├── 17-learning-memory.js
│       ├── 18-generation-logger.js
│       ├── 19-diff-viewer.js
│       └── 20-ai-reviewer.js
└── docs/
```

## Observações importantes

- O aprendizado é local. A IA não é treinada permanentemente pela OpenRouter.
- O sistema melhora porque guarda referências, regras e correções e envia isso no prompt.
- IndexedDB é por navegador/perfil. Para transferir conhecimento, use exportar/importar.
- Navegador só grava em pasta local com permissão do usuário e suporte ao File System Access API.
