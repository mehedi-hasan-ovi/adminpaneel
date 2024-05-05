import { CreatedByDto } from "../shared/CreatedByDto";

export type RowWorkflowTransitionDto = {
  entity: { id: string; name: string; slug: string };
  tenantId: string | null;
  row: {
    id: string;
    folio: number;
  };
  state: {
    id: string;
    name: string;
  };
  transition?: {
    id: string;
  };
  by?: CreatedByDto;
};
