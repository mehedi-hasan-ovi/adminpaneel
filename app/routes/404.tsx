import { json, LoaderFunction } from "@remix-run/node";
import Page404 from "~/components/pages/Page404";
import { i18nHelper } from "~/locale/i18n.utils";

export const loader: LoaderFunction = async ({ request }) => {
  const { translations } = await i18nHelper(request);
  return json({
    i18n: translations,
  });
};
export default function Route404() {
  return (
    <>
      <Page404 />
    </>
  );
}
