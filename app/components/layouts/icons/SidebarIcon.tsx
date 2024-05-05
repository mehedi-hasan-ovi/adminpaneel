import { SvgIcon } from "~/application/enums/shared/SvgIcon";

import IconAdmin from "./IconAdmin";
import IconUsers from "./IconUsers";
import IconPricing from "./IconPricing";
import IconNavigation from "./IconNavigation";
import IconComponents from "./IconComponents";

import IconApp from "./IconApp";
import IconDashboard from "./IconDashboard";
import IconSettings from "./IconSettings";
import IconLinks from "./IconLinks";
import IconProviders from "./IconProviders";
import IconEmails from "./IconEmails";
import IconMembers from "./IconMembers";
import IconProfile from "./IconProfile";
import IconHistory from "./IconHistory";
import IconCode from "./IconCode";
import IconBlog from "./IconBlog";
import IconEntities from "./IconEntities";
import { SideBarItem } from "~/application/sidebar/SidebarItem";
import EntityIcon from "./EntityIcon";
import IconKeys from "./IconKeys";
import IconDocs from "./IconDocs";
import IconRoles from "./IconRoles";
import IconEvents from "./IconEvents";
import IconAnalytics from "./IconAnalytics";
import UserGroupIconFilled from "~/components/ui/icons/UserGroupIconFilled";
import MegaphoneFilled from "~/components/ui/icons/MegaphoneFilled";
import BookStackIconFilled from "~/components/ui/icons/knowledgeBase/BookStackIconFilled";
import IconHelpDesk from "./IconHelpDesk";
import clsx from "clsx";
import IconPages from "./IconPages";
import MembershipCardIcon from "~/components/ui/icons/MembershipCardIcon";
import IconOnboarding from "./IconOnboarding";
import IconFeatureFlags from "./IconFeatureFlags";
import IconPromptBuilder from "./IconPromptBuilder";
// import IconEntities from "./IconEntities";

interface Props {
  className: string;
  item: SideBarItem;
}

export default function SidebarIcon({ className, item }: Props) {
  return (
    <span>
      {typeof item.icon !== "number" && item.icon}

      {/* Core */}
      {item.icon === SvgIcon.ADMIN && <IconAdmin className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.TENANTS && <MembershipCardIcon className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.USERS && <IconUsers className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.ROLES && <IconRoles className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.PRICING && <IconPricing className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.EMAILS && <IconEmails className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.NAVIGATION && <IconNavigation className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.COMPONENTS && <IconComponents className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.MEMBERS && <IconMembers className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.PROFILE && <IconProfile className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.APP && <IconApp className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.DASHBOARD && <IconDashboard className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.SETTINGS && <IconSettings className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.SETUP && <IconCode className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.LOGS && <IconHistory className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.EVENTS && <IconEvents className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.BLOG && <IconBlog className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.ENTITIES && <IconEntities className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.KEYS && <IconKeys className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.DOCS && <IconDocs className={clsx(className, "text-theme-50")} />}
      {/* App */}
      {item.icon === SvgIcon.LINKS && <IconLinks className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.PROVIDERS && <IconProviders className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.CLIENTS && <UserGroupIconFilled className={clsx(className, "text-theme-50")} />}
      {item.entityIcon && <EntityIcon className={clsx(className, "text-theme-50")} icon={item.entityIcon} title={item.title} />}
      {item.icon === SvgIcon.ANALYTICS && <IconAnalytics className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.AFFILIATES_AND_REFERRALS && <MegaphoneFilled className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.KNOWLEDGE_BASE && <BookStackIconFilled className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.HELP_DESK && <IconHelpDesk className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.ONBOARDING && <IconOnboarding className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.PAGES && <IconPages className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.FEATURE_FLAGS && <IconFeatureFlags className={clsx(className, "text-theme-50")} />}
      {item.icon === SvgIcon.PROMPT_BUILDER && <IconPromptBuilder className={clsx(className, "text-theme-50")} />}
    </span>
  );
}
