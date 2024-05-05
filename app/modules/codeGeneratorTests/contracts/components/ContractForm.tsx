// Component: Form with creating, reading, updating, and deleting states
// Date: 2023-01-28
// Version: SaasRock v0.8.2

import { useNavigation, useSubmit, Form } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { useRef } from "react";
import ButtonPrimary from "~/components/ui/buttons/ButtonPrimary";
import ButtonSecondary from "~/components/ui/buttons/ButtonSecondary";
import InputGroup from "~/components/ui/forms/InputGroup";
import ActionResultModal from "~/components/ui/modals/ActionResultModal";
import ConfirmModal, { RefConfirmModal } from "~/components/ui/modals/ConfirmModal";
import { ContractDto } from "../dtos/ContractDto";
import InputText from "~/components/ui/input/InputText";
import InputSelector from "~/components/ui/input/InputSelector";
import { Colors } from "~/application/enums/shared/Colors";
import InputMedia from "~/components/ui/input/InputMedia";
import InputNumber from "~/components/ui/input/InputNumber";
import InputCheckbox from "~/components/ui/input/InputCheckbox";
import InputDate from "~/components/ui/input/InputDate";

export default function ContractForm({
  item,
  actionData,
  isUpdating,
  isCreating,
  canUpdate,
  canDelete,
  onCancel,
}: {
  item?: ContractDto;
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
          <InputText name="name" title={t("Name")} required autoFocus disabled={isDisabled()} value={item?.name} />
          <InputSelector
            name="type"
            title={t("Type")}
            required
            disabled={isDisabled()}
            value={item?.type ?? (!item ? "typeB" : undefined)}
            options={[
              { name: "Type A", value: "typeA", color: Colors.BLUE },
              { name: "Type B", value: "typeB", color: Colors.RED },
            ]}
            withColors={true}
            withSearch={false}
          />
          <InputText name="description" title={t("Description")} disabled={isDisabled()} value={item?.description} rows={3} />
          <InputMedia
            name="document"
            title={t("Document")}
            required
            disabled={isDisabled()}
            initialMedia={item?.document ? [item?.document] : []}
            min={1}
            max={1}
            accept=".pdf"
            maxSize={20}
          />
          {item && (
            <InputMedia
              name="documentSigned"
              title={t("Document Signed")}
              disabled={isDisabled()}
              initialMedia={item?.documentSigned ? [item?.documentSigned] : []}
              max={1}
              accept=".pdf"
              maxSize={20}
            />
          )}
          <InputMedia name="attachments" title={t("Attachments")} disabled={isDisabled()} initialMedia={item?.attachments} />
          <InputNumber name="estimatedAmount" title={t("Estimated Amount")} required disabled={isDisabled()} value={item?.estimatedAmount} />
          {item && <InputNumber name="realAmount" title={t("Real amount")} disabled={isDisabled()} value={item?.realAmount} />}
          <InputCheckbox name="active" title={t("Active")} asToggle required disabled={isDisabled()} value={item?.active} />
          <InputDate
            name="estimatedCompletionDate"
            title={t("Estimated Completion Date")}
            value={item?.estimatedCompletionDate}
            required
            disabled={isDisabled()}
          />
          {item && <InputDate name="realCompletionDate" title={t("Real Completion Date")} value={item?.realCompletionDate} disabled={isDisabled()} />}
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
