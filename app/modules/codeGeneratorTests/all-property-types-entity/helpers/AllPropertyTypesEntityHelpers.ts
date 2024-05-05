// Helper: FormData and RowWithDetails transformer functions to Dto
// Date: 2023-06-21
// Version: SaasRock v0.8.9

import { EntityWithDetails } from "~/utils/db/entities/entities.db.server";
import { RowWithDetails } from "~/utils/db/entities/rows.db.server";
import FormHelper from "~/utils/helpers/FormHelper";
import RowValueHelper from "~/utils/helpers/RowValueHelper";
import { AllPropertyTypesEntityDto } from "../dtos/AllPropertyTypesEntityDto";

function rowToDto({ entity, row }: { entity: EntityWithDetails; row: RowWithDetails }): AllPropertyTypesEntityDto {
  return {
    row,
    prefix: entity.prefix,
    textSingleLine: RowValueHelper.getText({ entity, row, name: "textSingleLine" }) ?? "", // required
    textEmail: RowValueHelper.getText({ entity, row, name: "textEmail" }) ?? "", // required
    textPhone: RowValueHelper.getText({ entity, row, name: "textPhone" }) ?? "", // required
    textUrl: RowValueHelper.getText({ entity, row, name: "textUrl" }) ?? "", // required
    number: RowValueHelper.getNumber({ entity, row, name: "number" }) ?? 0, // required
    date: RowValueHelper.getDate({ entity, row, name: "date" }) ?? new Date(), // required
    singleSelectDropdown: RowValueHelper.getText({ entity, row, name: "singleSelectDropdown" }) ?? "", // required
    singleSelectRadioGroupCards: RowValueHelper.getText({ entity, row, name: "singleSelectRadioGroupCards" }) ?? "", // required
    boolean: RowValueHelper.getBoolean({ entity, row, name: "boolean" }) ?? false, // required
    media: RowValueHelper.getMedia({ entity, row, name: "media" }), // required
    multiSelectCombobox: RowValueHelper.getMultiple({ entity, row, name: "multiSelectCombobox" }), // required
    multiSelectCheckboxCards: RowValueHelper.getMultiple({ entity, row, name: "multiSelectCheckboxCards" }), // required
    numberRange: RowValueHelper.getNumberRange({ entity, row, name: "numberRange" }), // required
    dateRange: RowValueHelper.getDateRange({ entity, row, name: "dateRange" }), // required
    multiText: RowValueHelper.getMultiple({ entity, row, name: "multiText" }), // required
  };
}

function formToDto(form: FormData): Partial<AllPropertyTypesEntityDto> {
  return {
    textSingleLine: FormHelper.getText(form, "textSingleLine"), // required
    textEmail: FormHelper.getText(form, "textEmail"), // required
    textPhone: FormHelper.getText(form, "textPhone"), // required
    textUrl: FormHelper.getText(form, "textUrl"), // required
    number: FormHelper.getNumber(form, "number"), // required
    date: FormHelper.getDate(form, "date"), // required
    singleSelectDropdown: FormHelper.getText(form, "singleSelectDropdown"), // required
    singleSelectRadioGroupCards: FormHelper.getText(form, "singleSelectRadioGroupCards"), // required
    boolean: FormHelper.getBoolean(form, "boolean"), // required
    media: FormHelper.getFormMedia(form, "media"), // required
    multiSelectCombobox: FormHelper.getMultiple(form, "multiSelectCombobox"), // required
    multiSelectCheckboxCards: FormHelper.getMultiple(form, "multiSelectCheckboxCards"), // required
    numberRange: FormHelper.getNumberRange(form, "numberRange"), // required
    dateRange: FormHelper.getDateRange(form, "dateRange"), // required
    multiText: FormHelper.getMultiple(form, "multiText"), // required
  };
}

export default {
  rowToDto,
  formToDto,
};