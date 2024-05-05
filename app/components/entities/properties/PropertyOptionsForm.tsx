import { Dialog, Transition } from "@headlessui/react";
import { Ref, useImperativeHandle, useRef, useState, Fragment, forwardRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Colors } from "~/application/enums/shared/Colors";
import ColorBadge from "~/components/ui/badges/ColorBadge";
import ButtonPrimary from "~/components/ui/buttons/ButtonPrimary";
import ButtonSecondary from "~/components/ui/buttons/ButtonSecondary";
import ButtonTertiary from "~/components/ui/buttons/ButtonTertiary";
import TrashIcon from "~/components/ui/icons/TrashIcon";
import InputCheckboxInline from "~/components/ui/input/InputCheckboxInline";
import InputSelector from "~/components/ui/input/InputSelector";
import InputText, { RefInputText } from "~/components/ui/input/InputText";
import ErrorModal, { RefErrorModal } from "~/components/ui/modals/ErrorModal";
import { getColors } from "~/utils/shared/ColorUtils";
import { updateItemByIdx } from "~/utils/shared/ObjectUtils";

export type OptionValue = {
  id?: string | null;
  parentId?: string | null;
  order: number;
  value: string;
  name: string | null;
  color?: Colors;
  options?: OptionValue[];
};
export interface RefPropertyOptionsForm {
  set: (options: OptionValue[]) => void;
}

interface Props {
  title: string;
  onSet: (items: OptionValue[]) => void;
}

const PropertyOptionsForm = ({ title, onSet }: Props, ref: Ref<RefPropertyOptionsForm>) => {
  useImperativeHandle(ref, () => ({ set }));

  const { t } = useTranslation();

  const errorModal = useRef<RefErrorModal>(null);

  const inputOption = useRef<RefInputText>(null);

  const [withColors, setWithColors] = useState(false);
  const [withDescriptions, setWithDescriptions] = useState(false);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<OptionValue[]>([]);

  useEffect(() => {
    if (!withDescriptions) {
      setItems((items) => items.map((f) => ({ ...f, name: null })));
    }
  }, [withDescriptions]);

  useEffect(() => {
    if (!withColors) {
      setItems((items) => items.map((f) => ({ ...f, color: undefined })));
    }
  }, [withColors]);

  function set(options: OptionValue[]) {
    setItems(options);
    if (options.length === 0 && items.length === 0) {
      addOption();
    }
    setWithColors(options.some((f) => f.color));
    setWithDescriptions(options.some((f) => f.name));

    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  function save() {
    const emptyItems = items.filter((f) => !f.value || f.value.trim() === "");
    if (emptyItems.length > 0) {
      errorModal.current?.show(t("entities.errors.selectOptionCannotBeEmpty"));
      return;
    }
    onSet(items);
    close();
  }

  function addOption() {
    const maxOrder = items.length === 0 ? 1 : Math.max(...items.map((o) => o.order));
    setItems([
      ...items,
      {
        id: null,
        parentId: null,
        order: maxOrder + 1,
        value: "",
        name: null,
        color: Colors.UNDEFINED,
        options: [],
      },
    ]);

    setTimeout(() => {
      inputOption.current?.input.current?.focus();
    }, 1);
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={setOpen}>
        <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block w-full transform rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:max-w-md sm:p-6 sm:align-middle">
              <div>
                <div className="mt-3 sm:mt-5">
                  <Dialog.Title as="h3" className=" text-lg font-medium capitalize leading-6 text-gray-900">
                    <div className="flex items-center justify-between space-x-2">
                      <div>{t(title)} Dropdown options</div>
                    </div>
                  </Dialog.Title>
                  <div className="mt-4 space-y-3">
                    <div className="flex space-x-3">
                      <InputCheckboxInline name="with-colors" title="With colors" description="" value={withColors} setValue={setWithColors} />
                      <InputCheckboxInline
                        name="with-descriptions"
                        title="With descriptions"
                        description=""
                        value={withDescriptions}
                        setValue={setWithDescriptions}
                      />
                    </div>
                    <div className="w-full">
                      <div className="flex items-center justify-between space-x-2">
                        <label htmlFor="select" className="block text-sm font-medium text-gray-700">
                          Options
                        </label>
                        <div className="flex space-x-2">
                          <ButtonTertiary onClick={addOption}>
                            <div className="-mx-1 text-xs">Add option</div>
                          </ButtonTertiary>
                        </div>
                      </div>
                      <div className="mt-1 h-48 space-y-2 overflow-hidden overflow-y-auto rounded-md border-2 border-dashed border-gray-300 bg-gray-50 p-2">
                        {items.map((option, idx) => {
                          return (
                            <div key={option.order} className="mt-1 flex items-center space-x-1 rounded-md">
                              <InputText
                                ref={inputOption}
                                type="text"
                                title=""
                                withLabel={false}
                                name={"select-option-" + idx}
                                value={option.value}
                                placeholder="Value..."
                                setValue={(e) =>
                                  updateItemByIdx(items, setItems, idx, {
                                    value: e,
                                  })
                                }
                                className="flex-auto"
                              />

                              {withDescriptions && (
                                <InputText
                                  type="text"
                                  title=""
                                  withLabel={false}
                                  name={"select-option-name-" + idx}
                                  placeholder="Name..."
                                  value={option.name ?? undefined}
                                  setValue={(e) =>
                                    updateItemByIdx(items, setItems, idx, {
                                      name: e,
                                    })
                                  }
                                  className="flex-auto"
                                />
                              )}

                              {withColors && (
                                <InputSelector
                                  name="color"
                                  title={t("models.group.color")}
                                  withSearch={false}
                                  value={option.color ?? Colors.UNDEFINED}
                                  withLabel={false}
                                  setValue={(e) =>
                                    updateItemByIdx(items, setItems, idx, {
                                      color: Number(e),
                                    })
                                  }
                                  selectPlaceholder={""}
                                  className="w-32"
                                  options={
                                    getColors().map((color) => {
                                      return {
                                        name: <ColorBadge color={color} />,
                                        value: color,
                                      };
                                    }) ?? []
                                  }
                                ></InputSelector>
                              )}

                              <ButtonSecondary
                                disabled={items.length === 1}
                                type="button"
                                onClick={() => setItems([...items.filter((_, index) => index !== idx)])}
                              >
                                <TrashIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                              </ButtonSecondary>
                            </div>
                          );
                        })}
                        <div className="w-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 border-t border-gray-200 pt-3 sm:mt-6">
                <div className="flex items-center justify-end space-x-2">
                  <ButtonSecondary onClick={close}>Cancel</ButtonSecondary>
                  <ButtonPrimary onClick={save}>Save</ButtonPrimary>
                </div>
              </div>
              <ErrorModal ref={errorModal} />
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default forwardRef(PropertyOptionsForm);
