import { Row, RowRelationship } from "@prisma/client";
import { RowValueWithDetails, RowWithDetails, RowWithValues } from "~/utils/db/entities/rows.db.server";

export type RowDto =
  | (Row & {
      values: RowValueWithDetails[];
    })
  | RowWithDetails;
