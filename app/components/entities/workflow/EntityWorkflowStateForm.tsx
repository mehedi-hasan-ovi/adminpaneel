import { EntityWorkflowState } from "@prisma/client";
import { useEffect, useState } from "react";
import { Colors } from "~/application/enums/shared/Colors";
import FormGroup from "~/components/ui/forms/FormGroup";
import InputCheckboxWithDescription from "~/components/ui/input/InputCheckboxWithDescription";
import InputColorSelector from "~/components/ui/input/InputColorSelector";
import InputText from "~/components/ui/input/InputText";
import StringUtils from "~/utils/shared/StringUtils";

interface Props {
  item?: EntityWorkflowState;
}

export default function EntityWorkflowStateForm({ item }: Props) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [color, setColor] = useState<string | number | undefined>(item?.color ?? Colors.GRAY);
  const [canUpdate, setCanUpdate] = useState<boolean>(item?.canUpdate ?? true);
  const [canDelete, setCanDelete] = useState<boolean>(item?.canDelete ?? false);

  useEffect(() => {
    if (!item) {
      setName(StringUtils.toCamelCase(title.toLowerCase()));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  return (
    <FormGroup id={item?.id} editing={true}>
      <h3 className="text-sm font-bold">{item ? "Edit Workflow State" : "New Workflow State"}</h3>
      <div className="grid grid-cols-12 gap-2">
        <InputText className="col-span-6" name="title" title="Title" value={title} setValue={setTitle} required autoComplete="off" />
        <InputText className="col-span-6" name="name" title="Name" value={name} setValue={setName} required lowercase autoComplete="off" />
        <InputColorSelector className="col-span-12" name="color" title="Color" value={color} setValue={setColor} required />
        <InputCheckboxWithDescription
          className="col-span-12"
          name="can-update"
          title="Can update"
          description="Can update properties on this state"
          value={canUpdate}
          setValue={setCanUpdate}
        />
        <InputCheckboxWithDescription
          className="col-span-12"
          name="can-delete"
          title="Can delete"
          description="Can delete row on this state"
          value={canDelete}
          setValue={setCanDelete}
        />
        <InputText
          className="col-span-12"
          name="email-subject"
          title="Email subject"
          value={item?.emailSubject}
          autoComplete="off"
          disabled
          placeholder="Under construction..."
        />
        <InputText
          className="col-span-12"
          name="email-body"
          title="Email body"
          value={item?.emailBody}
          autoComplete="off"
          disabled
          placeholder="Under construction..."
        />
      </div>
    </FormGroup>
  );
}
