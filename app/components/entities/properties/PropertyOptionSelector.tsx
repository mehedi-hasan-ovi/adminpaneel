import { Fragment, ReactNode, useEffect, useRef, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { PropertyOption } from "@prisma/client";
import clsx from "clsx";
import { PropertyWithDetails } from "~/utils/db/entities/entities.db.server";
import SelectorIcon from "~/components/ui/icons/SelectorIcon";
import { useTranslation } from "react-i18next";
import HintTooltip from "~/components/ui/tooltips/HintTooltip";
import EntityIcon from "~/components/layouts/icons/EntityIcon";
import CheckIcon from "~/components/ui/icons/CheckIcon";
import InputRadioGroupCards from "~/components/ui/input/InputRadioGroupCards";
import { SelectOptionsDisplay } from "~/utils/shared/SelectOptionsUtils";
import RenderOption from "./select/RenderOption";

interface Props {
  className?: string;
  property: PropertyWithDetails;
  disabled: boolean;
  initial: string | undefined;
  help?: string;
  hint?: ReactNode;
  icon?: string;
  autoFocus?: boolean;
  onSelected: (item: string | undefined) => void;
  display?: SelectOptionsDisplay;
}

const PropertyOptionSelector = (props: Props) => {
  const [selected, setSelected] = useState<string | undefined>(props.initial);

  useEffect(() => {
    setSelected(props.initial);
  }, [props.initial]);

  useEffect(() => {
    props.onSelected(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  return (
    <>
      {!props.property.subtype || props.property.subtype === "dropdown" ? (
        <InputDropdown {...props} selected={selected} setSelected={setSelected} />
      ) : props.property.subtype === "radioGroupCards" ? (
        <InputRadioGroupCards
          title={props.property.title}
          name={props.property.name}
          disabled={props.disabled}
          options={props.property.options.map((f) => {
            return {
              value: f.value,
              name: f.name ?? f.value,
            };
          })}
          value={selected}
          onChange={(e) => {
            setSelected(e);
          }}
        />
      ) : null}
    </>
  );
};

function InputDropdown({
  className,
  property,
  disabled,
  initial,
  onSelected,
  help,
  hint,
  icon,
  autoFocus,
  selected,
  setSelected,
  display,
}: Props & { selected: string | undefined; setSelected: (item: string | undefined) => void }) {
  const { t } = useTranslation();
  const button = useRef<HTMLButtonElement>(null);

  const [selectedOption, setSelectedOption] = useState<PropertyOption | undefined>(undefined);

  useEffect(() => {
    setSelectedOption(property.options.find((f) => f.value === selected));
  }, [property.options, selected]);

  function hasColors() {
    return property.options.find((f) => f.color);
  }
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={property.name} className="flex justify-between space-x-2 text-xs font-medium text-gray-600 ">
          <div className=" flex items-center space-x-1">
            <div className="truncate">
              {t(property.title)}
              {property.isRequired && <span className="ml-1 text-red-500">*</span>}
            </div>
            <div className="">{help && <HintTooltip text={help} />}</div>
          </div>
          {hint}
        </label>
        <div className="mt-1">
          <input type="hidden" name={property.name} value={selected} required={property.isRequired} disabled={selected === undefined} />
          <Listbox value={selected} onChange={(e) => setSelected(e)} disabled={disabled}>
            {({ open }) => (
              <>
                <div className={clsx("relative", className)}>
                  <Listbox.Button
                    // disabled={true}
                    ref={button}
                    autoFocus={autoFocus}
                    className={clsx(
                      "relative w-full cursor-default rounded-md border border-gray-300 py-2 pl-3 pr-10 text-left text-gray-800 shadow-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 sm:text-sm",
                      disabled ? "cursor-not-allowed bg-gray-100" : "bg-white"
                    )}
                  >
                    {icon && (
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <EntityIcon className="h-5 w-5 text-gray-400" icon={icon} />
                      </div>
                    )}
                    <div className={clsx("flex items-center space-x-2", icon && "pl-8")}>
                      {selectedOption ? (
                        <>
                          <RenderOption option={selectedOption} display={display} hasColors={!!hasColors()} />
                        </>
                      ) : (
                        <div className="text-gray-500">
                          {t("shared.select")} <span className="lowercase">{t(property.title)}</span>...
                        </div>
                      )}
                    </div>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <SelectorIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>

                  <Transition show={open} as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {property.options.length === 0 && (
                        <div className=" flex select-none justify-center p-2 text-red-500">{!property ? "Select a field type" : "There are no values"}</div>
                      )}
                      {property.options
                        .sort((a, b) => a.order - b.order)
                        .map((item, idx) => (
                          <Listbox.Option
                            key={idx}
                            className={({ active }) =>
                              clsx(active ? "bg-accent-600 text-white" : "text-gray-900", "relative cursor-default select-none py-2 pl-3 pr-9")
                            }
                            value={item.value}
                          >
                            {({ selected, active }) => (
                              <>
                                <div className="flex items-center space-x-2">
                                  <RenderOption option={item} display={display} hasColors={!!hasColors()} />
                                </div>

                                {selected ? (
                                  <span className={clsx(active ? "text-white" : "text-accent-600", "absolute inset-y-0 right-0 flex items-center pr-4")}>
                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                  </span>
                                ) : null}
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </>
            )}
          </Listbox>
        </div>
      </div>
    </div>
  );
}

export default PropertyOptionSelector;
