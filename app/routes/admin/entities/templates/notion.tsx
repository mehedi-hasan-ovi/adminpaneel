import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { Form, Link } from "@remix-run/react";
import { useTypedActionData } from "remix-typedjson";
import { PropertyType } from "~/application/enums/entities/PropertyType";
import PreviewEntitiesTemplate from "~/components/entities/templates/PreviewEntitiesTemplate";
import ButtonPrimary from "~/components/ui/buttons/ButtonPrimary";
import ServerError from "~/components/ui/errors/ServerError";
import EditPageLayout from "~/components/ui/layouts/EditPageLayout";
import UnderConstruction from "~/components/ui/misc/UnderConstruction";
import { EntitiesTemplateDto } from "~/modules/templates/EntityTemplateDto";
import getMaxEntityOrder, { createEntity, findEntityByName, getEntityByName } from "~/utils/db/entities/entities.db.server";
import { createEntityRelationship } from "~/utils/db/entities/entityRelationships.db.server";
import { createProperty, updatePropertyAttributes, updatePropertyOptions } from "~/utils/db/entities/properties.db.server";
import { createEntityPermissions } from "~/utils/db/permissions/permissions.db.server";
import OrderHelper from "~/utils/helpers/OrderHelper";
import notionService from "~/utils/integrations/notionService";

type LoaderData = {
  tokenAlreadySet: boolean;
};
export let loader: LoaderFunction = async () => {
  const data: LoaderData = {
    tokenAlreadySet: (process.env.NOTION_TOKEN?.toString() ?? "").length > 0,
  };

  return json(data);
};

