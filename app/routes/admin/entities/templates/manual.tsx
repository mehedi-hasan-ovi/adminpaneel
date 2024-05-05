import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { Form, Link } from "@remix-run/react";
import { useState } from "react";
import { useTypedActionData } from "remix-typedjson";
import PreviewEntitiesTemplate from "~/components/entities/templates/PreviewEntitiesTemplate";
import ButtonPrimary from "~/components/ui/buttons/ButtonPrimary";
import ServerError from "~/components/ui/errors/ServerError";
import InputText from "~/components/ui/input/InputText";
import EditPageLayout from "~/components/ui/layouts/EditPageLayout";
import { i18nHelper } from "~/locale/i18n.utils";
import * as DefaultEntityTemplates from "~/modules/templates/defaultEntityTemplates";
import { EntitiesTemplateDto } from "~/modules/templates/EntityTemplateDto";
import { importEntitiesFromTemplate, validateEntitiesFromTemplate } from "~/utils/services/entitiesTemplatesService";
import { getUserInfo } from "~/utils/session.server";

export let loader: LoaderFunction = async () => {
  return json({});
};

type ActionData = {
  previewTemplate?: EntitiesTemplateDto;
  success?: string;
  error?: string;
};
const success = (data: ActionData) => json(data, { status: 200 });
const badRequest = (data: ActionData) => json(data, { status: 400 });
export const action: ActionFunction = async ({ request }) => {
  const { t } = await i18nHelper(request);
  const userInfo = await getUserInfo(request);
  const form = await request.formData();
  const action = form.get("action");
  if (action === "preview") {
    try {
      const previewTemplate = JSON.parse(form.get("configuration")?.toString() ?? "{}") as EntitiesTemplateDto;
      await validateEntitiesFromTemplate(previewTemplate);
      const data: ActionData = {
        previewTemplate,
      };
      return success(data);
    } catch (error: any) {
      return badRequest({ error: error.message });
    }
  } else if (action === "create") {
    try {
      const template = JSON.parse(form.get("configuration")?.toString() ?? "{}") as EntitiesTemplateDto;
      const entities = await importEntitiesFromTemplate({
        template,
        createdByUserId: userInfo.userId,
      });
      return success({
        success: `Created entities: ${entities.map((e) => t(e.titlePlural)).join(", ")}`,
      });
    } catch (error: any) {
      return badRequest({ error: error.message });
    }
  } else {
    return badRequest({ error: "Invalid form" });
  }
};

const defaultTemplates: { title: string; template: EntitiesTemplateDto }[] = [
  { title: "Default: CRM", template: DefaultEntityTemplates.CRM_ENTITIES_TEMPLATE },
  { title: "Default: Tenant Settings", template: DefaultEntityTemplates.TENANT_SETTINGS_ENTITIES_TEMPLATE },
  { title: "Example: Employee", template: DefaultEntityTemplates.EMPLOYEES_ENTITIES_TEMPLATE },
  { title: "Example: Custom entity", template: DefaultEntityTemplates.SAMPLE_ENTITY_WITH_CUSTOM_FIELDS },
  { title: "Example: Contracts", template: DefaultEntityTemplates.CONTRACTS_ENTITIES_TEMPLATE },
  { title: "Example: All Property Types Entity", template: DefaultEntityTemplates.ALL_PROPERTY_TYPES_ENTITY_TEMPLATE },
];

export default function AdminEntityTemplatesManual() {
  const actionData = useTypedActionData<ActionData>();
  const [configuration, setConfiguration] = useState<string>("");

  return (
    <EditPageLayout
      title="Upload a JSON configuration"
      withHome={false}
      menu={[
        {
          title: "Templates",
          routePath: "/admin/entities/templates",
        },
        {
          title: "Manual",
          routePath: "/admin/entities/templates/manual",
        },
      ]}
    >
      <div className="md:border-t md:border-gray-200 md:py-2">
        {actionData?.error ? (
          <>
            <p id="form-error-message" className="py-2 text-sm text-rose-500" role="alert">
              {actionData.error}
            </p>
          </>
        ) : actionData?.success ? (
          <>
            <p id="form-success-message" className="text-text-500 py-2 text-sm" role="alert">
              {actionData.success}
            </p>
            <Link to="/admin/entities" className="text-sm font-medium text-theme-600 underline hover:text-theme-500">
              Go to entities
            </Link>
          </>
        ) : actionData?.previewTemplate === undefined ? (
          <>
            <Form method="post">
              <input type="hidden" name="action" value="preview" readOnly />
              <div className="space-y-3">
                <div className="flex space-x-2">
                  {defaultTemplates.map((t) => (
                    <button
                      key={t.title}
                      type="button"
                      onClick={() => setConfiguration(JSON.stringify(t.template, null, "\t"))}
                      className="inline-flex items-center rounded border border-transparent bg-theme-100 px-2.5 py-1.5 text-xs font-medium text-theme-700 hover:bg-theme-200 focus:outline-none focus:ring-2 focus:ring-theme-500 focus:ring-offset-2"
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
                <div>
                  <InputText
                    name="configuration"
                    title="Configuration"
                    editor="monaco"
                    editorLanguage="json"
                    value={configuration}
                    setValue={setConfiguration}
                    editorSize="lg"
                  />
                </div>
                <div className="flex justify-end">
                  <ButtonPrimary type="submit">Preview</ButtonPrimary>
                </div>
              </div>
            </Form>
          </>
        ) : (
          actionData?.previewTemplate !== undefined && (
            <>
              <div className="md:border-b md:border-gray-200 md:py-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Preview entities</h3>
                </div>
              </div>
              <Form method="post">
                <input type="hidden" name="action" value="create" readOnly />
                <input type="hidden" name="configuration" value={configuration} readOnly />
                <div className="space-y-2">
                  <PreviewEntitiesTemplate template={actionData.previewTemplate} />
                  <div className="flex justify-end space-x-2">
                    <ButtonPrimary type="submit">
                      {actionData.previewTemplate.entities.length === 1 ? (
                        <span>Create 1 entity</span>
                      ) : (
                        <span>Create {actionData.previewTemplate.entities.length} entities</span>
                      )}
                    </ButtonPrimary>
                  </div>
                </div>
              </Form>
            </>
          )
        )}
      </div>
    </EditPageLayout>
  );
}

export function ErrorBoundary() {
  return <ServerError />;
}
