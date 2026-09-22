import { FormOptions } from "@t/FormOptions";
import { FormField } from "@t/FormField";
import * as utils from "./util/utils";
import { ValidResult } from "@t/ValidResult";
import { Message } from "@t/Message";
import Language from "./util/Language";
import { stringValidator } from "./rule/stringValidator";
import { numberValidator } from "./rule/numberValidator";
import { regexpValidator } from "./rule/regexpValidator";
import FieldInfoMap from "@/FieldInfoMap";
import FormTemplate from "./FormTemplate";
import { FORM_MODE } from "./constants";
import { initFormOptions, setDefaultOptions } from "./defaultOption";

declare const APP_VERSION: string;

interface FieldMap {
  [key: string]: FormField;
}

interface DaraFormMap {
  [key: string]: DaraForm;
}

export interface FormChangeEvent {
  form: DaraForm;
}

export interface FormChangeListener {
  (event: FormChangeEvent): void;
}

export interface Unsubscribe {
  (): void;
}

// all instance
const allInstance: DaraFormMap = {};

const SEQ_ATTR_KEY = "data-form-uid";

let DARA_FORM_SEQ = 0;
/**
 * DaraForm class
 *
 * @class DaraForm
 * @typedef {DaraForm}
 */
export class DaraForm {
  public static VERSION = `${APP_VERSION}`;

  private readonly options;

  private orginFormStyleClass;

  private selector: string;
  private formElement: Element;

  private fieldInfoMap: FieldInfoMap;

  private formValue: any = {};

  public formTemplate: FormTemplate;

  private changeListeners: FormChangeListener[] = [];

  constructor(formElement: Element, options: FormOptions, message?: Message) {
    this.options = initFormOptions(options);

    Language.set(message);

    if (formElement) {
      this.orginFormStyleClass = formElement.className;
      formElement.classList.add("daracl-form");

      this.selector = `df_${++DARA_FORM_SEQ}`;
      formElement.setAttribute("name", this.selector);
      formElement.setAttribute(SEQ_ATTR_KEY, this.selector);

      if (this.options.style.width) {
        formElement.setAttribute("style", `width:${this.options.style.width};`);
      }

      this.formElement = formElement;
      this.changeMode(this.options.mode ?? "new");
      this.createForm(this.options.fields);

      if (this.options.autoCreate !== false) {
        allInstance[this.selector] = this;
      }
    } else {
      throw new Error(`${formElement} form selector not found`);
    }
  }

  public static create(formElement: Element, options: FormOptions, message?: Message): DaraForm {
    return new DaraForm(formElement, options, message);
  }

  public static setMessage(message: Message): void {
    Language.set(message);
  }

  public static setDefaultOptions(options: FormOptions, message?: Message): void {
    setDefaultOptions(options);

    if (message) {
      Language.set(message);
    }
  }

  private createForm(fields: FormField[]) {
    this.fieldInfoMap = new FieldInfoMap(this.selector, this);
    //this.formElement.innerHTML = "";
    this.formTemplate = new FormTemplate(this, this.formElement, this.fieldInfoMap);

    if (this.options.autoCreate === false) {
      return;
    }

    fields.forEach((field) => {
      this.formTemplate.addRow(field);
    });
    this.conditionCheck();

    if (this.options.onMounted) {
      this.options.onMounted.call(this);
    }
  }

  /**
   * change mode
   *
   * @param mode form_mode default new
   */
  public changeMode = (mode: FORM_MODE): void => {
    this.options.mode = mode;
    this.formElement.setAttribute("data-df-mode", mode);

    const fields = this.formElement.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(".df-field input, " + ".df-field textarea, " + ".df-field select");

    if (mode == "view") {
      fields.forEach((field) => {
        if (field instanceof HTMLInputElement) {
          field.readOnly = true;
        }

        if (field instanceof HTMLTextAreaElement) {
          field.readOnly = true;
        }
      });
    } else {
      fields.forEach((field) => {
        if (field instanceof HTMLInputElement) {
          field.readOnly = false;
        }

        if (field instanceof HTMLTextAreaElement) {
          field.readOnly = false;
        }
      });
    }
  };

