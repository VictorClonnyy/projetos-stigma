/*
 * Apickli Studio v3 — Globals
 * Arquivo modular gerado a partir do HTML original.
 */

// ═══════════════════════════════════
// GLOBALS
// ═══════════════════════════════════
const SCENS = [
  {c:'400-auto',l:'400 - Auto (Schema)',a:1},{c:'200',l:'200/201 - Sucesso'},
  {c:'401',l:'401 - Não Autorizado'},{c:'403',l:'403 - Forbidden'},
  {c:'405',l:'405 - Método Inválido'},{c:'406',l:'406 - Não Aceitável'},
  {c:'415',l:'415 - Mídia Inválida'},{c:'429',l:'429 - Rate Limit'},
];
const act = new Set();
const mfields = new Map();
let flist = [], issues = [], originalFeatureContent = '';
let swaggerData = null, swaggerEndpoints = [];
let projectStructure = null;
let chatSwaggerContext = null, chatHistory = [];
let selectedGenEpIndex = -1;
let apiKey = '';
const API_STORAGE_KEY = 'apickli_openrouter_apikey';
const THEME_STORAGE_KEY = 'apickli_theme';
const LEGACY_API_STORAGE_KEYS = ['apickli_gemini_apikey', 'apickli_apikey'];
const OPENROUTER_MODEL = 'openrouter/free';
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
let detectedApps = { ok: '', nper: '', nq: '' };

// Base de referências local
let referenceBase = [];
let referenceDb = null;
let referenceFolderHandle = null;
let learningMemory = { corrections: [], rules: [] };
let pendingAIReviewLearning = null;
let lastGenerationReferences = [];
let lastGenerationValidation = null;
const REFERENCE_DB_NAME = 'apickli_reference_base';
const REFERENCE_DB_VERSION = 1;
const REFERENCE_STORE = 'references';
const LEARNING_STORE = 'learning';
const MAX_REFERENCE_SNIPPET_CHARS = 3500;
const MAX_REFERENCES_IN_PROMPT = 5;
const KNOWLEDGE_EXPORT_VERSION = '4.0';