type ActionData = {
  databases?: any[];
  previewTemplate?: EntitiesTemplateDto;
  success?: string;
  error?: string;
};
const success = (data: ActionData) => json(data, { status: 200 });
const badRequest = (data: ActionData) => json(data, { status: 400 });
export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const action = form.get("action");
  const token = process.env.NOTION_TOKEN?.toString() ?? form.get("token")?.toString() ?? "";
  if (action === "load") {
    return success({
      databases: await notionService.getDatabases({ token }),
    });
  } else if (action === "preview") {
    try {
      const baseId = form.get("baseId")?.toString();
      if (!baseId) {
        return badRequest({ error: "Airtable base ID is required" });
      }
      const previewTemplate: EntitiesTemplateDto = {
        entities: [],
        relationships: [],
      };
      // baseTables.forEach((table) => {
      //   const entity = {
      //     type: "all",
      //     name: table.name,
      //     slug: table.name,
      //     title: table.name,
      //     titlePlural: table.name,
      //     prefix: table.name,
      //     properties: table.fields.map((field) => {
      //       return {
      //         name: field.name,
      //         title: field.name,
      //         type: mapToEntityTemplateType(airtableService.mapFieldType(field.type)),
      //       };
      //     }),
      //   };
      //   previewTemplate.entities.push(entity);
      // });
      if (previewTemplate.entities.length === 0) {
        throw Error("Invalid configuration");
      }
      await Promise.all(
        previewTemplate.entities.map(async (entity) => {
          const existingEntity = await findEntityByName({ tenantId: null, name: entity.name });
          if (existingEntity) {
            throw Error("Entity already exists: " + entity.name);
          }
          if (!entity.properties || entity.properties.length === 0) {
            throw Error("Entity has no properties: " + entity.name);
          }
          entity.properties.forEach((property) => {
            if (property.name.includes(" ")) {
              throw Error("Property names cannot contain spaces: " + property.name);
            }
            if (property.name.includes("-")) {
              throw Error("Property names cannot contain '-': " + property.name);
            }
          });
        })
      );
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
      const maxEntityOrder = await getMaxEntityOrder();
      const createdEntities = await Promise.all(
        template.entities.map(async (entity, idx) => {
          const created = await createEntity(
            {
              name: entity.name,
              slug: entity.slug,
              prefix: entity.prefix,
              title: entity.title,
              titlePlural: entity.titlePlural,
              isAutogenerated: entity.isAutogenerated ?? true,
              hasApi: entity.hasApi ?? true,
              icon: entity.icon ?? "",
              active: entity.active ?? true,
              type: entity.type,
              showInSidebar: entity.showInSidebar ?? true,
              hasTags: entity.hasTags ?? true,
              hasComments: entity.hasComments ?? true,
              hasTasks: entity.hasTasks ?? false,
              hasWorkflow: false,
              hasActivity: entity.hasActivity !== undefined ? entity.hasActivity : true,
              hasBulkDelete: entity.hasBulkDelete !== undefined ? entity.hasBulkDelete : false,
              defaultVisibility: entity.defaultVisibility ?? "private",
              onCreated: entity.onCreated ?? "redirectToOverview",
              onEdit: entity.onEdit ?? "editRoute",
            },
            undefined,
            undefined,
            maxEntityOrder + idx + 1
          );
          // eslint-disable-next-line no-console
          console.log("Entity created", created.name);
          if (!created) {
            throw new Error("Unable to create entity: " + JSON.stringify(entity));
          }
          await createEntityPermissions(created);

          const newEntity = await getEntityByName({ tenantId: null, name: created.name });
          const propertyOrder = OrderHelper.getNextOrder(newEntity.properties);
          await Promise.all(
            entity.properties.map(async (property, idxProperty) => {
              let type: PropertyType | undefined = undefined;
              if (property.type === "string") {
                type = PropertyType.TEXT;
              } else if (property.type === "number") {
                type = PropertyType.NUMBER;
              } else if (property.type === "boolean") {
                type = PropertyType.BOOLEAN;
              } else if (property.type === "date") {
                type = PropertyType.DATE;
              } else if (property.type === "media") {
                type = PropertyType.MEDIA;
              } else if (property.type === "select") {
                type = PropertyType.SELECT;
              } else {
                throw new Error("Invalid property type: " + property.type);
              }
              const createdProperty = await createProperty({
                entityId: created.id,
                name: property.name,
                title: property.title,
                type,
                subtype: property.subtype ?? null,
                isDynamic: property.isDynamic ?? true,
                order: propertyOrder + idxProperty,
                isDefault: false,
                isRequired: property.isRequired ?? false,
                isHidden: false,
                isDisplay: property.isDisplay ?? false,
                isReadOnly: property.isReadOnly ?? false,
                canUpdate: property.canUpdate !== undefined ? property.canUpdate : true,
                showInCreate: property.showInCreate ?? true,
                formulaId: null,
                tenantId: property.tenantId ?? null,
              });
              if (property.options) {
                await updatePropertyOptions(
                  createdProperty.id,
                  property.options.map((item, idxOption) => {
                    return {
                      order: idxOption + 1,
                      value: item.value,
                      name: item.name,
                      color: item.color,
                    };
                  })
                );
              }
              if (property.attributes) {
                await updatePropertyAttributes(
                  createdProperty.id,
                  property.attributes.map((item) => {
                    return {
                      value: item.value,
                      name: item.name,
                    };
                  })
                );
              }
            })
          );

          return created;
        })
      );
      if (createdEntities.length > 0 && template.relationships) {
        await Promise.all(
          template.relationships.map(async (relationship) => {
            const fromEntity = await getEntityByName({ tenantId: null, name: relationship.parent });
            const toEntity = await getEntityByName({ tenantId: null, name: relationship.child });
            return await createEntityRelationship({
              parentId: fromEntity.id,
              childId: toEntity.id,
              order: relationship.order ?? 0,
              title: relationship.title ?? null,
              type: relationship.type ?? "one-to-many",
              required: relationship.required ?? false,
              cascade: false,
              readOnly: relationship.readOnly ?? false,
              hiddenIfEmpty: relationship.hiddenIfEmpty !== undefined ? relationship.hiddenIfEmpty : false,
              childEntityViewId: null,
              parentEntityViewId: null,
            });
          })
        );
      }
      return success({
        success: `Created entities: ${createdEntities.map((e) => e.name).join(", ")}`,
      });
    } catch (error: any) {
      return badRequest({ error: error.message });
    }
  } else {
    return badRequest({ error: "Invalid form" });
  }
};

export default function AdminEntityTemplatesManual() {
  // const { t } = useTranslation();
  // const data = useLoaderData<LoaderData>();
  const actionData = useTypedActionData<ActionData>();
  // const [token, setToken] = useState<string>(data.tokenAlreadySet ? "************" : "");

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
          title: "Airtable",
          routePath: "/admin/entities/templates/airtable",
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
            <UnderConstruction title="NOTION: IMPORT DATABASES TO SAASROCK ENTITIES" />

            {/* <Form method="post" className="mx-auto max-w-md">
              <input type="hidden" name="action" value="load" readOnly />
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <InputText
                    type="password"
                    name="token"
                    title="Token"
                    hint={
                      <div>
                        <a className="underline hover:text-blue-500" href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer">
                          Get token
                        </a>
                      </div>
                    }
                    disabled={data.tokenAlreadySet}
                    value={token}
                    setValue={setToken}
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <ButtonPrimary type="submit">Load</ButtonPrimary>
                </div>
              </div>
            </Form> */}
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
