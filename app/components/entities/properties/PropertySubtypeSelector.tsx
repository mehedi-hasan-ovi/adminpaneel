import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import SelectorIcon from "../../ui/icons/SelectorIcon";
import CheckIcon from "../../ui/icons/CheckIcon";
// import PropertySubtypeBadge from "./PropertySubtypeBadge";

interface Props {
  types: string[];
  className?: string;
  selected: string | undefined;
  onSelected: (item: string) => void;
}

export default function PropertySubtypeSelector({ types, className, selected, onSelected }: Props) {
  const { t } = useTranslation();
  return (
    <Listbox name="formula" value={selected} onChange={onSelected}>
      {({ open }) => (
        <>
          <input type="hidden" name="subtype" value={selected} />
          <div className={clsx("relative", className)}>
            <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left text-gray-800 shadow-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 sm:text-sm">
              {selected ? (
                <div className="flex items-center space-x-2">
                  {/* <PropertySubtypeBadge subtype={selected} className="h-4 w-4 text-gray-500" /> */}
                  <div className="truncate">{t("entities.subtypes." + selected)}</div>
                </div>
              ) : (
                <div className="text-gray-400">{t("shared.select")}...</div>
              )}
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <SelectorIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>

            <Transition show={open} as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {types.length === 0 ? (
                  <div className=" flex select-none justify-center p-2 text-red-500">There are no subtypes</div>
                ) : (
                  <>
                    {types.map((item, idx) => (
                      <Listbox.Option
                        key={idx}
                        className={({ active }) =>
                          clsx(active ? "bg-accent-600 text-white" : "text-gray-900", "relative cursor-default select-none py-2 pl-3 pr-9")
                        }
                        value={item}
                      >
                        {({ selected, active }) => (
                          <>
                            <div className="flex items-center space-x-2">
                              {/* <PropertySubtypeBadge subtype={item} className={clsx(active ? "text-white" : "text-gray-500", "h-4 w-4")} /> */}
                              <div className="truncate">{t("entities.subtypes." + item)}</div>
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
                  </>
                )}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
}
