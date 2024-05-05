// DTO: Create Object with required properties
// Date: 2023-06-21
// Version: SaasRock v0.8.9

import { MediaDto } from "~/application/dtos/entities/MediaDto";
import { RowValueMultipleDto } from "~/application/dtos/entities/RowValueMultipleDto";
import { RowValueRangeDto } from "~/application/dtos/entities/RowValueRangeDto";

export type AllPropertyTypesEntityCreateDto = {
  textSingleLine: string; // required
  textEmail: string; // required
  textPhone: string; // required
  textUrl: string; // required
  number: number; // required
  date: Date; // required
  singleSelectDropdown: string; // required
  singleSelectRadioGroupCards: string; // required
  boolean: boolean; // required
  media: MediaDto[]; // required
  multiSelectCombobox: RowValueMultipleDto[]; // required
  multiSelectCheckboxCards: RowValueMultipleDto[]; // required
  numberRange: RowValueRangeDto; // required
  dateRange: RowValueRangeDto; // required
  multiText: RowValueMultipleDto[]; // required, Separator: ,
};