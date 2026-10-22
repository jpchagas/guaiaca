/**
 * Suggests a category for imported rows, in order of confidence:
 *   1. history  — what this description was categorized as before
 *   2. keywords — common Brazilian merchants and statement terms
 *   3. the bank's own category (BTG checking prints one)
 * Rules reference seeded category names; unknown names are skipped.
 */

const stripAccents = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** "ZAFFARI F. MACHAD", "Zaffari" → "zaffari f machad", "zaffari" */
export function descriptionKey(description) {
  return stripAccents(description || "")
    .toLowerCase()
    .replace(/\d+/g, " ")
    .replace(/[^a-z]+/g, " ")
    .trim();
}

const firstWord = (key) => key.split(" ").find((w) => w.length >= 3) || null;

// Order matters: the first rule that matches wins
const KEYWORD_RULES = [
  [/rentab|rendimento|resgate|dividend/, "Investimentos"],
  [/salario|folha pag|proventos/, "Salário"],
  [/estorno|reembolso|cashback/, "Reembolsos"],
  [/tarifa|anuidade|\biof\b|juros|encargo|cesta servi|mensalidade cesta/, "Tarifas bancárias"],
  [/emprestimo|financiamento|prestacao/, "Empréstimos / financiamentos"],
  [/netflix|spotify|prime video|amazon prime|disney|hbo|max\b|globoplay|youtube|apple com|google|icloud|deezer|apoiase|patreon|openai|chatgpt|anthropic|claude ai/, "Assinaturas"],
  [/zaffari|supermercad|mercado|bistek|carrefour|atacad|assai|nacional|big\b|hortifruti|fruta|acougue|carnes|carne|armazem|padaria|panificadora|kolonial/, "Supermercado"],
  [/ifood|restaurante|lanchonete|burger|pizza|sushi|empada|pastel|cafe|cafeteria|confeitaria|bakery|cupcake|doces|bistro|restobar|churrasc|delivery/, "Restaurantes"],
  [/\bbar\b|bares|pub\b|cervej|chopp/, "Bares"],
  [/uber|\b99\b|cabify|posto|abastec|combust|estacion|estafacil|veloe|sem parar|conectcar|garagem|pedagio|onibus|metro/, "Transporte"],
  [/raia|drogasil|panvel|farmacia|pharma|droga|unimed|hospital|clinica|laborat|academia|soulfit|smartfit|odonto|saude|obstetric|medic/, "Saúde & Bem-estar"],
  [/barbearia|barbershop|salao|estetica|laser|cabeleir|boticario|natura|sephora|manicure/, "Cuidados Pessoais"],
  [/petz|cobasi|petshop|pet shop|veterin/, "Animais de Estimação"],
  [/escola|faculdade|universidade|curso|udemy|alura|livraria/, "Educação"],
  [/cinema|ingresso|teatro|show|steam|playstation|xbox|nintendo|gaming|skate/, "Entretenimento & Lazer"],
  [/latam|gol linhas|azul linhas|\btap\b|airbnb|booking|hotel|pousada|decolar|hurb/, "Viagens"],
  [/vivo|claro|\btim\b|oi movel/, "Telefone"],
  [/net virtua|internet|fibra/, "Internet"],
  [/ceee|cee equatorial|cemig|enel|light s a|energia/, "Energia elétrica"],
  [/dmae|sabesp|corsan|agua/, "Água"],
  [/condominio/, "Condomínio"],
  [/leroy|tok stok|telhanorte|material|construcao|ferragem/, "Manutenção"],
  [/amazon|magalu|magazine|mercadolivre|mercado livre|shopee|aliexpress|renner|riachuelo|havan|decathlon|c a\b|zara|shein|lojas/, "Compras"],
  [/doacao|presente|vakinha/, "Doações & Presentes"],
];

// Bank categories (BTG checking) → seeded names
const BANK_CATEGORIES = {
  transporte: "Transporte",
  alimentacao: "Restaurantes",
  mercado: "Supermercado",
  saude: "Saúde & Bem-estar",
  educacao: "Educação",
  lazer: "Entretenimento & Lazer",
  viagem: "Viagens",
  compras: "Compras",
  investimentos: "Investimentos",
};

/**
 * @param categories  [{ id, name }]
 * @param history     existing transactions [{ description, category }]
 * @returns (row) => categoryId | null
 */
export function buildCategorySuggester({ categories = [], history = [] }) {
  const byName = {};
  categories.forEach((c) => {
    byName[descriptionKey(c.name)] = c.id;
  });
  const idOf = (name) => (name ? byName[descriptionKey(name)] || null : null);
  const valid = new Set(categories.map((c) => c.id));

  // Most frequent category per full description and per first word
  const counts = { full: {}, word: {} };
  const bump = (bucket, key, category) => {
    if (!key) return;
    bucket[key] = bucket[key] || {};
    bucket[key][category] = (bucket[key][category] || 0) + 1;
  };
  history.forEach((t) => {
    if (!t.category || !valid.has(t.category)) return;
    const key = descriptionKey(t.description);
    bump(counts.full, key, t.category);
    bump(counts.word, firstWord(key), t.category);
  });
  const top = (bucket, key) => {
    const entry = key && bucket[key];
    if (!entry) return null;
    return Object.entries(entry).sort((a, b) => b[1] - a[1])[0][0];
  };

  return (row) => {
    const key = descriptionKey(row.description);
    const fromHistory = top(counts.full, key) || top(counts.word, firstWord(key));
    if (fromHistory) return fromHistory;

    // Card refunds are reimbursements, whatever the merchant
    if (row.kind === "credit_card" && row.type === "credit") return idOf("Reembolsos");

    const haystack = `${key} ${descriptionKey(row.memo)}`;
    const rule = KEYWORD_RULES.find(([pattern]) => pattern.test(haystack));
    if (rule && idOf(rule[1])) return idOf(rule[1]);

    return idOf(BANK_CATEGORIES[descriptionKey(row.bankCategory)]) || null;
  };
}
