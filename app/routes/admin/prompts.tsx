import { json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import IncreaseIcon from "~/components/ui/icons/crm/IncreaseIcon";
import IncreaseIconFilled from "~/components/ui/icons/crm/IncreaseIconFilled";
import SettingsIcon from "~/components/ui/icons/crm/SettingsIcon";
import SettingsIconFilled from "~/components/ui/icons/crm/SettingsIconFilled";
import WorkflowIcon from "~/components/ui/icons/crm/WorkflowIcon";
import WorkflowIconFilled from "~/components/ui/icons/crm/WorkflowIconFilled";
import FolderIcon from "~/components/ui/icons/entities/FolderIcon";
import FolderIconFilled from "~/components/ui/icons/entities/FolderIconFilled";
import SidebarIconsLayout from "~/components/ui/layouts/SidebarIconsLayout";
import { i18nHelper } from "~/locale/i18n.utils";
import { verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";

type LoaderData = {
  title: string;
};

export let loader: LoaderFunction = async ({ request }) => {
  const { t } = await i18nHelper(request);
  await verifyUserHasPermission(request, "admin.prompts.view");
  const data: LoaderData = {
    title: `${t("prompts.builder.title")} | ${process.env.APP_NAME}`,
  };
  return json(data);
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default () => {
  return (
    <SidebarIconsLayout
      label={{ align: "right" }}
      items={[
        {
          name: "Overview",
          href: "/admin/prompts",
          icon: <IncreaseIcon className="h-5 w-5" />,
          iconSelected: <IncreaseIconFilled className="h-5 w-5" />,
          exact: true,
        },
        {
          name: "Prompts",
          href: "/admin/prompts/builder",
          icon: <WorkflowIcon className="h-5 w-5" />,
          iconSelected: <WorkflowIconFilled className="h-5 w-5" />,
        },
        {
          name: "Groups",
          href: "/admin/prompts/groups",
          icon: <FolderIcon className="h-5 w-5" />,
          iconSelected: <FolderIconFilled className="h-5 w-5" />,
        },
        {
          name: "Settings",
          href: "/admin/feature-flags/settings",
          icon: <SettingsIcon className="h-5 w-5" />,
          iconSelected: <SettingsIconFilled className="h-5 w-5" />,
          bottom: true,
        },
      ]}
    >
      <Outlet />
    </SidebarIconsLayout>
  );
};
