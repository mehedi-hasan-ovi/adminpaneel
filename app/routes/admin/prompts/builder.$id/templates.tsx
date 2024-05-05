import { PromptFlowGroup } from "@prisma/client";
import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node";
import { Form, useParams } from "@remix-run/react";
import clsx from "clsx";
import { Fragment, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTypedActionData, useTypedLoaderData } from "remix-typedjson";
import MonacoEditor, { MonacoAutoCompletion } from "~/components/editors/MonacoEditor";
import ButtonPrimary from "~/components/ui/buttons/ButtonPrimary";
import PlusIcon from "~/components/ui/icons/PlusIcon";
import TrashIcon from "~/components/ui/icons/TrashIcon";
import InputNumber from "~/components/ui/input/InputNumber";
import InputText, { RefInputText } from "~/components/ui/input/InputText";
import ActionResultModal from "~/components/ui/modals/ActionResultModal";
import OrderIndexButtons from "~/components/ui/sort/OrderIndexButtons";
import TabsWithIcons from "~/components/ui/tabs/TabsWithIcons";
import { i18nHelper } from "~/locale/i18n.utils";
import { OpenAIDefaults } from "~/modules/ai/utils/OpenAIDefaults";
import { PromptTemplateDto } from "~/modules/promptBuilder/dtos/PromptTemplateDto";
import { getAllPromptFlowGroups } from "~/modules/promptBuilder/db/promptFlowGroups.db.server";
import { PromptFlowWithDetails, getPromptFlow, updatePromptFlow } from "~/modules/promptBuilder/db/promptFlows.db.server";
import { EntityWithDetails, getAllEntities } from "~/utils/db/entities/entities.db.server";
import { verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import InputSelector from "~/components/ui/input/InputSelector";
import PromptTemplateUtils from "~/modules/promptBuilder/utils/PromptFlowOutputUtils";
import Modal from "~/components/ui/modals/Modal";
import ButtonSecondary from "~/components/ui/buttons/ButtonSecondary";
import toast from "react-hot-toast";

type LoaderData = {
  item: PromptFlowWithDetails;
  allEntities: EntityWithDetails[];
  promptFlowGroups: PromptFlowGroup[];
};
export let loader = async ({ request, params }: LoaderArgs) => {
  const item = await getPromptFlow(params.id!);
  await verifyUserHasPermission(request, "admin.prompts.update");
  if (!item) {
    return redirect("/admin/prompts/builder");
  }
  const data: LoaderData = {
    item,
    allEntities: await getAllEntities({ tenantId: null }),
    promptFlowGroups: await getAllPromptFlowGroups(),
  };
  return json(data);
};

type ActionData = {
  error?: string;
  success?: string;
};
export const action = async ({ request, params }: ActionArgs) => {
  const { t } = await i18nHelper(request);
  const form = await request.formData();
  const action = form.get("action")?.toString();

  const item = await getPromptFlow(params.id!);
  if (!item) {
    return redirect("/admin/prompts/builder");
  }

  if (action === "save-templates") {
    const templates: PromptTemplateDto[] = form.getAll("templates[]").map((f) => {
      return JSON.parse(f.toString());
    });

    try {
      await updatePromptFlow(item.id, {
        templates,
      });
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error(e.message);
    }

    return json({ success: t("shared.saved") });
  } else {
    return json({ error: t("shared.invalidForm") }, { status: 400 });
  }
};

export default function () {
  const { t } = useTranslation();
  const data = useTypedLoaderData<LoaderData>();
  const actionData = useTypedActionData<ActionData>();
  const params = useParams();

  const [templates, setTemplates] = useState<PromptTemplateDto[]>(
    data.item?.templates.map((f) => {
      return {
        title: f.title,
        template: f.template,
        temperature: Number(f.temperature),
        maxTokens: Number(f.maxTokens),
        order: f.order,
      };
    }) || []
  );
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);

  useEffect(() => {
    if (actionData?.error) {
      toast.error(actionData.error);
    } else if (actionData?.success) {
      toast.success(actionData.success);
    }
  }, [actionData]);

  useEffect(() => {
    if (selectedIdx === -1 && templates.length > 0) {
      setSelectedIdx(0);
    } else if (templates.length === 0) {
      setTemplates([
        ...templates,
        {
          title: "Untitled " + (templates.length + 1),
          template: "",
          temperature: OpenAIDefaults.temperature,
          order: templates.length + 1,
          maxTokens: 0,
        },
      ]);
      setSelectedIdx(templates.length);
    }
  }, [selectedIdx, templates]);

  // function onSaveTemplate(item: PromptTemplateDto) {
  //   const idx = showModal?.idx;
  //   if (idx !== undefined) {
  //     templates[idx] = item;
  //   } else {
  //     templates.push({
  //       ...item,
  //       order: templates.length + 1,
  //     });
  //   }
  //   setTemplates([...templates]);
  //   setShowModal(undefined);
  // }

  function addTemplate() {
    setTemplates([
      ...templates,
      {
        title: "Untitled " + (templates.length + 1),
        template: "",
        temperature: OpenAIDefaults.temperature,
        order: templates.length + 1,
        maxTokens: 0,
      },
    ]);
    setSelectedIdx(templates.length);
  }

  return (
    <Form method="post" className="space-y-2">
      <TabsWithIcons
        tabs={[
          { name: "Settings", href: `/admin/prompts/builder/${params.id}`, current: false },
          { name: "Variables", href: `/admin/prompts/builder/${params.id}/variables`, current: false },
          { name: "Templates", href: `/admin/prompts/builder/${params.id}/templates`, current: true },
          { name: "Outputs", href: `/admin/prompts/builder/${params.id}/outputs`, current: false },
        ]}
      />

      <div className="my-1 overflow-hidden lg:h-[calc(100vh-250px)]">
        <input type="hidden" name="action" value="save-templates" hidden readOnly />
        {templates.map((template, index) => {
          return <input type="hidden" name="templates[]" value={JSON.stringify(template)} key={index} />;
        })}
        <div className="flex flex-col space-y-2 lg:flex-row lg:space-x-2 lg:space-y-0">
          <div className="overflow-y-auto lg:w-3/12">
            <div className="overflow-y-auto">
              <ul className="divide-y divide-gray-100 overflow-y-scroll rounded-md border border-gray-300 bg-white">
                {templates
                  .sort((a, b) => a.order - b.order)
                  .map((item, idx) => (
                    <li key={idx}>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIdx(idx);
                        }}
                        className={clsx(
                          "w-full cursor-pointer truncate rounded-sm border-2 border-dashed p-2 text-left text-sm",
                          selectedIdx === idx ? "border-gray-300 bg-gray-100 text-gray-900 " : "border-transparent text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <div className="group flex h-7 items-center justify-between space-x-1">
                          <div className="flex items-center space-x-2">
                            <OrderIndexButtons
                              className="flex-shrink-0"
                              idx={idx}
                              items={templates.map((f, i) => {
                                return {
                                  idx: i,
                                  order: f.order,
                                };
                              })}
                              onChange={(newItems) => {
                                setTemplates(
                                  newItems.map((f, i) => {
                                    return { ...templates[i], order: f.order };
                                  })
                                );
                              }}
                            />
                            <div className="flex flex-col truncate">
                              <div className="truncate">{item.title}</div>
                              {/* {file.directory && <span className="text-xs font-medium text-gray-400">{file.directory}/</span>} */}
                            </div>
                          </div>

                          <div className={clsx("hidden flex-shrink-0", templates.length > 0 && "group-hover:block")}>
                            <button
                              type="button"
                              disabled={templates.length === 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTemplates(
                                  templates
                                    .filter((f, i) => i !== idx)
                                    .map((f, idx) => {
                                      return { ...f, order: idx + 1 };
                                    })
                                );
                                setSelectedIdx(-1);
                              }}
                            >
                              <TrashIcon
                                className={clsx("h-4 w-4 text-gray-400", templates.length === 1 ? "cursor-not-allowed" : "cursor-pointer hover:text-gray-600")}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                <li>
                  <button
                    type="button"
                    onClick={addTemplate}
                    className={clsx(
                      "w-full  cursor-pointer truncate rounded-sm border-2 border-dashed p-2 text-left text-sm",
                      "border-transparent text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <div className="truncate text-center font-bold">
                        <PlusIcon className="h-4 w-4" />
                      </div>
                    </div>
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="overflow-y-auto rounded-md border border-gray-300 bg-white p-2 lg:h-[calc(100vh-250px)] lg:w-9/12">
            <div>
              <PromptTemplateForm
                key={selectedIdx}
                idx={selectedIdx}
                templates={templates}
                item={templates[selectedIdx]}
                promptFlow={data.item}
                onChanged={(idx, data) => {
                  templates[idx] = data;
                  setTemplates([...templates]);
                }}
                metadata={{
                  entities: data.allEntities,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-1">
        {/* <ButtonSecondary
          onClick={() => {
            setTemplates(
              data.item?.templates.map((f) => {
                return {
                  title: f.title,
                  template: f.template,
                  temperature: Number(f.temperature),
                  maxTokens: Number(f.maxTokens),
                  order: f.order,
                };
              }) || []
            );
          }}
        >
          {t("shared.reset")}
        </ButtonSecondary> */}
        <ButtonPrimary type="submit">{t("shared.save")}</ButtonPrimary>
      </div>
    </Form>
  );
}

function PromptTemplateForm({
  idx,
  templates,
  item,
  promptFlow,
  onChanged,
  metadata,
}: {
  idx: number;
  templates: PromptTemplateDto[];
  item?: PromptTemplateDto;
  promptFlow: PromptFlowWithDetails;
  onChanged: (idx: number, item: PromptTemplateDto) => void;
  metadata: {
    entities: EntityWithDetails[];
  };
}) {
  const { t } = useTranslation();

  const [autocompletions, setAutocompletions] = useState<MonacoAutoCompletion[]>([]);

  const [order] = useState<number>(item?.order || 0);
  const [title, setTitle] = useState<string>(item?.title || "");
  const [template, setTemplate] = useState<string>(item?.template || "");
  const [temperature, setTemperature] = useState<number>(item?.temperature || 0);
  const [maxTokens, setMaxTokens] = useState<number>(item?.maxTokens || 0);

  const mainInput = useRef<RefInputText>(null);
  useEffect(() => {
    setTimeout(() => {
      mainInput.current?.input.current?.focus();
      mainInput.current?.input.current?.select();
    }, 100);
  }, []);

  useEffect(() => {
    if (order !== item?.order || title !== item?.title || template !== item?.template || temperature !== item?.temperature || maxTokens !== item?.maxTokens) {
      onChanged(idx, {
        order,
        title,
        template,
        temperature,
        maxTokens,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, title, template, temperature, maxTokens]);

  useEffect(() => {
    const autocompletions: MonacoAutoCompletion[] = [];
    metadata.entities
      .sort((a, b) => a.order - b.order)
      .forEach((entity) => {
        if (promptFlow.inputEntity?.name !== entity.name) {
          return;
        }
        const label = `row.${entity.name}`;
        autocompletions.push({
          label,
          kind: "Value",
          documentation: t(entity.title),
          insertText: `${t(entity.titlePlural)}: {{${label}}}`,
          // range: range,
        });
        entity.properties
          .filter((f) => !f.isDefault)
          .sort((a, b) => a.order - b.order)
          .forEach((property) => {
            const label = `row.${entity.name}.${property.name}`;
            autocompletions.push({
              label,
              kind: "Value",
              documentation: t(property.title),
              insertText: `${t(property.title)}: {{${label}}}`,
            });
          });

        entity.childEntities.forEach((child) => {
          const childEntity = metadata.entities.find((f) => f.id === child.childId);
          if (!childEntity) {
            return;
          }
          const label = `row.${entity.name}.${childEntity.name}[]`;
          autocompletions.push({
            label,
            kind: "Value",
            documentation: t(childEntity.title),
            insertText: `${t(childEntity.titlePlural)}: {{${label}}}`,
            // range: range,
          });
          // childEntity.properties
          //   .filter((f) => !f.isDefault)
          //   .sort((a, b) => a.order - b.order)
          //   .forEach((property) => {
          //     const label = `row.${entity.name}.${childEntity.name}[].${property.name}`;
          //     autocompletions.push({
          //       label,
          //       kind: "Value",
          //       documentation: t(property.title),
          //       insertText: `${t(property.title)}: {{${label}}}`,
          //       // range: range,
          //     });
          //   });
        });
      });

    for (let index = 0; index < idx; index++) {
      const label = `promptFlow.results[${index}]`;
      const template = templates.length > index ? templates[index] : undefined;
      autocompletions.push({
        label,
        kind: "Value",
        documentation: !template ? "" : template.title,
        insertText: template?.title ? `${template?.title}: {{${label}}}` : `{{${label}}}`,
      });

      if (template) {
        autocompletions.push({
          label: template?.title,
          kind: "Value",
          documentation: !template ? "" : template.title,
          insertText: `${template.title}: {{${label}}}`,
        });
      }
    }
    promptFlow.inputVariables.forEach((inputVariable) => {
      const label = `${inputVariable.name}`;
      autocompletions.push({
        label,
        kind: "Value",
        documentation: t(inputVariable.title),
        insertText: `${inputVariable.title}: {{${label}}}`,
      });
    });
    setAutocompletions(autocompletions);
  }, [idx, metadata.entities, t, templates]);

  return (
    <div className="space-y-2 p-1">
      <div className="grid grid-cols-3 gap-2">
        <InputText ref={mainInput} autoFocus name="title" title={t("shared.title")} value={title} setValue={(e) => setTitle(e)} required />
        <InputNumber name="temperature" title="Temperature" value={temperature} setValue={(e) => setTemperature(e)} required min={0.1} max={1.0} step={"0.1"} />
        <InputNumber name="maxTokens" title="Max Tokens" value={maxTokens} setValue={(e) => setMaxTokens(e)} />
      </div>
      <div className="grid grid-cols-3 gap-2"></div>
      <div className="lg:h-[calc(100vh-240px)]">
        <label className="mb-1 flex justify-between space-x-2 truncate text-xs font-medium text-gray-600">
          <span>Template</span>
        </label>
        <MonacoEditor
          className="h-full"
          theme="vs-dark"
          name="template"
          value={template}
          onChange={(e) => setTemplate(e)}
          language="json"
          fontSize={14}
          autocompletions={autocompletions}
        />
      </div>
    </div>
  );
}
