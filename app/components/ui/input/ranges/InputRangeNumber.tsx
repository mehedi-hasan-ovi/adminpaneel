import clsx from "clsx";
import { forwardRef, ReactNode, Ref, RefObject, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import EntityIcon from "~/components/layouts/icons/EntityIcon";
import HintTooltip from "~/components/ui/tooltips/HintTooltip";

export interface RefInputRangeNumber {
  inputMin: RefObject<HTMLInputElement>;
  inputMax: RefObject<HTMLInputElement>;
}

interface Props {
  name?: string;
  title?: string;
  withLabel?: boolean;
  valueMin?: number | null;
  onChangeMin?: (value: number) => void;
  valueMax?: number | null;
  onChangeMax?: (value: number) => void;
  className?: string;
  help?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  hint?: ReactNode;
  step?: string;
  placeholder?: string;
  icon?: string;
  borderless?: boolean;
  autoFocus?: boolean;
}
const InputRangeNumber = (
  {
    name,
    title,
    withLabel = true,
    valueMin,
    onChangeMin,
    valueMax,
    onChangeMax,
    className,
    hint,
    help,
    disabled = false,
    readOnly = false,
    required = false,
    min = 0,
    max,
    step,
    placeholder,
    icon,
    borderless,
    autoFocus,
  }: Props,
  ref: Ref<RefInputRangeNumber>
) => {
  const { t } = useTranslation();

  useImperativeHandle(ref, () => ({ inputMin, inputMax }));
  const inputMin = useRef<HTMLInputElement>(null);
  const inputMax = useRef<HTMLInputElement>(null);

  const [actualMin, setActualMin] = useState<number | undefined>(valueMin ?? undefined);
  const [actualMax, setActualMax] = useState<number | undefined>(valueMax ?? undefined);

  useEffect(() => {
    setActualMin(valueMin ?? undefined);
  }, [valueMin]);

  useEffect(() => {
    setActualMax(valueMax ?? undefined);
  }, [valueMax]);

  useEffect(() => {
    if (onChangeMin) {
      onChangeMin(actualMin ?? 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualMin]);

  useEffect(() => {
    if (onChangeMax) {
      onChangeMax(actualMax ?? 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualMax]);

  return (
    <div className={clsx(className, "text-gray-800")}>
      {withLabel && (
        <label htmlFor={name} className="mb-1 flex justify-between space-x-2 text-xs font-medium text-gray-600">
          <div className=" flex items-center space-x-1">
            <div className="truncate">
              {title}
              {required && <span className="ml-1 text-red-500">*</span>}
            </div>

            {help && <HintTooltip text={help} />}
          </div>
          {hint}
        </label>
      )}
      <div className={clsx("relative flex w-full rounded-md")}>
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <EntityIcon className="h-5 w-5 text-gray-400" icon={icon} />
          </div>
        )}
        <div className="flex w-full items-center space-x-2">
          <input
            ref={inputMin}
            type="number"
            id={`${name}-min`}
            name={`${name}-min`}
            required={required}
            min={min}
            max={max}
            value={actualMin}
            onChange={(e) => setActualMin(Number(e.target.value) ?? 0)}
            step={step}
            placeholder={placeholder ?? t("shared.from") + "..."}
            disabled={disabled}
            readOnly={readOnly}
            autoFocus={autoFocus}
            className={clsx(
              "block w-full min-w-0 flex-1 rounded-md border-gray-300 focus:border-accent-500 focus:ring-accent-500 sm:text-sm",
              className,
              disabled || readOnly ? "cursor-not-allowed bg-gray-100" : "hover:bg-gray-50 focus:bg-gray-50",
              icon && "pl-10",
              borderless && "border-transparent"
            )}
          />
          <span className="text-gray-300">-</span>
          <input
            ref={inputMin}
            type="number"
            id={`${name}-max`}
            name={`${name}-max`}
            required={required}
            min={max}
            max={max}
            value={actualMax}
            onChange={(e) => setActualMax(Number(e.target.value) ?? 0)}
            step={step}
            placeholder={placeholder ?? t("shared.to") + "..."}
            disabled={disabled}
            readOnly={readOnly}
            className={clsx(
              "block w-full min-w-0 flex-1 rounded-md border-gray-300 focus:border-accent-500 focus:ring-accent-500 sm:text-sm",
              className,
              disabled || readOnly ? "cursor-not-allowed bg-gray-100" : "hover:bg-gray-50 focus:bg-gray-50",
              icon && "pl-10",
              borderless && "border-transparent"
            )}
          />
        </div>
      </div>
    </div>
  );
};
export default forwardRef(InputRangeNumber);
