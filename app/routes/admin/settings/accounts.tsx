import { LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import EditPageLayout from "~/components/ui/layouts/EditPageLayout";
import { i18nHelper } from "~/locale/i18n.utils";

export let loader = async ({ request }: LoaderArgs) => {
  const { t } = await i18nHelper(request);
  return {
    metadata: [{ title: `${t("models.tenant.plural")} | ${process.env.APP_NAME}` }],
  };
};

export const meta: V2_MetaFunction = ({ data }) => data?.metadata;

export default function () {
  return (
    <EditPageLayout
      title="Accounts Settings"
      withHome={false}
      menu={[
        {
          title: "Accounts Settings",
          routePath: "/admin/settings/accounts",
        },
      ]}
    >
      <div className="space-y-3">
        <div className="space-y-2">
          <Link
            to={`types`}
            className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
          >
            <span className="mt-2 block text-sm font-medium text-gray-900">Types</span>
          </Link>
        </div>
      </div>
    </EditPageLayout>
  );
}
