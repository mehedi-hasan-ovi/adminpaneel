import { EntityWorkflowState } from "@prisma/client";
import { StatChange } from "./StatChange";

export type Stat = {
  name: string;
  hint: string;
  stat: string;
  previousStat?: string;
  change?: string;
  changeType?: StatChange;
  path?: string;
  workflowState?: EntityWorkflowState;
};
