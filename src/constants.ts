import NumberRender from "@/renderer/NumberRender";
import TextAreaRender from "@/renderer/TextAreaRender";
import DropdownRender from "@/renderer/DropdownRender";
import TextRender from "@/renderer/TextRender";
import CheckboxRender from "@/renderer/CheckboxRender";
import RadioRender from "@/renderer/RadioRender";
import PasswordRender from "@/renderer/PasswordRender";
import FileRender from "@/renderer/FileRender";
import CustomRender from "./renderer/CustomRender";
import GroupRender from "./renderer/GroupRender";
import HiddenRender from "./renderer/HiddenRender";
import ButtonRender from "./renderer/ButtonRender";
import RangeRender from "./renderer/RangeRender";
import DateRender from "./renderer/DateRender";
import TabRender from "./renderer/TabRender";
import GridRender from "./renderer/GridRender";

export type FORM_MODE = "new" | "modify" | "view";

export const RULES = {
  NAN: "nan",
  MIN: "minimum",
  EXCLUSIVE_MIN: "exclusiveMinimum",
  MAX: "maximum",
  EXCLUSIVE_MAX: "exclusiveMaximum",
  MIN_LENGTH: "minLength",
  MAX_LENGTH: "maxLength",
  BETWEEN: "between",
  BETWEEN_EXCLUSIVE_MIN: "betweenExclusiveMin",
  BETWEEN_EXCLUSIVE_MAX: "betweenExclusiveMax",
  BETWEEN_EXCLUSIVE_MINMAX: "betweenExclusiveMinMax",
  REGEXP: "regexp",
  REQUIRED: "required",
  VALIDATOR: "validator",
} as const;

export const FIELD_PREFIX = "dff"; // daracl form field

export const RENDER_TEMPLATE: any = {
  number: NumberRender,
  textarea: TextAreaRender,
  dropdown: DropdownRender,
  checkbox: CheckboxRender,
  radio: RadioRender,
  text: TextRender,
  password: PasswordRender,
  file: FileRender,
  custom: CustomRender,
  group: GroupRender,
  hidden: HiddenRender,
  button: ButtonRender,
  range: RangeRender,
  datehour: DateRender,
  datemonth: DateRender,
  date: DateRender,
  datetime: DateRender,
  tab: TabRender,
  grid: GridRender,
};

export const ALIGN = {
  left: "left",
  center: "center",
  right: "right",
} as const;

export type TEXT_ALIGN_TYPE = (typeof ALIGN)[keyof typeof ALIGN];

export type RENDER_TYPE = "number" | "text" | "file" | "textarea" | "dropdown" | "radio" | "checkbox" | "date" | "datetime" | "dateyear" | "datemonth" | "datehour" | "group" | "custom";

export type REGEXP_TYPE = "email" | "url" | "alpha" | "alpha-num";

export type PASSWORD_TYPE = "number" | "upper" | "upper-special" | "upper-special-number"; // 숫자 | 대문자 포함, 대문자 특수문자 포함, 대문자 특수문자 숫자

export type FIELD_POSITION = "top" | "left" | "left-left" | "left-right" | "right" | "right-left" | "right-right" | "bottom";

export const OrientationMap = {
  horizontal: "horizontal",
  vertical: "vertical",
} as const;

export type OrientationType = (typeof OrientationMap)[keyof typeof OrientationMap];

interface StringArrayMap {
  [key: string]: string[];
}

export const FIELD_POSITION_STYLE: StringArrayMap = {
  "top-left": ["top", "df-txt-left"],
  "top-center": ["top", "df-txt-center"],
  "top-right": ["top", "df-txt-right"],
  "left-left": ["", "df-txt-left"],
  "left-center": ["", "df-txt-center"],
  "left-right": ["", "df-txt-right"],
  "right-right": ["right", "df-txt-right"],
  "right-center": ["right", "df-txt-center"],
  "right-left": ["right", "df-txt-left"],
  "bottom-left": ["bottom", "df-txt-left"],
  "bottom-center": ["bottom", "df-txt-center"],
  "bottom-right": ["bottom", "df-txt-right"],
};
FIELD_POSITION_STYLE["top"] = FIELD_POSITION_STYLE["top-left"];
FIELD_POSITION_STYLE["right"] = FIELD_POSITION_STYLE["right-right"];
FIELD_POSITION_STYLE["left"] = FIELD_POSITION_STYLE["left-left"];
FIELD_POSITION_STYLE["bottom"] = FIELD_POSITION_STYLE["bottom-left"];
