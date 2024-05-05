import FooterBlock from "~/modules/pageBlocks/components/blocks/marketing/footer/FooterBlock";
import HeaderBlock from "~/modules/pageBlocks/components/blocks/marketing/header/HeaderBlock";
import { useEffect, useRef, useState } from "react";
import { ActionFunction, json, LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { i18nHelper } from "~/locale/i18n.utils";
import OpenSuccessModal from "~/components/ui/modals/OpenSuccessModal";
import OpenErrorModal from "~/components/ui/modals/OpenErrorModal";
import ServerError from "~/components/ui/errors/ServerError";
import WarningBanner from "~/components/ui/banners/WarningBanner";
import CrmService, { ContactFormSettings } from "~/modules/crm/services/CrmService";
import { getCurrentPage } from "~/modules/pageBlocks/services/pagesService";
import PageBlocks from "~/modules/pageBlocks/components/blocks/PageBlocks";
import { PageLoaderData } from "~/modules/pageBlocks/dtos/PageBlockData";
import { useTypedLoaderData } from "remix-typedjson";
import { createMetrics } from "~/modules/metrics/utils/MetricTracker";

type LoaderData = PageLoaderData & {
  settings: ContactFormSettings;
};
export let loader = async ({ request, params }: LoaderArgs) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "contact");
  const page = await time(getCurrentPage({ request, params, slug: "/contact" }), "getCurrentPage.contact");
  const data: LoaderData = {
    ...page,
    settings: await CrmService.getContactFormSettings(),
  };
  return json(data, { headers: getServerTimingHeader() });
};

type ActionData = {
  error?: string;
  success?: string;
};
export const action: ActionFunction = async ({ request }) => {
  const { t } = await i18nHelper(request);
  const form = await request.formData();
  const action = form.get("action");
  if (action === "submission") {
    const submission = {
      firstName: form.get("first_name")?.toString() ?? "",
      lastName: form.get("last_name")?.toString() ?? "",
      email: form.get("email")?.toString() ?? "",
      company: form.get("company")?.toString() ?? "",
      jobTitle: form.get("jobTitle")?.toString() ?? "",
      users: form.get("users")?.toString() ?? "",
      message: form.get("comments")?.toString() ?? "",
    };
    const existingContact = await CrmService.createContactSubmission(submission);
    if (existingContact) {
      const data: ActionData = {
        success: t("front.contact.success", [submission.firstName]),
      };
      return json(data, { status: 200 });
    } else {
      const data: ActionData = {
        error: t("front.contact.error"),
      };
      return json(data, { status: 400 });
    }
  } else {
    const data: ActionData = {
      error: t("shared.invalidForm"),
    };
    return json(data, { status: 200 });
  }
};

export const meta: V2_MetaFunction = ({ data }) => data?.metaTags;

