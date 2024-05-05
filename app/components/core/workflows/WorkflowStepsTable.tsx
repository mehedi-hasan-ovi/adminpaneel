import { useTranslation } from "react-i18next";
import ButtonTertiary from "~/components/ui/buttons/ButtonTertiary";
import TableSimple from "~/components/ui/tables/TableSimple";
import { EntityWorkflowStepWithDetails } from "~/utils/db/workflows/workflowSteps.db.server";
import WorkflowStateBadge from "./WorkflowStateBadge";
import WorkflowStepAssignTo from "./WorkflowStepAssignTo";

interface Props {
  items: EntityWorkflowStepWithDetails[];
}
export default function WorkflowStepsTable({ items }: Props) {
  const { t } = useTranslation();
  return (
    <div>
      <TableSimple
        items={items}
        headers={[
          {
            title: t("models.workflowStep.fromState"),
            name: "fromState",
            value: (item) => item.fromState.name,
            formattedValue: (item) => <WorkflowStateBadge state={item.fromState} />,
          },
          {
            title: t("models.workflowStep.action"),
            name: "action",
            value: (item) => item.action,
            formattedValue: (item) => <div className="cursor-not-allowed font-medium text-theme-600">{item.action}</div>,
          },
          {
            title: t("models.workflowStep.toState"),
            name: "toState",
            value: (item) => item.toState.name,
            formattedValue: (item) => <WorkflowStateBadge state={item.toState} />,
          },
          {
            title: t("models.workflowStep.assignTo"),
            name: "assignTo",
            value: (item) => item.assignTo,
            formattedValue: (item) => (
              <div className="flex flex-col">
                <WorkflowStepAssignTo step={item} />
                <div className="text-xs font-normal italic text-gray-400">Under construction 🚧</div>
              </div>
            ),
          },
        ]}
        actions={[
          {
            title: t("shared.edit"),
            onClickRoute: (idx, item) => item.id,
          },
        ]}
      ></TableSimple>
      <div className="w-fu flex justify-start">
        <ButtonTertiary to="new">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="font-medium uppercase">{t("shared.add")}</span>
        </ButtonTertiary>
      </div>
    </div>
  );
}
