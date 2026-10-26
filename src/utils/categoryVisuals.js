import {
  Payments,
  Storefront,
  ShowChart,
  Replay,
  Home,
  ShoppingCart,
  Restaurant,
  DirectionsBus,
  DirectionsCar,
  Favorite,
  FitnessCenter,
  Spa,
  Movie,
  Flight,
  Subscriptions,
  School,
  Pets,
  CardGiftcard,
  FamilyRestroom,
  AccountBalance,
  ShoppingBag,
  RequestQuote,
  MoreHoriz,
  LabelOutlined,
} from "@mui/icons-material";

// Muted, premium tones grouped by spending family
const TONES = {
  income: "#1F8A5B",
  home: "#3B6A8F",
  food: "#B7862F",
  lifestyle: "#7A4E8C",
  transport: "#4C5BA8",
  health: "#B4536A",
  finance: "#5E6B65",
};

// Keyed by normalizeCategoryKey(name); see src/scripts/seedCategories.js
const VISUALS = {
  salario: { Icon: Payments, color: TONES.income },
  receita_de_negocios: { Icon: Storefront, color: TONES.income },
  investimentos: { Icon: ShowChart, color: "#B7862F" },
  reembolsos: { Icon: Replay, color: TONES.income },
  moradia: { Icon: Home, color: TONES.home },
  alimentacao: { Icon: ShoppingCart, color: TONES.food },
  restaurantes_e_delivery: { Icon: Restaurant, color: TONES.food },
  transporte: { Icon: DirectionsBus, color: TONES.transport },
  veiculo: { Icon: DirectionsCar, color: TONES.transport },
  saude: { Icon: Favorite, color: TONES.health },
  academia_e_esportes: { Icon: FitnessCenter, color: TONES.health },
  cuidados_pessoais: { Icon: Spa, color: TONES.health },
  lazer_e_entretenimento: { Icon: Movie, color: TONES.lifestyle },
  viagens: { Icon: Flight, color: TONES.transport },
  assinaturas: { Icon: Subscriptions, color: TONES.lifestyle },
  educacao: { Icon: School, color: TONES.home },
  pets: { Icon: Pets, color: TONES.food },
  presentes_e_doacoes: { Icon: CardGiftcard, color: TONES.lifestyle },
  familia_e_filhos: { Icon: FamilyRestroom, color: TONES.health },
  impostos_e_taxas: { Icon: AccountBalance, color: TONES.finance },
  compras: { Icon: ShoppingBag, color: TONES.lifestyle },
  emprestimos_e_dividas: { Icon: RequestQuote, color: TONES.finance },
  outros: { Icon: MoreHoriz, color: TONES.finance },
};

const FALLBACK = { Icon: LabelOutlined, color: TONES.finance };

// Same normalization as src/scripts/seedCategories.js
export function normalizeCategoryKey(str = "") {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function getCategoryVisual(category) {
  if (!category) return FALLBACK;
  const key = normalizeCategoryKey(category.name || category.key || "");
  return VISUALS[key] || FALLBACK;
}
