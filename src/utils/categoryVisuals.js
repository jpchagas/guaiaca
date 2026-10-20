import {
  Payments,
  Storefront,
  ShowChart,
  Replay,
  Apartment,
  Bolt,
  WaterDrop,
  LocalFireDepartment,
  Wifi,
  Build,
  PhoneIphone,
  AccountBalance,
  ShoppingCart,
  Restaurant,
  LocalBar,
  DirectionsCar,
  ShoppingBag,
  Spa,
  CardGiftcard,
  Favorite,
  Subscriptions,
  Flight,
  Movie,
  ReceiptLong,
  RequestQuote,
  School,
  FamilyRestroom,
  Pets,
  LabelOutlined,
} from "@mui/icons-material";

// Muted, premium tones grouped by spending family
const TONES = {
  income: "#1F8A5B",
  home: "#3B6A8F",
  utilities: "#2A7F86",
  food: "#B7862F",
  lifestyle: "#7A4E8C",
  transport: "#4C5BA8",
  health: "#B4536A",
  finance: "#5E6B65",
};

const VISUALS = {
  salario: { Icon: Payments, color: TONES.income },
  receita_de_negocios: { Icon: Storefront, color: TONES.income },
  investimentos: { Icon: ShowChart, color: "#B7862F" },
  reembolsos: { Icon: Replay, color: TONES.income },
  condominio: { Icon: Apartment, color: TONES.home },
  energia_eletrica: { Icon: Bolt, color: TONES.utilities },
  agua: { Icon: WaterDrop, color: TONES.utilities },
  gas: { Icon: LocalFireDepartment, color: TONES.utilities },
  internet: { Icon: Wifi, color: TONES.utilities },
  manutencao: { Icon: Build, color: TONES.home },
  telefone: { Icon: PhoneIphone, color: TONES.utilities },
  impostos: { Icon: AccountBalance, color: TONES.finance },
  supermercado: { Icon: ShoppingCart, color: TONES.food },
  restaurantes: { Icon: Restaurant, color: TONES.food },
  bares: { Icon: LocalBar, color: TONES.food },
  transporte: { Icon: DirectionsCar, color: TONES.transport },
  compras: { Icon: ShoppingBag, color: TONES.lifestyle },
  cuidados_pessoais: { Icon: Spa, color: TONES.health },
  doacoes_presentes: { Icon: CardGiftcard, color: TONES.lifestyle },
  saude_bem_estar: { Icon: Favorite, color: TONES.health },
  assinaturas: { Icon: Subscriptions, color: TONES.lifestyle },
  viagens: { Icon: Flight, color: TONES.transport },
  entretenimento_lazer: { Icon: Movie, color: TONES.lifestyle },
  tarifas_bancarias: { Icon: ReceiptLong, color: TONES.finance },
  emprestimos_financiamentos: { Icon: RequestQuote, color: TONES.finance },
  educacao: { Icon: School, color: TONES.transport },
  familia_filhos: { Icon: FamilyRestroom, color: TONES.health },
  animais_de_estimacao: { Icon: Pets, color: TONES.food },
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
