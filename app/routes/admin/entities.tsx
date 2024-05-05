import { json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import ViewBoardsEmptyIcon from "~/components/ui/icons/ViewBoardsEmptyIcon";
import ViewBoardsIcon from "~/components/ui/icons/ViewBoardsIcon";
import ActivityHistoryIcon from "~/components/ui/icons/entities/ActivityHistoryIcon";
import ActivityHistoryIconFilled from "~/components/ui/icons/entities/ActivityHistoryIconFilled";
import CodingIcon from "~/components/ui/icons/entities/CodingIcon";
import CodingIconFilled from "~/components/ui/icons/entities/CodingIconFilled";
import FolderIcon from "~/components/ui/icons/entities/FolderIcon";
import FolderIconFilled from "~/components/ui/icons/entities/FolderIconFilled";
import ModulesIcon from "~/components/ui/icons/entities/ModulesIcon";
import ModulesIconFilled from "~/components/ui/icons/entities/ModulesIconFilled";
import RestApiIcon from "~/components/ui/icons/entities/RestApiIcon";
import RestApiIconFilled from "~/components/ui/icons/entities/RestApiIconFilled";
import RowsIcon from "~/components/ui/icons/entities/RowsIcon";
import RowsIconFilled from "~/components/ui/icons/entities/RowsIconFilled";
import TemplateIcon from "~/components/ui/icons/entities/TemplateIcon";
import TemplateIconFilled from "~/components/ui/icons/entities/TemplateIconFilled";
import ExperimentIcon from "~/components/ui/icons/tests/ExperimentIcon";
import ExperimentIconFilled from "~/components/ui/icons/tests/ExperimentIconFilled";
import SidebarIconsLayout from "~/components/ui/layouts/SidebarIconsLayout";
import { i18nHelper } from "~/locale/i18n.utils";

type LoaderData = {
  title: string;
};

export let loader: LoaderFunction = async ({ request }) => {
  const { t } = await i18nHelper(request);
  const data: LoaderData = {
    title: `${t("models.entity.plural")} | ${process.env.APP_NAME}`,
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
          name: "Entities",
          href: "/admin/entities",
          icon: <ModulesIcon className="h-5 w-5" />,
          iconSelected: <ModulesIconFilled className="h-5 w-5" />,
          exact: true,
        },
        {
          name: "Groups",
          href: "/admin/entities/groups",
          icon: <FolderIcon className="h-5 w-5" />,
          iconSelected: <FolderIconFilled className="h-5 w-5" />,
        },
        {
          name: "Formulas",
          href: "/admin/entities/formulas",
          icon: <ExperimentIcon className="h-5 w-5" />,
          iconSelected: <ExperimentIconFilled className="h-5 w-5" />,
        },
        {
          name: "Rows",
          href: "/admin/entities/rows",
          icon: <RowsIcon className="h-5 w-5" />,
          iconSelected: <RowsIconFilled className="h-5 w-5" />,
        },
        {
          name: "Views",
          href: "/admin/entities/views",
          icon: <ViewBoardsEmptyIcon className="h-5 w-5" />,
          iconSelected: <ViewBoardsIcon className="h-5 w-5" />,
        },
        {
          name: "Logs",
          href: "/admin/entities/logs",
          icon: <ActivityHistoryIcon className="h-5 w-5" />,
          iconSelected: <ActivityHistoryIconFilled className="h-5 w-5" />,
        },
        {
          name: "No-code",
          href: "/admin/entities/no-code",
          icon: <CodingIcon className="h-5 w-5" />,
          iconSelected: <CodingIconFilled className="h-5 w-5" />,
        },
        {
          name: "Yes-code",
          href: "/admin/entities/code-generator",
          icon: <CodingIcon className="h-5 w-5" />,
          iconSelected: <CodingIconFilled className="h-5 w-5" />,
        },
        {
          name: "API",
          href: "/admin/entities/api",
          icon: <RestApiIcon className="h-5 w-5" />,
          iconSelected: <RestApiIconFilled className="h-5 w-5" />,
        },
        {
          name: "Templates",
          href: "/admin/entities/templates",
          icon: <TemplateIcon className="h-5 w-5" />,
          iconSelected: <TemplateIconFilled className="h-5 w-5" />,
          bottom: true,
        },
        // {
        //   name: "Code",
        //   href: "/admin/entities/code",
        //   icon: <CodeFileIcon className="h-5 w-5" />,
        //   iconSelected: <CodeFileIconFilled className="h-5 w-5" />,
        //   bottom: true,
        // },
      ]}
    >
      <Outlet />
    </SidebarIconsLayout>
  );
};
