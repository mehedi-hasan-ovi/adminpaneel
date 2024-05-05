import ApiKeyBadge from "~/components/core/users/ApiKeyBadge";
import UserAvatarBadge from "~/components/core/users/UserAvatarBadge";
import UserBadge from "~/components/core/users/UserBadge";
import LightningBoltFilledIcon from "~/components/ui/icons/LightningBoltFilledIcon";
import { LogWithDetails } from "~/utils/db/logs.db.server";
import DateUtils from "~/utils/shared/DateUtils";

interface Props {
  item: LogWithDetails;
}
export default function RowLogWorkflowTransition({ item }: Props) {
  return (
    <>
      {item.workflowTransition && (
        <>
          <div className="relative px-1">
            <UserAvatarBadge className="h-9 w-9" avatar={item.user?.avatar} />

            <span className="absolute -bottom-0.5 -right-1 rounded-tl bg-gray-50 px-0.5 py-px">
              <LightningBoltFilledIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </span>
          </div>
          <div className="group min-w-0 flex-1 space-y-0.5 text-gray-500 ">
            <span>
              <div className="text-sm">
                <div className="font-medium text-gray-900">
                  {item.user && <UserBadge item={item.user} withEmail={false} />}
                  {item.apiKey && <ApiKeyBadge item={item.apiKey} />}
                </div>
              </div>
            </span>
            <span className="">{item.details} </span>
            <span className="whitespace-nowrap pt-1">
              <time dateTime={DateUtils.dateYMDHMS(item.createdAt)}>{DateUtils.dateAgo(item.createdAt)}</time>
            </span>
          </div>
        </>
      )}
    </>
  );
}