  /**
   * 폼 데이터 reset
   */
  public resetForm = () => {
    const fieldMap = this.fieldInfoMap.getAllFieldInfo();
    for (const seq in fieldMap) {
      const fieldInfo = fieldMap[seq];
      const renderInfo = fieldInfo.$instance;

      if (renderInfo && typeof renderInfo.reset === "function") {
        renderInfo.reset();
      }
    }
    this.formValue = {};
    this.conditionCheck();
  };

  /**
   * field 값 reset
   * @param fieldName 필드명
   */
  public resetField = (fieldName: string) => {
    this.fieldInfoMap.getFieldName(fieldName).$instance.reset();
    this.formValue[fieldName] = "";
    this.conditionCheck();
  };

  /**
   * 필드 element 얻기
   *
   * @param {string} fieldName
   * @returns {*}
   */
  public getFieldElement(fieldName: string) {
    const field = this.fieldInfoMap.getFieldName(fieldName);

    if (field?.$instance) {
      return field.$instance.getElement();
    }

    return null;
  }

  public getField(fieldName: string): FormField {
    return this.fieldInfoMap.getFieldName(fieldName);
  }

  /**
   * field 값 얻기
   *
   * @param fieldName  필드명
   * @returns
   */
  public getFieldValue = (fieldName: string) => {
    const field = this.fieldInfoMap.getFieldName(fieldName);

    if (field) {
      return field.$instance.getValue();
    }
    return null;
  };

  /**
   * 폼 필드 값 얻기
   * @param isValid 폼 유효성 검사 여부 default:false|undefined true일경우 검사.
   * @returns
   */
  public getValue = (isValid: boolean): any => {
    return this.fieldInfoMap.getAllFieldValue(this.formValue, isValid);
  };

  public getFormDataValue = (isValid: boolean): any => {
    return this.fieldInfoMap.getFormDataValue(this.formValue, isValid);
  };

  /**
   * 폼 필드 value 셋팅
   * @param values
   */
  public setValue = (values: any, dataClear?: boolean | undefined) => {
    if (dataClear !== false) {
      this.resetForm();
    }

    Object.keys(values).forEach((fieldName) => {
      this._setFieldValue(fieldName, values[fieldName]);
    });
    this.conditionCheck();
  };

  public setFieldValue = (fieldName: string, value: any) => {
    this._setFieldValue(fieldName, value);
    this.conditionCheck();
  };

  private _setFieldValue(fieldName: string, value: any) {
    this.formValue[fieldName] = value;
    const fieldInfo = this.fieldInfoMap.getFieldName(fieldName);

    if (fieldInfo) {
      fieldInfo.$instance.setValue(value);
    }
  }

  public setFieldItems = (fieldName: string, values: any) => {
    const field = this.fieldInfoMap.getFieldName(fieldName);

    if (field) {
      return field.$instance.setValueItems(values);
    }
  };

  /**
   * field 추가
   *
   * @param {FormField} field
   */
  public addField = (field: FormField) => {
    this.options.fields.push(field);
    this.formTemplate.addRow(field);
    this.conditionCheck();
  };

  /**
   * field 제거
   *
   * @param {string} fieldName
   */
  public removeField = (fieldName: string) => {
    const fieldInfo = this.fieldInfoMap.getFieldName(fieldName);

    if (!fieldInfo) return;

    const removeFields = this.getRemoveFields(fieldInfo);

    removeFields.forEach((removeField) => {
      this.removeFormValue(removeField);
    });

    this.removeFieldElement(fieldInfo);
    this.removeParentChildField(fieldInfo);

    removeFields.forEach((removeField) => {
      this.fieldInfoMap.removeFieldInfoByKey(removeField.$key);
    });

    this.conditionCheck();
  };

  /**
   * 제거할 필드와 같은 fieldInfoMap에 등록된 하위 필드(group 하위 필드, tab 패널) 목록
   * grid 컬럼, tab 패널 내부 필드는 별도 form에 등록되므로 제외됨.
   *
   * @param {FormField} fieldInfo
   * @param {FormField[]} result
   * @returns {FormField[]}
   */
  private getRemoveFields(fieldInfo: FormField, result: FormField[] = []): FormField[] {
    result.push(fieldInfo);

    fieldInfo.children?.forEach((childField) => {
      if (childField && this.fieldInfoMap.get(childField.$key) === childField) {
        this.getRemoveFields(childField, result);
      }
    });

    return result;
  }

