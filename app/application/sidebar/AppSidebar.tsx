import { SideBarItem } from "./SidebarItem";
import { SvgIcon } from "../enums/shared/SvgIcon";
import UrlUtils from "~/utils/app/UrlUtils";
import { EntitySimple } from "~/utils/db/entities/entities.db.server";
// import { getEntityPermission } from "~/utils/helpers/PermissionsHelper";
import { Params } from "@remix-run/react";
import { TFunction } from "react-i18next";
import { EntityGroupWithDetails } from "~/utils/db/entities/entityGroups.db.server";
import { AppConfiguration } from "~/utils/db/appConfiguration.db.server";

export const AppSidebar = ({
  t,
  params,
  entities,
  entityGroups,
  appConfiguration,
}: {
  t: TFunction;
  params: Params;
  entities: EntitySimple[];
  entityGroups: EntityGroupWithDetails[];
  appConfiguration: AppConfiguration | null;
}): SideBarItem[] => {
  const currentTenantUrl = UrlUtils.stripTrailingSlash(UrlUtils.currentTenantUrl(params));

  const sectionItems: SideBarItem[] = [];
  const entitiesItems: SideBarItem[] = [];

  entityGroups.forEach((group) => {
    const item: SideBarItem = {
      title: t(group.title),
      // icon: group.icon,
      path: `${currentTenantUrl}/g/` + group.slug,
      entityIcon: group.icon,
    };
    if (group.collapsible) {
      item.items = group.entities.map(({ entity }) => {
        return {
          title: t(entity.titlePlural),
          // icon: entity.icon,
          path: `${currentTenantUrl}/g/${group.slug}/${entity.slug}`,
          // entityIcon: entity.icon,
        };
      });
    }
    if (group.section) {
      const section = sectionItems.find((f) => f.title === group.section);
      if (section) {
        section.items = [...(section.items ?? []), item];
      } else {
        sectionItems.push({
          title: group.section,
          path: ``,
          items: [item],
        });
      }
    } else {
      entitiesItems.push(item);
    }
  });

  entities
    .filter((f) => f.showInSidebar)
    .forEach((entity) => {
      // const modelProperties = entity.properties.filter((f) => !f.isDynamic);
      entitiesItems.push({
        title: t(entity.titlePlural),
        entityIcon: entity.icon,
        // tenantUserTypes: [TenantUserType.OWNER, TenantUserType.ADMIN],
        path: `${currentTenantUrl}/` + entity.slug,
        // permission: getEntityPermission(entity, "view"),
        // side: isDebugMode && SideText({ text: modelProperties.length > 0 ? "DB Model" : "Custom" }),
      });
    });

  const crmEntitiesSidebarItems: SideBarItem[] = [];
  const crmEntities = entities.filter((f) => ["companies", "contacts", "opportunities"].includes(f.slug));
  if (crmEntities.length >= 3) {
    crmEntitiesSidebarItems.push({
      title: t("crm.title"),
      icon: SvgIcon.CLIENTS,
      path: `${currentTenantUrl}/crm`,
    });
    crmEntitiesSidebarItems.push({
      title: t("emailMarketing.title"),
      path: `${currentTenantUrl}/email-marketing`,
      icon: SvgIcon.EMAILS,
    });
  }

  const appItem: SideBarItem = {
    title: "",
    path: "",
    items: [
      {
        title: t("app.sidebar.dashboard"),
        path: `${currentTenantUrl}/dashboard`,
        icon: SvgIcon.DASHBOARD,
        // tenantUserTypes: [TenantUserType.OWNER, TenantUserType.ADMIN, TenantUserType.MEMBER],
      },
      ...entitiesItems,
      ...crmEntitiesSidebarItems,
      // {
      //   title: t("models.email.plural"),
      //   path: `${currentTenantUrl}/emails`,
      //   icon: SvgIcon.EMAILS,
      // },
    ],
  };
  if (appConfiguration?.app.features.tenantBlogs) {
    appItem?.items?.push({
      title: t("blog.title"),
      path: `${currentTenantUrl}/blog`,
      icon: SvgIcon.BLOG,
    });
  }
  return [
    appItem,
    ...sectionItems,
    {
      title: "",
      path: "",
      items: [
        {
          title: t("app.sidebar.settings"),
          icon: SvgIcon.SETTINGS,
          // tenantUserTypes: [TenantUserType.OWNER, TenantUserType.ADMIN],
          path: `${currentTenantUrl}/settings`,
          redirectTo: `${currentTenantUrl}/settings/profile`,
        },
        // {
        //   title: t("app.sidebar.logs"),
        //   icon: SvgIcon.LOGS,
        //   tenantUserTypes: [TenantUserType.OWNER, TenantUserType.ADMIN],
        //   path: `${currentTenantUrl}/logs`,
        // },
        {
          title: t("admin.switchToAdmin"),
          path: "/admin/dashboard",
          icon: SvgIcon.ADMIN,
          adminOnly: true,
        },
      ],
    },
  ];
};

// function SideText({ text }: { text: string }) {
//   return (
//     <div className="inline-flex justify-center space-x-1 items-center px-1.5 py-0.5 rounded-sm text-xs font-medium bg-yellow-100 text-yellow-900 italic truncate w-20">
//       <div className="truncate">{text}</div>
//     </div>
//   );
// }
