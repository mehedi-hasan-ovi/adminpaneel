import { useSubmit, Outlet, useLoaderData, useActionData } from "@remix-run/react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import InfoBanner from "~/components/ui/banners/InfoBanner";
import WarningBanner from "~/components/ui/banners/WarningBanner";
import ButtonPrimary from "~/components/ui/buttons/ButtonPrimary";
import OpenErrorModal from "~/components/ui/modals/OpenErrorModal";
import OpenSuccessModal from "~/components/ui/modals/OpenSuccessModal";
import TableSimple from "~/components/ui/tables/TableSimple";
import { useAppOrAdminData } from "~/utils/data/useAppOrAdminData";
import { useRootData } from "~/utils/data/useRootData";
import { EmailSenderWithoutApiKey } from "../../db/emailSender";
import { Senders_List } from "../../routes/Senders_List";

export default function SendersListRoute() {
  const data = useLoaderData<Senders_List.LoaderData>();
  const { t } = useTranslation();
  const appOrAdminData = useAppOrAdminData();
  const rootData = useRootData();
  const submit = useSubmit();
  const actionData = useActionData<Senders_List.ActionData>();

  const [actionResult, setActionResult] = useState<{ error?: string; success?: string }>();
  useEffect(() => {
    setActionResult(actionData);
  }, [actionData]);

  function sendTest(item: EmailSenderWithoutApiKey) {
    const email = window.prompt("Email", appOrAdminData.user?.email);
    if (!email || email.trim() === "") {
      return;
    }
    const form = new FormData();
    form.set("action", "send-test");
    form.set("senderId", item.id);
    form.set("email", email);
    submit(form, {
      method: "post",
    });
  }
  return (
    <>
      <div className="mx-auto w-full max-w-5xl space-y-3 px-4 py-2 pb-6 sm:px-6 sm:pt-3 lg:px-8 xl:max-w-full">
        <div className="md:border-b md:border-gray-200 md:py-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium leading-6 text-gray-900">{t("emailMarketing.senders.plural")}</h3>
            <div className="flex items-center space-x-2">
              <ButtonPrimary to="new">{t("shared.new")}</ButtonPrimary>
            </div>
          </div>
        </div>

        {data.items.length === 0 ? (
          <InfoBanner title={t("shared.note")} text="">
            Go to your{" "}
            <a className="underline" target="_blank" rel="noreferrer" href="https://account.postmarkapp.com/servers">
              Postmark server
            </a>
            , click on the "API Tokens" tab, and copy the API token.
          </InfoBanner>
        ) : !data.hasSetWebhooks ? (
          <WarningBanner title={t("shared.warning")} text="">
            Go to your{" "}
            <a className="underline" target="_blank" rel="noreferrer" href="https://account.postmarkapp.com/servers">
              Postmark server
            </a>
            , click on the Message stream <i>(e.g. Default Broadcast Stream)</i>, then on the "<b>Webhooks</b>" tab, click "<b>Add webhook</b>", set the URL to
            "<b className="select-all">https://{rootData.appConfiguration.app.domain}/webhooks/email/postmark</b>", and select every event you want to track{" "}
            <i>(Deliveries, Bounces, Opens, Link Clicks, Unsubscribes...)</i>.
            <p className="mt-2">
              Finally, before clicking "<b>Save webhook</b>", click on the "<b>Send test</b>" button to make sure it works.
            </p>
          </WarningBanner>
        ) : null}

        <TableSimple
          headers={[
            {
              name: "provider",
              title: t("emailMarketing.senders.provider"),
              value: (item) => item.provider,
            },
            {
              name: "stream",
              title: t("emailMarketing.senders.stream"),
              value: (item) => item.stream,
            },
            {
              name: "fromEmail",
              title: t("emailMarketing.senders.fromEmail"),
              value: (item) => item.fromEmail,
            },
            {
              name: "fromName",
              title: t("emailMarketing.senders.fromName"),
              value: (item) => item.fromName,
            },
            {
              name: "replyToEmail",
              title: t("emailMarketing.senders.replyToEmail"),
              value: (item) => item.replyToEmail,
            },
          ]}
          items={data.items}
          actions={[
            {
              title: t("admin.emails.sendTest"),
              onClick: (_, item) => sendTest(item),
            },
            {
              title: t("shared.edit"),
              onClickRoute: (_, item) => item.id,
            },
          ]}
        ></TableSimple>

        <OpenSuccessModal
          title={t("shared.success")}
          description={actionResult?.success?.toString() ?? ""}
          open={!!actionResult?.success}
          onClose={() => setActionResult(undefined)}
        />

        <OpenErrorModal
          title={t("shared.error")}
          description={actionResult?.error?.toString() ?? ""}
          open={!!actionResult?.error}
          onClose={() => setActionResult(undefined)}
        />
      </div>
      <Outlet />
    </>
  );
}
