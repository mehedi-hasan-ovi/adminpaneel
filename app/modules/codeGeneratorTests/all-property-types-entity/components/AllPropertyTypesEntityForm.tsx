// Component: Form with creating, reading, updating, and deleting states
// Date: 2023-06-21
// Version: SaasRock v0.8.9

import { useNavigation, useSubmit, Form } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { useRef } from "react";
import ButtonPrimary from "~/components/ui/buttons/ButtonPrimary";
import ButtonSecondary from "~/components/ui/buttons/ButtonSecondary";
import InputGroup from "~/components/ui/forms/InputGroup";
import ActionResultModal from "~/components/ui/modals/ActionResultModal";
import ConfirmModal, { RefConfirmModal } from "~/components/ui/modals/ConfirmModal";
import { AllPropertyTypesEntityDto } from "../dtos/AllPropertyTypesEntityDto";
import InputText from "~/components/ui/input/InputText";
import InputTextSubtype from "~/components/ui/input/subtypes/InputTextSubtype";
import InputNumber from "~/components/ui/input/InputNumber";
import InputDate from "~/components/ui/input/InputDate";
import { Colors } from "~/application/enums/shared/Colors";
import InputSelector from "~/components/ui/input/InputSelector";
import InputRadioGroupCards from "~/components/ui/input/InputRadioGroupCards";
import InputCheckbox from "~/components/ui/input/InputCheckbox";
import InputMedia from "~/components/ui/input/InputMedia";
import PropertyMultiSelector from "~/components/entities/properties/PropertyMultiSelector";
import InputRangeNumber from "~/components/ui/input/ranges/InputRangeNumber";
import InputRangeDate from "~/components/ui/input/ranges/InputRangeDate";
import InputMultiText from "~/components/ui/input/InputMultiText";

export default function AllPropertyTypesEntityForm({
  item,
  actionData,
  isUpdating,
  isCreating,
  canUpdate,
  canDelete,
  onCancel,
}: {
  item?: AllPropertyTypesEntityDto;
  actionData: { success?: string; error?: string } | undefined;
  isUpdating?: boolean;
  isCreating?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const submit = useSubmit();

  const confirmDelete = useRef<RefConfirmModal>(null);

  function onDelete() {
    confirmDelete.current?.show(t("shared.confirmDelete"), t("shared.delete"), t("shared.cancel"), t("shared.warningCannotUndo"));
  }
  function onDeleteConfirmed() {
    const form = new FormData();
    form.set("action", "delete");
    submit(form, {
      method: "post",
    });
  }
  function isDisabled() {
    if (isUpdating && !canUpdate) {
      return true;
    }
    if (!isUpdating && !isCreating) {
      return true;
    }
  }
  return (
    <Form key={!isDisabled() ? "enabled" : "disabled"} method="post" className="space-y-4">
      {item ? <input name="action" value="edit" hidden readOnly /> : <input name="action" value="create" hidden readOnly />}

      <InputGroup title={t("shared.details")}>
        <div className="space-y-2">
          <InputText name="textSingleLine" title={t("Text (Single-line)")} required autoFocus disabled={isDisabled()} value={item?.textSingleLine} />
          <InputTextSubtype subtype="email" name="textEmail" title={t("Text (Email)")} required disabled={isDisabled()} value={item?.textEmail} />
          <InputTextSubtype subtype="phone" name="textPhone" title={t("Text (Phone)")} required disabled={isDisabled()} value={item?.textPhone} />
          <InputTextSubtype subtype="url" name="textUrl" title={t("Text (URL)")} required disabled={isDisabled()} value={item?.textUrl} />
          <InputNumber name="number" title={t("Number")} required disabled={isDisabled()} value={item?.number} />
          <InputDate name="date" title={t("Date")} value={item?.date} required disabled={isDisabled()} />
          <InputSelector name="singleSelectDropdown" title={t("Single Select (Dropdown)")} required disabled={isDisabled()} value={item?.singleSelectDropdown} options={[{ name: "Option 1", value: "Option 1", color: Colors.UNDEFINED },{ name: "Option 2", value: "Option 2", color: Colors.UNDEFINED },{ name: "Option 3", value: "Option 3", color: Colors.UNDEFINED }]} withSearch={false} withColors={false} />
          <InputRadioGroupCards name="singleSelectRadioGroupCards" title={t("Single Select (Radio Group Cards)")} required disabled={isDisabled()} value={item?.singleSelectRadioGroupCards} options={[{ name: "Option 1", value: "Option 1", color: Colors.UNDEFINED },{ name: "Option 2", value: "Option 2", color: Colors.UNDEFINED },{ name: "Option 3", value: "Option 3", color: Colors.UNDEFINED }]} />
          <InputCheckbox name="boolean" title={t("Boolean")} asToggle required disabled={isDisabled()} value={item?.boolean} />
          <InputMedia name="media" title={t("Media")} required disabled={isDisabled()} initialMedia={item?.media} />
          <PropertyMultiSelector name="multiSelectCombobox" title={t("Multi Select (Combobox)")} required disabled={isDisabled()} value={item?.multiSelectCombobox} options={[{ name: "Option 1", value: "Option 1", color: Colors.UNDEFINED },{ name: "Option 2", value: "Option 2", color: Colors.UNDEFINED },{ name: "Option 3", value: "Option 3", color: Colors.UNDEFINED }]} />
          <PropertyMultiSelector subtype="checkboxCards" name="multiSelectCheckboxCards" title={t("Multi Select (Checkbox Cards)")} required disabled={isDisabled()} value={item?.multiSelectCheckboxCards} options={[{ name: "Option 1", value: "Option 1", color: Colors.UNDEFINED },{ name: "Option 2", value: "Option 2", color: Colors.UNDEFINED },{ name: "Option 3", value: "Option 3", color: Colors.UNDEFINED }]} />
          <InputRangeNumber name="numberRange" title={t("Number Range")} required disabled={isDisabled()} 
         valueMin={item?.numberRange?.numberMin ? Number(item.numberRange.numberMin) : undefined}
         valueMax={item?.numberRange?.numberMax ? Number(item.numberRange.numberMax) : undefined} />
          <InputRangeDate name="dateRange" title={t("Date Range")} required disabled={isDisabled()}
          valueMin={item?.dateRange?.dateMin}
          valueMax={item?.dateRange?.dateMax} />
          <InputMultiText name="multiText" title={t("Multi Text")} required disabled={isDisabled()} separator="," value={item?.multiText} />
        </div>
      </InputGroup>

      {(isCreating || (isUpdating && canUpdate)) && (
        <div className="flex justify-between space-x-2">
          <div>
            {canDelete && (
              <ButtonSecondary disabled={navigation.state !== "idle"} destructive onClick={onDelete}>
                {t("shared.delete")}
              </ButtonSecondary>
            )}
          </div>
          <div className="flex space-x-2">
            {onCancel && <ButtonSecondary onClick={onCancel}>{t("shared.cancel")}</ButtonSecondary>}
            <ButtonPrimary disabled={navigation.state !== "idle"} type="submit">
              {item ? t("shared.save") : t("shared.create")}
            </ButtonPrimary>
          </div>
        </div>
      )}

      <ConfirmModal ref={confirmDelete} onYes={onDeleteConfirmed} />
      <ActionResultModal actionData={actionData} showSuccess={false} />
    </Form>
  );
}