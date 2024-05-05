import { LoaderArgs, json } from "@remix-run/node";
import Page404 from "~/components/pages/Page404";
import RedirectsService from "~/modules/redirects/RedirectsService";

export let loader = async ({ request }: LoaderArgs) => {
  await RedirectsService.findAndRedirect({ request });
  return json({});
};

export default function () {
  return <Page404 />;
}