export default function ContactRoute() {
  const { t } = useTranslation();
  const data = useTypedLoaderData<LoaderData>();
  const actionData = useActionData<{ error?: string; success?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting" && navigation.formData.get("action") === "submission";

  const formRef = useRef<HTMLFormElement>(null);

  const [actionResult, setActionResult] = useState<{ error?: string; success?: string }>();

  useEffect(() => {
    setActionResult(actionData);
  }, [actionData]);

  useEffect(() => {
    if (!isSubmitting && actionData?.success) {
      formRef.current?.reset();
    }
  }, [actionData?.success, isSubmitting]);

  return (
    <div>
      <div>
        <HeaderBlock />
        <PageBlocks items={data.blocks} />
        <div className="bg-white dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="sm:align-center sm:flex sm:flex-col">
              <div className="relative mx-auto w-full max-w-xl overflow-hidden px-2 py-12 sm:py-6">
                <svg className="absolute left-full translate-x-1/2 transform" width="404" height="404" fill="none" viewBox="0 0 404 404" aria-hidden="true">
                  <defs>
                    <pattern id="85737c0e-0916-41d7-917f-596dc7edfa27" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                      <rect x="0" y="0" width="4" height="4" className="text-gray-200 dark:text-black" fill="currentColor" />
                    </pattern>
                  </defs>
                  <rect width="404" height="404" fill="url(#85737c0e-0916-41d7-917f-596dc7edfa27)" />
                </svg>
                <svg
                  className="absolute bottom-0 right-full -translate-x-1/2 transform"
                  width="404"
                  height="404"
                  fill="none"
                  viewBox="0 0 404 404"
                  aria-hidden="true"
                >
                  <defs>
                    <pattern id="85737c0e-0916-41d7-917f-596dc7edfa27" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                      <rect x="0" y="0" width="4" height="4" className="text-gray-200 dark:text-black" fill="currentColor" />
                    </pattern>
                  </defs>
                  <rect width="404" height="404" fill="url(#85737c0e-0916-41d7-917f-596dc7edfa27)" />
                </svg>
                <div className="text-center">
                  <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 dark:text-slate-200 sm:text-4xl">{t("front.contact.title")}</h1>
                  <p className="mt-4 text-lg leading-6 text-gray-500">{t("front.contact.headline")}</p>
                </div>
                {/* <div className="flex justify-center mt-6">
                  <Tabs
                    breakpoint="sm"
                    tabs={[
                      {
                        name: t("blog.title"),
                        routePath: "/blog",
                      },
                      {
                        name: t("front.changelog.title"),
                        routePath: "/changelog",
                      },
                      // {
                      //   name: t("front.newsletter.title"),
                      //   routePath: "/newsletter",
                      // },
                      {
                        name: t("front.contact.title"),
                        routePath: "/contact",
                      },
                    ]}
                  />
                </div> */}
                <div className="mt-12">
                  {data.settings.error ? (
                    <WarningBanner title={t("shared.error")} text={data.settings.error} />
                  ) : data.settings.actionUrl ? (
                    <form ref={formRef} action={data.settings.actionUrl} method="POST">
                      <ContactForm />
                    </form>
                  ) : data.settings.crm ? (
                    <Form ref={formRef} method="post">
                      <input type="hidden" readOnly hidden name="action" value="submission" />
                      <ContactForm />
                    </Form>
                  ) : null}
                  <div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <FooterBlock />
      </div>

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
  );
}

export function ErrorBoundary() {
  return <ServerError />;
}

function ContactForm() {
  const { t } = useTranslation();
  return (
    <div className="mt-9 grid grid-cols-1 gap-x-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4">
      <div>
        <label htmlFor="first_name" className="block text-sm font-medium text-gray-900 dark:text-slate-500">
          {t("front.contact.firstName")}
          <span className="ml-1 text-red-500">*</span>
        </label>
        <div className="mt-1">
          <input
            required
            type="text"
            name="first_name"
            id="first_name"
            autoComplete="given-name"
            className="relative block w-full appearance-none rounded-none rounded-b-sm border-gray-300 bg-gray-50 px-3 py-2 text-gray-800 placeholder-gray-500 focus:z-10 focus:border-theme-300 focus:outline-none focus:ring-theme-300 dark:border-gray-600 dark:bg-gray-900 dark:text-slate-200 sm:text-sm"
          />
        </div>
      </div>
      <div>
        <label htmlFor="last_name" className="block text-sm font-medium text-gray-900 dark:text-slate-500">
          {t("front.contact.lastName")}
          <span className="ml-1 text-red-500">*</span>
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="last_name"
            id="last_name"
            autoComplete="family-name"
            className="relative block w-full appearance-none rounded-none rounded-b-sm border-gray-300 bg-gray-50 px-3 py-2 text-gray-800 placeholder-gray-500 focus:z-10 focus:border-theme-300 focus:outline-none focus:ring-theme-300 dark:border-gray-600 dark:bg-gray-900 dark:text-slate-200 sm:text-sm"
          />
        </div>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-slate-500">
          {t("front.contact.email")}
          <span className="ml-1 text-red-500">*</span>
        </label>
        <div className="mt-1">
          <input
            required
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="relative block w-full appearance-none rounded-none rounded-b-sm border-gray-300 bg-gray-50 px-3 py-2 text-gray-800 placeholder-gray-500 focus:z-10 focus:border-theme-300 focus:outline-none focus:ring-theme-300 dark:border-gray-600 dark:bg-gray-900 dark:text-slate-200 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between">
          <label htmlFor="company" className="block text-sm font-medium text-gray-900 dark:text-slate-500">
            {t("front.contact.organization")}
          </label>
        </div>
        <div className="mt-1">
          <input
            type="text"
            name="company"
            id="company"
            autoComplete="organization"
            className="relative block w-full appearance-none rounded-none rounded-b-sm border-gray-300 bg-gray-50 px-3 py-2 text-gray-800 placeholder-gray-500 focus:z-10 focus:border-theme-300 focus:outline-none focus:ring-theme-300 dark:border-gray-600 dark:bg-gray-900 dark:text-slate-200 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between">
          <label htmlFor="company" className="block text-sm font-medium text-gray-900 dark:text-slate-500">
            {t("front.contact.jobTitle")}
          </label>
        </div>
        <div className="mt-1">
          <input
            type="text"
            name="jobTitle"
            id="organization-title"
            autoComplete="organization-title"
            className="relative block w-full appearance-none rounded-none rounded-b-sm border-gray-300 bg-gray-50 px-3 py-2 text-gray-800 placeholder-gray-500 focus:z-10 focus:border-theme-300 focus:outline-none focus:ring-theme-300 dark:border-gray-600 dark:bg-gray-900 dark:text-slate-200 sm:text-sm"
          />
        </div>
      </div>

      <fieldset className="sm:col-span-2">
        <legend className="block text-sm font-medium text-gray-900 dark:text-slate-500">{t("front.contact.users")}</legend>
        <div className="mt-4 grid grid-cols-1 gap-y-4">
          <select
            id="users"
            name="users"
            required
            className="relative block w-full appearance-none rounded-none rounded-b-sm border-gray-300 bg-gray-50 px-3 py-2 text-gray-800 placeholder-gray-500 focus:z-10 focus:border-theme-300 focus:outline-none focus:ring-theme-300 dark:border-gray-600 dark:bg-gray-900 dark:text-slate-200 sm:text-sm"
          >
            {["1", "2 - 3", "4 - 10", "11 - 25", "26 - 50", "51 - 100", "+100"].map((option, idx) => {
              return (
                <option key={idx} value={option}>
                  {option}
                </option>
              );
            })}
          </select>
        </div>
      </fieldset>

      <div className="sm:col-span-2">
        <div className="flex justify-between">
          <label htmlFor="comments" className="block text-sm font-medium text-gray-900 dark:text-slate-500">
            {t("front.contact.comments")}
            <span className="ml-1 text-red-500">*</span>
          </label>
        </div>
        <div className="mt-1">
          <textarea
            required
            id="comments"
            name="comments"
            aria-describedby="comments_description"
            rows={4}
            className="relative block w-full appearance-none rounded-none rounded-b-sm border-gray-300 bg-gray-50 px-3 py-2 text-gray-800 placeholder-gray-500 focus:z-10 focus:border-theme-300 focus:outline-none focus:ring-theme-300 dark:border-gray-600 dark:bg-gray-900 dark:text-slate-200 sm:text-sm"
          ></textarea>
        </div>
      </div>

      <div className="text-right sm:col-span-2">
        <button
          type="submit"
          className="inline-flex justify-center rounded-sm border border-transparent bg-theme-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-theme-600 focus:outline-none focus:ring-2 focus:ring-theme-500 focus:ring-offset-2"
        >
          {t("front.contact.send")}
        </button>
      </div>
    </div>
  );
}
