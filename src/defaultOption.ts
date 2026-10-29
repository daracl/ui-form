import { FormOptions } from "./types/FormOptions";
import type { FormField } from "./types/FormField";
import { merge } from "./util/utils";

export function initFormOptions(options: FormOptions): FormOptions {
  const opts = merge({}, DEFAULT_OPTIONS, options) as FormOptions;
  opts.fields = normalizeFields(opts.fields);

  return opts;
}

/**
 * 전역으로 옵션 설정.
 *
 * @param options 옵션
 */
export function setDefaultOptions(options: Partial<FormOptions>): void {
  DEFAULT_OPTIONS = merge({}, DEFAULT_OPTIONS, options);
  DEFAULT_OPTIONS.fields = normalizeFields(DEFAULT_OPTIONS.fields);
}

/** Core merge materializes sparse array holes; empty field slots are not renderers. */
export function normalizeFields(fields: readonly (FormField | null | undefined)[] | null | undefined): FormField[] {
  return (fields ?? []).filter((field): field is FormField => field != null).map((field) => {
    if (Array.isArray(field.children)) field.children = normalizeFields(field.children);
    return field;
  });
}

let DEFAULT_OPTIONS = {
  style: {
    width: "100%",
    labelWidth: 3,
    valueWidth: 9,
    position: "left-right",
  },
  mode: "new",
  useTypeValue: true,
  autoCreate: true,
  notValidMessage: "This form is not valid.",
  fields: [],
} as FormOptions;
