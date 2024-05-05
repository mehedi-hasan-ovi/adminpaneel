import React from "react";
import currencies from "~/application/pricing/currencies";
import InputSelector from "../input/InputSelector";

interface Props {
  className?: string;
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
}

export default function CurrencyToggle({ className, value, setValue }: Props) {
  // function changeCurrency(currency: string) {
  //   setValue(currency);
  // }
  return (
    <div className={className}>
      {/* <div className="hidden sm:flex w-full justify-center mb-0">
        <div className="flex justify-center items-center rounded-md">
          {currencies
            .filter((f) => !f.disabled)
            .map((currency, idx) => {
              return (
                <button
                  type="button"
                  v-for="(currency, idx) in currencies"
                  key={idx}
                  onClick={() => changeCurrency(currency.value)}
                  className={clsx(
                    "flex w-12 justify-center border border-slate-200 font-medium uppercase dark:border-gray-700",
                    value !== currency.value
                      ? "cursor-pointer bg-white p-2 text-xs dark:bg-gray-900 "
                      : "cursor-pointer border border-slate-300 bg-gray-50 p-2 text-xs shadow-md dark:border-gray-600 dark:bg-gray-700",
                    idx === 0 ? "rounded-l-md" : "",
                    idx === currencies.filter((f) => !f.disabled).length - 1 ? "rounded-r-md" : "border-r-0"
                  )}
                >
                  {currency.value}
                </button>
              );
            })}
        </div>
      </div> */}
      <InputSelector
        withSearch={false}
        className="hidden sm:flex"
        darkMode={true}
        name=""
        title=""
        withLabel={false}
        value={value}
        setValue={(e) => setValue(e?.toString() ?? "")}
        options={currencies
          .filter((f) => !f.disabled)
          .map((item) => {
            return {
              name: item.value.toUpperCase(), // + " - " + item.name,
              value: item.value,
            };
          })}
      />
      <InputSelector
        withSearch={false}
        className="sm:hidden"
        name=""
        title=""
        withLabel={false}
        value={value}
        setValue={(e) => setValue(e?.toString() ?? "")}
        options={currencies
          .filter((f) => !f.disabled)
          .map((item) => {
            return {
              name: item.value.toUpperCase(),
              value: item.value,
            };
          })}
      />
    </div>
  );
}
