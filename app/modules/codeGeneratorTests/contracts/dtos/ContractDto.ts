// DTO: Server <-> Client row interface
// Date: 2023-01-28
// Version: SaasRock v0.8.2

import { RowWithDetails } from "~/utils/db/entities/rows.db.server";
import { MediaDto } from "~/application/dtos/entities/MediaDto";

export type ContractDto = {
  row: RowWithDetails;
  prefix: string;
  // Custom Row Properties:
  name: string; // required
  type: string; // required, DefaultValue: typeB
  description: string | undefined; // optional, Rows: 3
  document: MediaDto; // required, Min: 1, Max: 1, AcceptFileTypes: .pdf, MaxSize: 20
  documentSigned: MediaDto | undefined; // optional, AcceptFileTypes: .pdf, Max: 1, MaxSize: 20
  attachments: MediaDto[] | undefined; // optional
  estimatedAmount: number; // required, FormatNumber: decimal
  realAmount: number | undefined; // optional, FormatNumber: currency
  active: boolean; // required, FormatBoolean: activeInactive
  estimatedCompletionDate: Date; // required, FormatDate: diff
  realCompletionDate: Date | undefined; // optional, FormatDate: YYYY-MM-DD
};
