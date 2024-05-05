import clsx from "clsx";
import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Form, useActionData, useLocation, useNavigate, useNavigation, useParams } from "@remix-run/react";
import { PlanFeatureUsageDto } from "~/application/dtos/subscriptions/PlanFeatureUsageDto";
import { RefErrorModal } from "~/components/ui/modals/ErrorModal";
import { RefSuccessModal } from "~/components/ui/modals/SuccessModal";
import { NewMemberActionData } from "~/routes/app.$tenant/settings/members/new";
import UrlUtils from "~/utils/app/UrlUtils";
import { useEscapeKeypress } from "~/utils/shared/KeypressUtils";
import CheckPlanFeatureLimit from "../subscription/CheckPlanFeatureLimit";
import InputCheckboxWithDescription from "~/components/ui/input/InputCheckboxWithDescription";

interface Props {
  featurePlanUsage: PlanFeatureUsageDto | undefined;
}

export default function NewMember({ featurePlanUsage }: Props) {
  const params = useParams();
  const location = useLocation();
  const actionData = useActionData<NewMemberActionData>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const navigation = useNavigation();

  const loading = navigation.state === "submitting";

  const errorModal = useRef<RefErrorModal>(null);
  const successModal = useRef<RefSuccessModal>(null);
  const inputEmail = useRef<HTMLInputElement>(null);

  const [sendEmail, setSendEmail] = useState<boolean>(false);

  useEffect(() => {
    if (actionData?.error) {
      errorModal.current?.show(actionData.error);
    }
    if (actionData?.success) {
      successModal.current?.show(t("shared.success"), actionData.success);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionData]);

  useEffect(() => {
    // nextTick(() => {
    if (inputEmail.current) {
      inputEmail.current?.focus();
      inputEmail.current?.select();
    }
    // });
  }, []);

  function close() {
    if (location.pathname.startsWith("/app")) {
      navigate(UrlUtils.currentTenantUrl(params, "settings/members"), { replace: true });
    } else {
      navigate("/admin/members", { replace: true });
    }
  }

  useEscapeKeypress(close);
  return (
    <CheckPlanFeatureLimit item={featurePlanUsage}>
      <Form method="post" className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {/*Email */}
          <div className="col-span-2">
            <label htmlFor="email" className="block truncate text-xs font-medium text-gray-700">
              <div className="flex space-x-1 truncate">
                <div>{t("models.user.email")}</div>
                <div className="ml-1 text-red-500">*</div>
              </div>
            </label>
            <div className="mt-1 flex w-full rounded-md shadow-sm">
              <input
                type="email"
                ref={inputEmail}
                name="email"
                id="email"
                autoComplete="off"
                required
                defaultValue={actionData?.fields?.email}
                disabled={loading}
                className={clsx(
                  "block w-full min-w-0 flex-1 rounded-md border-gray-300 lowercase focus:border-theme-500 focus:ring-theme-500 sm:text-sm",
                  loading && "cursor-not-allowed bg-gray-100"
                )}
              />
            </div>
          </div>
          {/*Email: End */}

          {/*User First Name */}
          <div>
            <label htmlFor="first-name" className="block truncate text-xs font-medium text-gray-700">
              <div className="flex space-x-1 truncate">
                <div>{t("models.user.firstName")}</div>
                <div className="ml-1 text-red-500">*</div>
              </div>
            </label>
            <div className="mt-1 flex w-full rounded-md shadow-sm">
              <input
                type="text"
                id="first-name"
                name="first-name"
                autoComplete="off"
                required
                defaultValue={actionData?.fields?.firstName}
                className={clsx(
                  "block w-full min-w-0 flex-1 rounded-md border-gray-300 focus:border-theme-500 focus:ring-theme-500 sm:text-sm",
                  loading && "cursor-not-allowed bg-gray-100"
                )}
              />
            </div>
          </div>
          {/*User First Name: End */}

          {/*User Last Name */}
          <div>
            <label htmlFor="last-name" className="block truncate text-xs font-medium text-gray-700">
              {t("models.user.lastName")}
            </label>
            <div className="mt-1 flex w-full rounded-md shadow-sm">
              <input
                type="text"
                id="last-name"
                name="last-name"
                autoComplete="off"
                defaultValue={actionData?.fields?.lastName}
                className={clsx(
                  "block w-full min-w-0 flex-1 rounded-md border-gray-300 focus:border-theme-500 focus:ring-theme-500 sm:text-sm",
                  loading && "cursor-not-allowed bg-gray-100"
                )}
              />
            </div>
          </div>
          {/*User Last Name: End */}

          <div className="col-span-2">
            <InputCheckboxWithDescription
              name="send-invitation-email"
              title="Send email"
              description="Send an invitation email to the user"
              value={sendEmail}
              setValue={setSendEmail}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-theme-700">{loading && <div>{t("shared.loading")}...</div>}</div>

          <div className="flex items-center space-x-2">
            <button
              disabled={loading}
              className={clsx(
                "inline-flex items-center space-x-2 border border-gray-300 bg-white px-3 py-2 font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-theme-500 focus:ring-offset-2 sm:rounded-md sm:text-sm",
                loading && "cursor-not-allowed bg-gray-100"
              )}
              type="button"
              onClick={close}
            >
              <div>{t("shared.cancel")}</div>
            </button>
            <button
              disabled={loading}
              className={clsx(
                "inline-flex items-center space-x-2 border border-transparent bg-theme-600 px-3 py-2 font-medium text-white shadow-sm hover:bg-theme-700 focus:outline-none focus:ring-2 focus:ring-theme-500 focus:ring-offset-2 sm:rounded-md sm:text-sm",
                loading && "cursor-not-allowed opacity-50"
              )}
              type="submit"
            >
              <div>{t("shared.invite")}</div>
            </button>
          </div>
        </div>
      </Form>
    </CheckPlanFeatureLimit>
  );
}
