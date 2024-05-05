import { ActionFunction, LoaderFunction } from "@remix-run/node";
import CampaignsEditRoute from "~/modules/emailMarketing/components/campaigns/CampaignsEditRoute";
import { Campaigns_Edit } from "~/modules/emailMarketing/routes/Campaigns_Edit";

export let loader: LoaderFunction = (args) => Campaigns_Edit.loader(args);
export const action: ActionFunction = (args) => Campaigns_Edit.action(args);

export default () => <CampaignsEditRoute />;