  /**
   * field element 제거
   *
   * @param {FormField} fieldInfo
   */
  private removeFieldElement(fieldInfo: FormField) {
    const parentField = fieldInfo.$parent;

    // tab 패널은 tab header item, tab panel 로 구성됨.
    if (parentField && utils.isTabType(parentField)) {
      const tabElement = parentField.$instance.getElement() as Element;
      const tabItem = tabElement.querySelector(`[data-tab-id="${fieldInfo.$key}"]`);
      const activeFlag = tabItem?.classList.contains("active");

      tabItem?.remove();
      tabElement.querySelector(`[tab-panel-id="${fieldInfo.$key}"]`)?.remove();

      const firstTabItem = tabElement.querySelector(".df-tab-header .df-tab-item");
      if (activeFlag && firstTabItem) {
        parentField.$instance.setActive(firstTabItem.getAttribute("data-tab-id") ?? "");
      }
      return;
    }

    // 최상위 필드는 .df-row, group 하위 필드는 .df-form-group 에 id=$key 가 지정됨.
    const rowSelector = `[id="${fieldInfo.$key}"]`;
    let element = fieldInfo.$instance?.getElement();

    // checkbox, radio 는 getElement()가 NodeList를 반환함.
    if (element instanceof NodeList || element instanceof HTMLCollection) {
      element = element[0] ?? null;
    }

    const rowElement = (element instanceof Element ? element.closest(rowSelector) : null) ?? this.formElement.querySelector(rowSelector);
    const containerElement = rowElement?.parentElement;

    rowElement?.remove();

    // group 하위 필드를 모두 제거한 경우 빈 row 제거
    if (parentField && containerElement?.classList.contains("df-row") && containerElement.childElementCount < 1) {
      containerElement.remove();
    }
  }

  /**
   * 부모 children(최상위는 options.fields)에서 필드 제거
   * tab 은 children 기준으로 값/유효성 체크를 하므로 제거해야 함.
   *
   * @param {FormField} fieldInfo
   */
  private removeParentChildField(fieldInfo: FormField) {
    const fields: FormField[] | undefined = fieldInfo.$parent ? fieldInfo.$parent.children : this.options.fields;
    const idx = fields ? fields.indexOf(fieldInfo) : -1;

    if (idx > -1) {
      fields?.splice(idx, 1);
    }
  }

  /**
   * getValue() 시 formValue에 누적된 field 값 제거
   *
   * @param {FormField} fieldInfo
   */
  private removeFormValue(fieldInfo: FormField) {
    const keys = [fieldInfo.name, fieldInfo.$validName];

    if (fieldInfo.renderType === "file") {
      keys.push(fieldInfo.$validName + "RemoveIds");
    } else if (utils.isTabType(fieldInfo)) {
      keys.push(...Object.keys(fieldInfo.$instance.getValue() ?? {}));
    }

    // tab 패널 (useTypeValue false 일 경우 패널 내부 필드 값이 펼쳐져 저장됨)
    if (fieldInfo.$tabForm) {
      keys.push(...Object.keys(fieldInfo.$tabForm.getValue(false) ?? {}));
    }

    keys.forEach((key) => {
      if (!utils.isBlank(key)) delete this.formValue[key];
    });
  }

  /**
   * 폼 유효성 검증 여부
   *
   * @returns {boolean}
   */
  public isValidForm = (): boolean => {
    const result = this.validForm();

    return result.length < 1;
  };

