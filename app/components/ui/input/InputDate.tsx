import clsx from "clsx";
import { forwardRef, ReactNode, Ref, RefObject, useEffect, useImperativeHandle, useRef, useState } from "react";
import EntityIcon from "~/components/layouts/icons/EntityIcon";
import HintTooltip from "~/components/ui/tooltips/HintTooltip";

export interface RefInputDate {
  input: RefObject<HTMLInputElement>;
}

interface Props {
  name?: string;
  title: string;
  defaultValue?: Date;
  value?: Date;
  onChange?: (date: Date) => void;
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
  { name, title, value, defaultValue, onChange, className, help, disabled = false, readOnly = false, required = false, hint, icon, darkMode, autoFocus }: Props,
  ref: Ref<RefInputDate>
) => {
  useImperativeHandle(ref, () => ({ input }));
  const input = useRef<HTMLInputElement>(null);

  const [actualValue, setActualValue] = useState<string>("");

  useEffect(() => {
    if (defaultValue) {
      setActualValue(defaultValue?.toISOString().split("T")[0]);
    }
  }, [defaultValue]);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (date) {
        setActualValue(date.toISOString().split("T")[0]);
      }
    }
  }, [value]);

  useEffect(() => {
    if (defaultValue) {
      const date = new Date(defaultValue);
      if (date) {
        setActualValue(date.toISOString().split("T")[0]);
      }
    }
  }, [defaultValue]);

  useEffect(() => {
    if (onChange && actualValue) {
      const date = new Date(actualValue);
      if (date) {
        onChange(date);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualValue]);

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
      <div className="relative mt-1 flex w-full rounded-md shadow-sm">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <EntityIcon className="h-5 w-5 text-gray-400" icon={icon} />
          </div>
        )}
        <input
          ref={input}
          type="date"
          id={name}
          name={name}
          required={required}
          value={actualValue}
          onChange={(e) => setActualValue(e.currentTarget.value)}
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
  );
};
export default forwardRef(InputDate);
