import { ActionFunction, json } from "@remix-run/node";
import { RowWorkflowTransitionDto } from "~/application/dtos/events/RowWorkflowTransitionDto";
import { i18nHelper } from "~/locale/i18n.utils";
import { getEntityById } from "~/utils/db/entities/entities.db.server";
import { getRowById } from "~/utils/db/entities/rows.db.server";
import { getTenant } from "~/utils/db/tenants.db.server";
import { getRowWorkflowTransition } from "~/utils/db/workflows/rowWorkflowTransitions.db.server";
import { sendEmail } from "~/utils/email.server";
import RowHelper from "~/utils/helpers/RowHelper";

export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const body = (await request.json()) as RowWorkflowTransitionDto;
      const { t } = await i18nHelper(request);
      const row = await getRowById(body.row.id);
      const entity = await getEntityById({ tenantId: null, id: body.entity.id });
      const tenant = await getTenant(row?.tenantId ?? "");
      const folio = RowHelper.getRowFolio(entity!, row!);
      const transition = await getRowWorkflowTransition(body.transition?.id ?? "");
      if (transition) {
        await sendEmail("alex.martinez@absys.com.mx", "workflow-transition", {
          folio,
          from: `${t(transition.workflowStep.fromState.name)}`,
          to: `${t(transition.workflowStep.toState.name)}`,
          action_url: tenant ? `${process.env.SERVER_URL}/app/${tenant.slug}/${entity?.slug}/${row?.id}` : undefined,
        });
      }
      // do something with the body 😉
      return json(
        {
          message: `Row to '${body.state.name}'.`,
        },
        { status: 200 }
      );
    }
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
};
