// Helper: FormData and RowWithDetails transformer functions to Dto
// Date: 2023-01-28
// Version: SaasRock v0.8.2

import { EntityWithDetails } from "~/utils/db/entities/entities.db.server";
import { RowWithDetails } from "~/utils/db/entities/rows.db.server";
import FormHelper from "~/utils/helpers/FormHelper";
import RowValueHelper from "~/utils/helpers/RowValueHelper";
import { ContractDto } from "../dtos/ContractDto";
import { MediaDto } from "~/application/dtos/entities/MediaDto";

function rowToDto({ entity, row }: { entity: EntityWithDetails; row: RowWithDetails }): ContractDto {
  return {
    row,
    prefix: entity.prefix,
    name: RowValueHelper.getText({ entity, row, name: "name" }) ?? "", // required
    type: RowValueHelper.getText({ entity, row, name: "type" }) ?? "", // required
    description: RowValueHelper.getText({ entity, row, name: "description" }), // optional
    document: RowValueHelper.getFirstMedia({ entity, row, name: "document" }) as MediaDto, // required
    documentSigned: RowValueHelper.getFirstMedia({ entity, row, name: "documentSigned" }), // optional
    attachments: RowValueHelper.getMedia({ entity, row, name: "attachments" }), // optional
    estimatedAmount: RowValueHelper.getNumber({ entity, row, name: "estimatedAmount" }) ?? 0, // required
    realAmount: RowValueHelper.getNumber({ entity, row, name: "realAmount" }), // optional
    active: RowValueHelper.getBoolean({ entity, row, name: "active" }) ?? false, // required
    estimatedCompletionDate: RowValueHelper.getDate({ entity, row, name: "estimatedCompletionDate" }) ?? new Date(), // required
    realCompletionDate: RowValueHelper.getDate({ entity, row, name: "realCompletionDate" }), // optional
  };
}

function formToDto(form: FormData): Partial<ContractDto> {
  return {
    name: FormHelper.getText(form, "name"), // required
    type: FormHelper.getText(form, "type"), // required
    description: FormHelper.getText(form, "description"), // optional
    document: FormHelper.getFormFirstMedia(form, "document"), // required
    documentSigned: FormHelper.getFormFirstMedia(form, "documentSigned"), // optional
    attachments: FormHelper.getFormMedia(form, "attachments"), // optional
    estimatedAmount: FormHelper.getNumber(form, "estimatedAmount"), // required
    realAmount: FormHelper.getNumber(form, "realAmount"), // optional
    active: FormHelper.getBoolean(form, "active"), // required
    estimatedCompletionDate: FormHelper.getDate(form, "estimatedCompletionDate"), // required
    realCompletionDate: FormHelper.getDate(form, "realCompletionDate"), // optional
  };
}

export default {
  rowToDto,
  formToDto,
};
