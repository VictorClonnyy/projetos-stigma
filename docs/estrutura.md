# Estrutura técnica

## Módulos principais

- `15-reference-base.js`: upload múltiplo de ZIPs, IndexedDB, pasta local opcional e renderização da base.
- `16-reference-analyzer.js`: leitura dos ZIPs e extração de padrões de features, steps e configs.
- `17-learning-memory.js`: memória local de correções e regras aceitas.
- `18-generation-logger.js`: logs em tempo real da geração.
- `19-diff-viewer.js`: diff simples antes/depois.
- `20-ai-reviewer.js`: revisão com IA no Analisador.

## Persistência

A base usa IndexedDB:

- banco: `apickli_reference_base`
- store de referências: `references`
- store de aprendizado: `learning`

## Salvamento em pasta local

Quando disponível, o botão **Escolher pasta local** usa `window.showDirectoryPicker`.

Essa função funciona principalmente em Chrome/Edge e exige permissão do usuário.
