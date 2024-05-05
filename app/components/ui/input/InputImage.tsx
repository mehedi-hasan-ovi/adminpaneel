import { forwardRef, Ref, RefObject, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import InputText, { InputTextProps } from "./InputText";
import ButtonTertiary from "../buttons/ButtonTertiary";
import UploadDocument from "../uploaders/UploadDocument";
import clsx from "clsx";

export interface RefInputImage {
  input: RefObject<HTMLInputElement> | RefObject<HTMLTextAreaElement>;
}

type Props = InputTextProps & {
  darkMode?: boolean;
};
const InputImage = (props: Props, ref: Ref<RefInputImage>) => {
  const { t } = useTranslation();
  const [showUploadImage, setShowUploadImage] = useState(false);
  const [image, setImage] = useState(props.value ?? "");

  useEffect(() => {
    if (props.setValue && props.value !== image) {
      setImage(props.value ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value]);

  useEffect(() => {
    if (props.setValue && props.value !== image) {
      props.setValue(image);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  return (
    <div className="space-y-3">
      <InputText
        {...props}
        readOnly={image.startsWith("data:image")}
        button={
          <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5 ">
            <kbd className="inline-flex items-center rounded border border-gray-200 bg-white px-2 font-sans text-sm font-medium text-gray-500">
              <button type="button" onClick={() => setShowUploadImage(true)}>
                {t("shared.change")}
              </button>
            </kbd>
          </div>
        }
      />

      {showUploadImage && (
        <UploadDocument
          disabled={props.disabled}
          className="col-span-12 h-32"
          accept="image/png, image/jpg, image/jpeg"
          description={t("models.post.image")}
          onDropped={(e) => {
            setImage(e);
            setShowUploadImage(false);
          }}
        />
      )}

      {!showUploadImage && image && (
        <div className="col-span-12">
          <div className={clsx(props.darkMode ? "bg-gray-800" : "bg-white", "overflow-hidden rounded-lg p-4 shadow-xl xl:border-b xl:border-gray-200")}>
            <img className="mx-auto h-32 object-contain" src={image} alt={t("models.post.image")} />
          </div>
          <ButtonTertiary
            disabled={props.disabled}
            onClick={() => {
              setImage("");
            }}
          >
            {t("shared.delete")}
          </ButtonTertiary>
        </div>
      )}
    </div>
  );
};
export default forwardRef(InputImage);