  /**
   * 유효성 검증 폼 검증여부 리턴
   *
   * @returns {any[]}
   */
  public validForm = (): any[] => {
    let validResult = [] as any;
    let autoFocusFlag = this.options.autoFocus !== false;
    let firstFlag = true;

    const fieldMap = this.fieldInfoMap.getAllFieldInfo();
    for (const fieldKey in fieldMap) {
      const fieldInfo = fieldMap[fieldKey];

      let fieldValid = this.fieldInfoMap.getFieldValidation(fieldInfo, autoFocusFlag);

      if (fieldValid !== true) {
        autoFocusFlag = false;

        if (utils.isGridType(fieldInfo)) {
          validResult = validResult.concat(fieldValid);
        } else {
          if (firstFlag) {
            this.validTabCheck(fieldInfo);
            firstFlag = false;
          }
          validResult.push(fieldValid);
        }
      }
    }

    return validResult;
  };

  private validTabCheck(fieldInfo: FormField) {
    if (fieldInfo.$parent) {
      if (fieldInfo.$parent.renderType == "tab") {
        fieldInfo.$parent.$instance.setActive(fieldInfo.$key);
      }
      this.validTabCheck(fieldInfo.$parent);
    }
  }

  public isValidField = (fieldName: string): boolean => {
    const fieldInfo = this.fieldInfoMap.getFieldName(fieldName);

    if (utils.isUndefined(fieldInfo)) {
      throw new Error(`Field name [${fieldName}] not found`);
    }

    const renderInfo = fieldInfo.$instance;
    if (renderInfo) {
      return renderInfo.valid() === true;
    }

    return true;
  };

  /**
   * 설정 옵션 얻기
   */
  public getOptions = () => {
    return this.options;
  };

  public conditionCheck() {
    this.fieldInfoMap.conditionCheck();
    this.notifyChange();
  }

  /**
   * 폼 상태(값/보이기 여부 등) 변경을 감지하는 리스너 등록.
   *
   * value/setValue/resetForm/conditional 변경 체크
   *
   * @param listener 상태 변경시 호출되는 콜백
   * @returns 등록 해제 함수
   */
  public subscribe = (listener: FormChangeListener): Unsubscribe => {
    this.changeListeners.push(listener);

    return () => {
      this.changeListeners = this.changeListeners.filter((l) => l !== listener);
    };
  };

  private notifyChange() {
    if (this.changeListeners.length < 1) return;

    const event: FormChangeEvent = { form: this };
    this.changeListeners.forEach((listener) => listener(event));
  }

  public setFieldDisabled(fieldName: string, flag: boolean) {
    const fieldInfo = this.fieldInfoMap.getFieldName(fieldName);
    fieldInfo.$instance.setDisabled(flag);
  }

  /**
   * 설명 추가
   *
   * @public
   * @param {string} fieldName
   * @param {string} desc
   */
  public setFieldDescription(fieldName: string, desc: string) {
    const fieldInfo = this.fieldInfoMap.getFieldName(fieldName);
    fieldInfo.$instance.setDescription(desc);
  }

  public destroy = () => {
    this.formElement.className = this.orginFormStyleClass;
    this.formElement.replaceChildren();

    for (const key in this) {
      if (utils.hasOwnProp(this, key)) {
        delete this[key];
        delete allInstance[this.selector];
      }
    }
  };

  public static validator = {
    string: (value: string, field: FormField) => {
      return stringValidator(value, field);
    },
    number: (value: string, field: FormField) => {
      return numberValidator(value, field);
    },
    regexp: (value: string, field: FormField) => {
      let result: ValidResult = { name: field.name, constraint: [] };
      return regexpValidator(value, field, result);
    },
  };

  public static instance(ele: Element | String) {
    let element;
    if (utils.isString(ele)) {
      element = document.querySelector(ele);
    } else {
      element = ele;
    }
    element = element as Element;
    let selector = element.getAttribute(SEQ_ATTR_KEY);

    if (utils.isUndefined(selector) || utils.isBlank(selector)) {
      const keys = Object.keys(allInstance);
      if (keys.length > 1) {
        throw new Error(`selector empty : [${selector}]`);
      }
      selector = keys[0];

      return allInstance[selector];
    }
  }
  /**
   * 모든 field 얻기
   */
  public getFields = (): any[] => {
    return this.options.fields;
  };

  /**
   * field setting
   * @param fields
   */
  public setFields = (fields: any[]) => {
    this.options.fields = fields;
    this.createForm(fields);
  };

  public getFieldInfoMap() {
    return this.fieldInfoMap;
  }
}
