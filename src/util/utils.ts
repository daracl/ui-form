import type { FormField } from "@t/FormField";
import { isBlank, isNumeric, isPlainObject, isUndefined, objectDeepMerge, xss as replaceXss, unXss as unReplace } from "@daracl/core/utils";
export { isArray, isBlank, isFunction, isString, isUndefined, isPlainObject, isNil as isEmpty, hasProperty as hasOwnProp, getHashCode, templateToElement } from "@daracl/core/utils";
export { replaceXss, unReplace };

export const unFieldName = (fieldName: string): string => {
  if (fieldName) {
    return unReplace(fieldName).replaceAll('"', '\\"');
  }
  return "";
};
// Preserve form numeric coercion (including numeric strings) for existing callers.
export const isNumber = (value: any): value is number => {
  return !isBlank(value) && isNumeric(+value, true);
};

/**
 * tab render type check
 *
 * @param {FormField} field
 * @returns {boolean} tab type 인지 여부
 */
export const isTabType = (field: FormField): boolean => {
  return field?.renderType === "tab";
};
/**
 * grid render type check
 *
 * @param {FormField} field
 * @returns {boolean} grid type 인지 여부
 */
export const isGridType = (field: FormField): boolean => {
  return field?.renderType === "grid";
};
export const replaceXssField = (field: FormField): FormField => {
  field.$xssName = getXssFieldName(field);

  field.label = replaceXss(field.label);
  return field;
};

/**
 * 값을 무시하는 필드
 *
 * @param field formField
 * @returns
 */
export const ignoreValueField = (field: FormField): boolean => {
  return isGridType(field.$parent) || isTabType(field.$parent);
};

/**
 * grid field name xss repalce
 *
 * @param {FormField} field
 * @returns {string} replace 된 field name
 */
export const getXssFieldName = (field: FormField): string => {
  if (isUndefined(field.$xssName)) {
    let returnText = field.name;
    if (returnText) {
      returnText = returnText.replace(/[&<>"']/g, "_");
    }

    return "df_" + returnText;
  }

  return field.$xssName;
};

export const isHiddenField = (field: FormField | null | undefined): boolean => field?.renderType === "hidden";

/** Merge form options using the shared core implementation.
 * Keep the legacy non-object first argument behavior.
 */
export const merge = (...values: any[]): any => {
  if (!isPlainObject(values[0])) return values[0];
  // An extra source prevents a form's _excludeKeys field becoming core options.
  return objectDeepMerge(...values, {});
};
