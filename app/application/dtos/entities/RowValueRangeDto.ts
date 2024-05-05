import { Prisma } from "@prisma/client";

export type RowValueRangeDto = {
  numberMin: Prisma.Decimal | number | null;
  numberMax: Prisma.Decimal | number | null;
  dateMin: Date | null;
  dateMax: Date | null;
};
