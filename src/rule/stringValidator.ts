import { FormField } from "@t/FormField";
import { ValidResult } from "@t/ValidResult";
import { RULES } from "@/constants";
import * as utils from "@/util/utils";
import { validator } from "./validator";

/**
 * string validator
 *
 * @param {string} value
 * @param {FormField} field
 * @returns {(ValidResult | boolean)}
 */
export const stringValidator = (value: string, field: FormField): ValidResult | boolean => {
  if (!field.$instance.isEnableView()) {
    return true;
  }

  let result: ValidResult = { name: field.name, constraint: [] };

  if (field.required && utils.isBlank(value)) {
    result.constraint.push(RULES.REQUIRED);
    return result;
  }
  const validResult = validator(value, field, result);
  if (validResult !== true) {
    return validResult;
  }

  const rule = field.rule;

  if (rule) {
    const valueLength = value.length;

    const isMinNumber = utils.isNumber(rule.minLength),
      isMaxNumber = utils.isNumber(rule.maxLength);

    let minRule = false,
      maxRule = false;
    if (isMinNumber && valueLength < rule.minLength!) {
      minRule = true;
    }
    if (isMaxNumber && valueLength > rule.maxLength!) {
      maxRule = true;
    }

    if (isMinNumber && isMaxNumber && (minRule || maxRule)) {
      result.constraint.push(RULES.BETWEEN);
    } else {
      if (minRule) {
        result.constraint.push(RULES.MIN_LENGTH);
      }

      if (maxRule) {
        result.constraint.push(RULES.MAX_LENGTH);
      }
    }
    if (result.constraint.length > 0) {
      return result;
    }
  }

  return true;
};
