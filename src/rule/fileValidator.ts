import { FileInfo, FormField } from "@t/FormField";
import { ValidResult } from "@t/ValidResult";
import { RULES } from "@/constants";

/**
 * file validator
 *
 * @param {HTMLInputElement} element
 * @param {FormField} field
 * @param {FileInfo[]} fileList
 * @returns {(ValidResult | boolean)}
 */
export const fileValidator = (element: HTMLInputElement, field: FormField, fileList: FileInfo[], newFiles: File[] = []): ValidResult | boolean => {
  const result: ValidResult = { name: field.name, constraint: [] };

  if (field.required && fileList.length < 1) {
    result.constraint.push(RULES.REQUIRED);
    return result;
  }

  if (field.rule?.maxFiles !== undefined && newFiles.length > field.rule.maxFiles) result.constraint.push(RULES.MAX_FILES);
  if (field.rule?.maxFileSize !== undefined && newFiles.some((file) => file.size > field.rule!.maxFileSize!)) result.constraint.push(RULES.MAX_FILE_SIZE);
  if (field.rule?.accept?.length && newFiles.some((file) => !field.rule!.accept!.some((ext) => file.name.toLowerCase().endsWith(ext.toLowerCase().startsWith(".") ? ext.toLowerCase() : `.${ext.toLowerCase()}`)))) result.constraint.push(RULES.FILE_ACCEPT);

  if (result.constraint.length > 0) {
    return result;
  }

  return true;
};
