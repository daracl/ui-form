import { FormField } from "@t/FormField";
import { ValidResult } from "@t/ValidResult";
import Language from "./Language";

export const invalidMessage = (field: FormField, rowElement: Element, validResult: ValidResult | boolean) => {
  if (validResult === true) {
    rowElement.classList.remove("invalid");

    if (!rowElement.classList.contains("valid")) {
      rowElement.classList.add("valid");
    }

    const helpMessageElement = rowElement.querySelector(".df-help-message");
    if (helpMessageElement) {
      helpMessageElement.innerHTML = "";
    }

    return;
  }

  rowElement.classList.remove("valid");

  if (!rowElement.classList.contains("invalid")) {
    rowElement.classList.add("invalid");
  }

  if (validResult !== false) {
    const message: string[] = Language.validMessage(field, validResult);

    if (validResult.message) {
      message.push(validResult.message);
    }

    const helpMessageElement = rowElement.querySelector(".df-help-message");
    if (helpMessageElement && message.length > 0) {
      const msgHtml: string[] = [];
      message.forEach((item) => {
        msgHtml.push(`<div>${item}</div>`);
      });
      helpMessageElement.innerHTML = msgHtml.join("");
    }
  }
};

/**
 * remove row element style class
 *
 * @param {Element} rowElement
 */
export const resetRowElementStyleClass = (rowElement: Element) => {
  rowElement.classList.remove("invalid");
  rowElement.classList.remove("valid");
};
