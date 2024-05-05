import { ActionFunction, LoaderFunction } from "@remix-run/node";
import CampaignsNewRoute from "~/modules/emailMarketing/components/campaigns/CampaignsNewRoute";
import { Campaigns_New } from "~/modules/emailMarketing/routes/Campaigns_New";

export let loader: LoaderFunction = (args) => Campaigns_New.loader(args);
export const action: ActionFunction = (args) => Campaigns_New.action(args);

export default () => <CampaignsNewRoute />;
