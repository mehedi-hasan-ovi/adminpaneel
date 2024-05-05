import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { i18nHelper } from "~/locale/i18n.utils";

type LoaderData = {};
export let loader: LoaderFunction = async ({ params }) => {
  const data: LoaderData = {};
  return json(data);
};

type ActionData = {
  error?: string;
};
const badRequest = (data: ActionData) => json(data, { status: 400 });
export const action: ActionFunction = async ({ request, params }) => {
  const { t } = await i18nHelper(request);
  return badRequest({ error: t("shared.invalidForm") });
};

export default function EditEntityIndexRoute() {
  return <div>Routes</div>;
}
