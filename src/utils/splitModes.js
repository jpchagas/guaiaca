import { Balance, Insights, Percent } from "@mui/icons-material";

export const SPLIT_MODE_INFO = {
  equal: {
    label: "Divisão igual",
    short: "Igual",
    description: "Cada pessoa paga a mesma parte das despesas.",
    Icon: Balance,
  },
  proportional: {
    label: "Proporcional à renda",
    short: "Proporcional",
    description: "Quem ganha mais contribui com mais, com base nas receitas do mês de cada um.",
    Icon: Insights,
  },
  fixed: {
    label: "Percentual fixo",
    short: "Percentual fixo",
    description: "Vocês definem quanto cada pessoa paga, por exemplo 60% e 40%.",
    Icon: Percent,
  },
};
