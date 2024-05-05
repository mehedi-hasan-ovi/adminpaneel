import { LoaderFunction } from "@remix-run/node";
import CampaignsListRoute from "~/modules/emailMarketing/components/campaigns/CampaignsListRoute";
import { Campaigns_List } from "~/modules/emailMarketing/routes/Campaigns_List";

export let loader: LoaderFunction = (args) => Campaigns_List.loader(args);

export default () => <CampaignsListRoute />;
