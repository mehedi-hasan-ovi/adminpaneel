import {describe, it, expect} from 'vitest'
import currencies from "./currencies";
import { CurrencyDto } from "../dtos/subscriptions/CurrencyDto";

describe("currencies", () => {
  it("should contain the correct list of currencies", () => {
    const expectedCurrencies: CurrencyDto[] = [
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

    expect(currencies).toHaveLength(expectedCurrencies.length);

    currencies.forEach((currency, index) => {
      const expectedCurrency = expectedCurrencies[index];
      expect(currency).toMatchObject(expectedCurrency);
    });
  });
});
