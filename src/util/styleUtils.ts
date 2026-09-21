import { FieldStyle, FormField } from "@t/FormField";
import * as utils from "./utils";
import { FIELD_POSITION_STYLE, ALIGN } from "@/constants";
import { FormOptions } from "@t/FormOptions";

/**
 * field style 처리
 *
 * @param formOptions FormOptions
 * @param field FormField
 * @param beforeField FormField
 * @returns FieldStyle
 */

export function resolveFieldStyle(formOptions: FormOptions, field: FormField, beforeField?: FormField | null, isLabelHide?: boolean): FieldStyle {
  const fieldStyle = {
    rowStyleClass: orientationClassName(field.orientation),
    fieldClass: "",
    fieldStyle: "",
    labelClass: "",
    labelStyle: "",
    labelAlignClass: "",
    valueClass: "",
    valueStyle: "",
    tabAlignClass: "",
  };

  const defaultLabelWidth = beforeField?.style?.labelWidth ?? formOptions.style.labelWidth ?? "3";
  let defaultValueWidth = beforeField?.style?.valueWidth ?? formOptions.style.valueWidth ?? "9";
  const position = beforeField?.style?.position ?? formOptions.style.position;

  const width = field.style?.width;
  const positionArr = FIELD_POSITION_STYLE[field.style?.position] ?? FIELD_POSITION_STYLE[position] ?? FIELD_POSITION_STYLE.top;

  fieldStyle.fieldClass = `${positionArr[0] ? "df-" + positionArr[0] : ""} ${field.style?.customClass || ""}`;
  if (width) {
    if (utils.isNumber(width)) {
      fieldStyle.fieldClass += utils.isNumber(width) ? ` df-col-xs-${width}` : "";
    } else {
      fieldStyle.fieldStyle = utils.isNumber(width) ? "" : `width:${width};`;
    }
  }

  fieldStyle.tabAlignClass = "df-tab-al-" + (["right", "center"].includes(field.style?.tabAlign) ? field.style.tabAlign : "left");

  const labelWidth = field.style?.labelWidth || defaultLabelWidth;
  fieldStyle.labelAlignClass = positionArr[1];

  if (!isLabelHide && labelWidth && !["top", "bottom"].includes(positionArr[0])) {
    if (utils.isNumber(labelWidth)) {
      const labelWidthValue = +labelWidth;
      defaultValueWidth = 12 - labelWidthValue;
      fieldStyle.labelClass = `df-col-xs-${labelWidthValue}`;
      fieldStyle.valueClass = fieldStyle.labelStyle ? "df-col-full" : `df-col-xs-${defaultValueWidth}`;
    } else {
      fieldStyle.labelStyle = `width:${labelWidth};`;
    }
  }

  const valueWidth = field.style?.valueWidth || defaultValueWidth;
  if (isLabelHide && !["left", "right"].includes(positionArr[0])) {
    fieldStyle.valueClass = "df-col-full";
  } else {
    if (valueWidth && !["top", "bottom"].includes(positionArr[0])) {
      if (utils.isNumber(valueWidth)) {
        fieldStyle.valueClass = fieldStyle.labelStyle ? "df-col-full" : `df-col-xs-${valueWidth}`;
      } else {
        fieldStyle.valueStyle = `width:${valueWidth};`;
      }
    } else {
      fieldStyle.valueClass = fieldStyle.labelStyle ? "df-col-full" : "";
    }
  }

  fieldStyle.fieldClass = spaceReplace(fieldStyle.fieldClass);
  fieldStyle.labelClass = spaceReplace(fieldStyle.labelClass);
  fieldStyle.valueClass = spaceReplace(fieldStyle.valueClass);

  return fieldStyle;
}

export function orientationClassName(orientation: string): string {
  return orientation === "horizontal" ? "df-horizontal" : "df-vertical";
}

function spaceReplace(str: string): string {
  return str.replace(/\s+/g, " ").trim();
}
