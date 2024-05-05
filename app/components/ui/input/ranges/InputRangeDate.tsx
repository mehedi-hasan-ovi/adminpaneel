import clsx from "clsx";
import { forwardRef, ReactNode, Ref, RefObject, useEffect, useImperativeHandle, useRef, useState } from "react";
import EntityIcon from "~/components/layouts/icons/EntityIcon";
import HintTooltip from "~/components/ui/tooltips/HintTooltip";

export interface RefInputDate {
  inputMin: RefObject<HTMLInputElement>;
  inputMax: RefObject<HTMLInputElement>;
}

interface Props {
  name: string;
  title: string;
  valueMin?: Date | null;
  onChangeMin?: (date: Date) => void;
  valueMax?: Date | null;
  onChangeMax?: (date: Date) => void;
  className?: string;
  help?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  hint?: ReactNode;
  icon?: string;
  darkMode?: boolean;
  autoFocus?: boolean;
}
const InputDate = (
  {
    name,
    title,
    valueMin,
    valueMax,
    onChangeMin,
    onChangeMax,
    className,
    help,
    disabled = false,
    readOnly = false,
    required = false,
    hint,
    icon,
    darkMode,
    autoFocus,
  }: Props,
  ref: Ref<RefInputDate>
) => {
  useImperativeHandle(ref, () => ({ inputMin, inputMax }));
  const inputMin = useRef<HTMLInputElement>(null);
  const inputMax = useRef<HTMLInputElement>(null);

  const [actualMin, setActualMin] = useState<string>("");
  const [actualMax, setActualMax] = useState<string>("");

  useEffect(() => {
    if (valueMin) {
      const date = new Date(valueMin);
      if (date) {
        setActualMin(date.toISOString().split("T")[0]);
      }
    }
  }, [valueMin]);

  useEffect(() => {
    if (valueMax) {
      const date = new Date(valueMax);
      if (date) {
        setActualMax(date.toISOString().split("T")[0]);
      }
    }
  }, [valueMax]);

  useEffect(() => {
    if (onChangeMin && actualMin) {
      const date = new Date(actualMin);
      if (date) {
        onChangeMin(date);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualMin]);

  useEffect(() => {
    if (onChangeMax && actualMax) {
      const date = new Date(actualMax);
      if (date) {
        onChangeMax(date);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualMax]);

  return (
    <div className={clsx(className, !darkMode && "text-gray-800")}>
      <label htmlFor={name} className="flex justify-between space-x-2 text-xs font-medium text-gray-600">
        <div className=" flex items-center space-x-1">
          <div className="truncate">
            {title}
            {required && <span className="ml-1 text-red-500">*</span>}
          </div>

          {help && <HintTooltip text={help} />}
        </div>
        {hint}
      </label>
      <div className="relative mt-1 flex w-full rounded-md">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <EntityIcon className="h-5 w-5 text-gray-400" icon={icon} />
          </div>
        )}

        <div className="flex w-full items-center space-x-2">
          <input
            ref={inputMin}
            type="date"
            id={name}
            name={`${name}-min`}
            required={required}
            value={actualMin}
            onChange={(e) => setActualMin(e.target.value)}
            disabled={disabled}
            readOnly={readOnly}
            autoFocus={autoFocus}
            className={clsx(
              "block w-full min-w-0 flex-1 rounded-md border-gray-300 focus:border-accent-500 focus:ring-accent-500 sm:text-sm",
              className,
              (disabled || readOnly) && "cursor-not-allowed bg-gray-100",
              icon && "pl-10"
            )}
          />
          <span className="text-gray-500">-</span>
          <input
            ref={inputMax}
            type="date"
            id={name}
            name={`${name}-max`}
            required={required}
            value={actualMax}
            onChange={(e) => setActualMax(e.target.value)}
            disabled={disabled}
            readOnly={readOnly}
            autoFocus={autoFocus}
            className={clsx(
              "block w-full min-w-0 flex-1 rounded-md border-gray-300 focus:border-accent-500 focus:ring-accent-500 sm:text-sm",
              className,
              (disabled || readOnly) && "cursor-not-allowed bg-gray-100",
              icon && "pl-10"
            )}
          />
        </div>
      </div>
    </div>
  );
};
export default forwardRef(InputDate);
