import { FIELD_POSITION_STYLE } from "@/constants";
import { FieldStyle, FormField } from "@t/FormField";
import { FormOptions } from "@t/FormOptions";
import { isNumber } from "./utils";
import { resolveClassName } from "@daracl/core/utils";

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
    if (isNumber(width)) {
      fieldStyle.fieldClass += isNumber(width) ? ` df-col-xs-${width}` : "";
    } else {
      fieldStyle.fieldStyle = isNumber(width) ? "" : `width:${width};`;
    }
  }

  fieldStyle.tabAlignClass = "df-tab-al-" + (["right", "center"].includes(field.style?.tabAlign) ? field.style.tabAlign : "left");

  const labelWidth = field.style?.labelWidth || defaultLabelWidth;
  fieldStyle.labelAlignClass = positionArr[1];

  if (!isLabelHide && labelWidth && !["top", "bottom"].includes(positionArr[0])) {
    if (isNumber(labelWidth)) {
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
      if (isNumber(valueWidth)) {
        fieldStyle.valueClass = fieldStyle.labelStyle ? "df-col-full" : `df-col-xs-${valueWidth}`;
      } else {
        fieldStyle.valueStyle = `width:${valueWidth};`;
      }
    } else {
      fieldStyle.valueClass = fieldStyle.labelStyle ? "df-col-full" : "";
    }
  }

  fieldStyle.fieldClass = resolveClassName(fieldStyle.fieldClass).join(" ");
  fieldStyle.labelClass = resolveClassName(fieldStyle.labelClass).join(" ");
  fieldStyle.valueClass = resolveClassName(fieldStyle.valueClass).join(" ");

  return fieldStyle;
}

export function orientationClassName(orientation: string): string {
  return orientation === "horizontal" ? "df-horizontal" : "df-vertical";
}
