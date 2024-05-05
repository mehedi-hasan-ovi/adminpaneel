import { useTranslation } from "react-i18next";
import ColorBadge from "~/components/ui/badges/ColorBadge";
import ButtonSecondary from "~/components/ui/buttons/ButtonSecondary";
import { EntityWorkflowStepWithDetails } from "~/utils/db/workflows/workflowSteps.db.server";

export default function RowNextWorkflowStates({
  disabled,
  nextWorkflowSteps,
  onClick,
}: {
  disabled: boolean;
  nextWorkflowSteps: EntityWorkflowStepWithDetails[];
  onClick: (actionName: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      {nextWorkflowSteps.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium leading-3 text-gray-800">
            <div className="flex items-center space-x-1">
              <div>
                <span className=" font-light italic"></span> {t("models.workflowState.object")}
              </div>
            </div>
          </h3>
          <div className="flex flex-col space-y-2">
            {nextWorkflowSteps.map((step) => {
              return (
                <ButtonSecondary className="w-full" disabled={disabled} key={step.id} onClick={() => onClick(step.action)}>
                  <div className="flex items-center space-x-2">
                    <ColorBadge color={step.toState.color} />
                    <div>{t(step.action)}</div>
                  </div>
                </ButtonSecondary>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
