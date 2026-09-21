import { DaraForm } from "@/DaraForm";
import { RENDER_TYPE, REGEXP_TYPE, TEXT_ALIGN_TYPE, FIELD_POSITION, OrientationType } from "@/constants";
import { Render } from "@/renderer/Render";

export interface OptionCallback {
  (...params: any[]): any;
}

export interface ValuesInfo {
  labelField: string;
  valueField: string;
  list: any[];
  orientation: OrientationType;
}

/**
 * 첨부 파일 정보
 *
 * @export
 * @interface FileInfo
 * @typedef {FileInfo}
 */
export interface FileInfo {
  fileId: string;
  fileName: string;
  fileSize: number;
  $seq: number;
  lastModified?: any;
}

/**
 * 상태 체크 정보
 *
 * @export
 * @interface ConditionInfo
 * @typedef {ConditionInfo}
 */
export interface ConditionInfo {
  show: boolean;
  field: string;
  eq: any;
  custom?: OptionCallback;
}

export interface FieldStyle {
  rowStyleClass?: string;
  fieldClass?: string;
  fieldStyle?: string;
  labelClass?: string;
  labelStyle?: string;
  labelAlignClass?: string;
  valueClass?: string;
  valueStyle?: string;
  tabAlignClass?: string;
}

/**
 * form field
 *
 * @export
 * @interface FormField
 * @typedef {FormField}
 */
export interface FormField {
  name: string; // 'name'
  displayMode?: "edit" | "view"; // 'edit'
  renderType?: RENDER_TYPE | string;
  label: string; // '이름'
  position?: FIELD_POSITION; // 'top'
  style: {
    width: string | number;
    labelHide: boolean;
    labelWidth: string | number;
    customClass: string;
    valueWidth: string | number;
    position: string;
    tabAlign: string;
  };
  tooltip: string; // 툴팁 문구
  disabled?: boolean; // disabled
  description: string; // 설명
  descriptionClass?: string;
  descriptionStyle?: string;
  placeholder: string; // input , textarea 문구
  orientation: OrientationType; // children에 사용
  required?: boolean; //true // 필수 여부
  regexpType?: REGEXP_TYPE; // 정규식 타입
  rule: {
    // 규칙
    minLength: number; // 3
    maxLength: number; //100
    minimum: number;
    exclusiveMinimum: boolean;
    maximum: number;
    exclusiveMaximum: boolean;
  };
  different: {
    // field 값이 다른지 비교
    field: string;
    message: string;
  };
  identical: {
    // field 값이 같은지 비교
    field: string;
    message: string;
  };
  template: OptionCallback | string; // 필드 템플릿
  defaultValue: string; // 기본값
  listItem: ValuesInfo; // dropdown, radio, checkbox
  children: FormField[]; // child field
  validator?: OptionCallback; // custom validator
  onChange: OptionCallback; //  입력값 변경시 체크 function
  onClick: OptionCallback; // button onclick function
  fileDownload: OptionCallback; // file download function
  renderer: Render; // custom renderer
  conditional: ConditionInfo; // 보이기 여부
  rendererOptions: any | GridOptions; // custom options 옵션
  $renderType: Render; // render Type
  $instance: Render; // 실제 render
  $orgin: FormField;
  $xssName: string; // xss 변경명
  $key: string; // 내부 key
  $value: string; // 내부 사용 value
  $parent: FormField;
  $tabForm?: DaraForm; //tab 일경우 폼 정보
  $validName: string; //
}

export interface GridOptions {
  disableAddButton?: boolean; // renderer 그리드 타입 추가 버튼 유무
  disableRemoveButton?: boolean; // renderer 그리드 타입 추가 버튼 유무
  align?: TEXT_ALIGN_TYPE; // renderer 그리드 타입 추가 버튼 유무
  height: string; // grid 높이값
}
