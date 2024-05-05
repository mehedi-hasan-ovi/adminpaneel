import { Listbox, Transition } from "@headlessui/react";
import clsx from "clsx";
import { forwardRef, Fragment, Ref, useImperativeHandle, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Colors } from "~/application/enums/shared/Colors";
import { EntityWithDetails } from "~/utils/db/entities/entities.db.server";
import SimpleBadge from "../ui/badges/SimpleBadge";
import CheckIcon from "../ui/icons/CheckIcon";
import SelectorIcon from "../ui/icons/SelectorIcon";

export interface RefEntitySelector {
  focus: () => void;
}

interface Props {
  items: EntityWithDetails[];
  className?: string;
  selected: EntityWithDetails | undefined;
  onSelected: (item: EntityWithDetails) => void;
}

const EntitySelector = ({ items, className, selected, onSelected }: Props, ref: Ref<RefEntitySelector>) => {
  const { t } = useTranslation();
  const button = useRef<HTMLButtonElement>(null);

  useImperativeHandle(ref, () => ({ focus }));
  function focus() {
    button.current?.focus();
  }

  return (
    <Listbox value={selected} onChange={onSelected}>
      {({ open }) => (
        <>
          <div className={clsx("relative", className)}>
            <Listbox.Button
              ref={button}
              className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left text-gray-800 shadow-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 sm:text-sm"
            >
              <input type="hidden" readOnly name={"entity-id"} value={selected?.id} />
              <div className="flex items-center space-x-2">
                {selected ? (
                  <>
                    <SimpleBadge title={selected.prefix} color={Colors.BLUE} />
                    <div className="truncate text-gray-600">{t(selected.title)}</div>
                  </>
                ) : (
                  <div className="truncate text-gray-500">
                    {" "}
                    {t("shared.select")} {t("models.entity.object")?.toLowerCase()}...
                  </div>
                )}
              </div>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <SelectorIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>

            <Transition show={open} as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {items.length === 0 ? (
                  <div className=" flex select-none justify-center p-2 text-red-500">There are no fields</div>
                ) : (
                  <>
                    {items.map((item, idx) => (
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
                              <SimpleBadge title={item.prefix} color={Colors.BLUE} />
                              <div className={clsx("truncate", active ? "text-white" : "text-gray-500", "")}>{t(item.title)}</div>
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
};

export default forwardRef(EntitySelector);
