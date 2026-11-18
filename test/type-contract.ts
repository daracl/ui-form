import type { FileFormValue, FormField, FormOptions } from "../src/index";
import type { DaraForm } from "../src/DaraForm";

const fields: FormField[] = [
  { name: "title", label: "제목", rule: { maxLength: 100 } },
  { name: "detail", label: "내용", conditional: { custom: () => true } },
  { name: "files", label: "파일", renderType: "file", rule: { maxFileSize: 1024, maxFiles: 2, accept: [".png"] }, buttonLabel: "첨부" },
];

const options: FormOptions = { fields };

function useForm(form: DaraForm) {
  const values: Record<string, unknown> = form.getValue();
  const validated: Promise<Record<string, unknown>> = form.getValue(true);
  const data: FormData = form.getFormDataValue();
  const validatedData: Promise<FormData> = form.getFormDataValue(true);
  const fileValues: FileFormValue<"files"> = { files: [], filesRemoveIds: [7] };
  return { values, validated, data, validatedData, fileValues, options };
}

void useForm;
