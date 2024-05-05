import { CurrencyDto } from "../dtos/subscriptions/CurrencyDto";

const currencies: CurrencyDto[] = [
  {
    name: "United States Dollar",
    value: "usd",
    symbol: "$",
    default: true,
    disabled: false,
    parities: [{ from: "usd", parity: 1 }],
  },
  {
    name: "Euro",
    value: "eur",
    symbol: "€",
    disabled: true,
    parities: [{ from: "usd", parity: 1 }],
  },
  {
    name: "Great Britain Pound",
    value: "gbp",
    symbol: "£",
    disabled: true,
    parities: [{ from: "usd", parity: 0.85 }],
  },
  {
    name: "Indian Rupee",
    value: "inr",
    symbol: "₹",
    disabled: true,
    parities: [{ from: "usd", parity: 79.96 }],
  },
  {
    name: "Mexican Peso",
    value: "mxn",
    symbol: "$",
    disabled: false,
    parities: [{ from: "usd", parity: 20.03 }],
  },
  {
    name: "Canadian Dollar",
    value: "cad",
    symbol: "$",
    disabled: true,
    parities: [{ from: "usd", parity: 1.3 }],
  },
];
export default currencies;
