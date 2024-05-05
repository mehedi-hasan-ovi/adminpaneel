// DTO: Create Object with required properties
// Date: 2023-01-28
// Version: SaasRock v0.8.2

import { MediaDto } from "~/application/dtos/entities/MediaDto";

export type ContractCreateDto = {
  name: string; // required
  type: string; // required, DefaultValue: typeB
  description: string | undefined; // optional, Rows: 3
  document: MediaDto; // required, Min: 1, Max: 1, AcceptFileTypes: .pdf, MaxSize: 20
  attachments: MediaDto[] | undefined; // optional
  estimatedAmount: number; // required, FormatNumber: decimal
  active: boolean; // required, FormatBoolean: activeInactive
  estimatedCompletionDate: Date; // required, FormatDate: diff
};
