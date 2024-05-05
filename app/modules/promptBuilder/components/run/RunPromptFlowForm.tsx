import { Form, useSubmit } from "@remix-run/react";
import { PromptFlowWithDetails } from "../../db/promptFlows.db.server";
import InputText, { RefInputText } from "~/components/ui/input/InputText";
import { useEffect, useRef, useState } from "react";
import ButtonPrimary from "~/components/ui/buttons/ButtonPrimary";
import LoadingButton from "~/components/ui/buttons/LoadingButton";
import { useTypedActionData } from "remix-typedjson";
import { PromptFlowExecutionWithResults } from "../../db/promptExecutions.db.server";
import ButtonSecondary from "~/components/ui/buttons/ButtonSecondary";
import { useTranslation } from "react-i18next";
import { PromptExecutionResultDto } from "../../dtos/PromptExecutionResultDto";
import { RowWithDetails } from "~/utils/db/entities/rows.db.server";

interface Props {
  item: PromptFlowWithDetails;
  fromRows?: RowWithDetails[];
  toRows?: RowWithDetails[];
}
export default function RunPromptFlowForm({ item, fromRows, toRows }: Props) {
  const { t } = useTranslation();
  const actionData = useTypedActionData<{
    promptFlowExecutionResult?: PromptExecutionResultDto | null;
  }>();
  const submit = useSubmit();

  const [variables, setVariables] = useState<{ [key: string]: string }>({});
  const [result, setResult] = useState<PromptExecutionResultDto | null>(actionData?.promptFlowExecutionResult ?? null);

  const mainInput = useRef<RefInputText>(null);
  useEffect(() => {
    setTimeout(() => {
      mainInput.current?.input.current?.focus();
    }, 100);
  }, []);

  useEffect(() => {
    if (actionData?.promptFlowExecutionResult) {
      setResult(actionData.promptFlowExecutionResult);
    }
  }, [actionData?.promptFlowExecutionResult]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    submit(form, {
      method: "post",
    });
  }
  return (
    <div key={item.id} className="space-y-2">
      {/* <h2 className="font-medium text-gray-800">{item.description}</h2> */}
      {!result ? (
        <Form method="post" onSubmit={handleSubmit}>
          <input type="hidden" name="action" value="run-prompt-flow" readOnly hidden />
          <input type="hidden" name="promptFlowId" value={item.id} readOnly hidden />
          {item.inputVariables.map((f) => {
            return (
              <input
                type="hidden"
                name={"variables[]"}
                value={JSON.stringify({
                  name: f.name,
                  value: variables[f.name],
                })}
              />
            );
          })}
          {fromRows?.map((f) => {
            return <input type="hidden" name={"fromRows[]"} value={JSON.stringify({ id: f.id })} />;
          })}
          {toRows?.map((f) => {
            return <input type="hidden" name={"toRows[]"} value={JSON.stringify({ id: f.id })} />;
          })}
          <div className="space-y-2">
            {item.inputVariables.map((f, idx) => {
              return (
                <InputText
                  ref={idx === 0 ? mainInput : undefined}
                  autoFocus={idx === 0}
                  name={f.name}
                  title={f.title}
                  required={f.isRequired}
                  value={variables[f.name]}
                  setValue={(e) => setVariables({ ...variables, [f.name]: e.toString() ?? "" })}
                />
              );
            })}
            <div className="flex justify-end">
              <LoadingButton type="submit">Run</LoadingButton>
            </div>
          </div>
        </Form>
      ) : (
        <div className="space-y-2">
          {result.executionResult.results.map((f) => {
            return (
              <div key={f.id} className="flex flex-col rounded-md border border-gray-200 bg-white p-2 shadow-sm">
                <div className="text-sm font-medium text-gray-800">{f.template?.title}</div>
                <div className="text-sm text-gray-700">{f.response}</div>
              </div>
            );
          })}
          <div className="flex justify-between space-x-2">
            <div></div>
            <div className="flex justify-between space-x-2">
              <ButtonSecondary
                onClick={() => {
                  setResult(null);
                }}
              >
                Run Again
              </ButtonSecondary>
              {result.outputResult.createdRows.length === 1 && (
                <ButtonPrimary to={result.outputResult.createdRows[0].href}>View {t(result.outputResult.createdRows[0].entity.title)}</ButtonPrimary>
              )}
              {result.outputResult.updatedRows.length > 1 && (
                <ButtonPrimary to={result.outputResult.updatedRows[0].href}>View {t(result.outputResult.updatedRows[0].entity.title)}</ButtonPrimary>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
