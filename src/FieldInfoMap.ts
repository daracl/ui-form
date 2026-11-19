import { FIELD_PREFIX, FILE_REMOVE_IDS_SUFFIX } from "@/constants";
import { FormField } from "./types/FormField";
import { ValidResult } from "./types/ValidResult";
import { getRenderer } from "./util/renderFactory";
import Language from "./util/Language";
import * as utils from "./util/utils";
import { DaraForm } from "./DaraForm";

interface NumberFieldMap {
  [key: string]: FormField;
}

interface StringNumberMap {
  [key: string]: string;
}

export default class FieldInfoMap {
  private fieldIdx = 0;

  private allFieldInfo: NumberFieldMap = {};

  private keyNameMap: StringNumberMap = {};

  private conditionFields = new Set<string>();
  private conditionDependencies = new Map<string, Set<string>>();
  private customConditionFields = new Set<string>();

  private fieldPrefix;

  private form;

  constructor(selector: string, form: DaraForm) {
    this.fieldPrefix = `${FIELD_PREFIX}_${utils.getHashCode(selector)}`;
    this.form = form;
  }

  /**
   * add Field 정보
   *
   * @public
   * @param {FormField} field 폼필드 정보
   */
  public addField(field: FormField) {
    utils.replaceXssField(field);
    this.fieldIdx += 1;
    field.$key = `${this.fieldPrefix}_${this.fieldIdx}`;
    field.$validName = field.name ?? field.label;
    this.keyNameMap[field.$validName] = field.$key;
    this.allFieldInfo[field.$key] = field;
    field.$renderType = getRenderer(field);

    if (field.conditional) {
      this.conditionFields.add(field.$key);
      if (field.conditional.custom) {
        this.customConditionFields.add(field.$key);
      } else if (field.conditional.field) {
        const dependencies = this.conditionDependencies.get(field.conditional.field) ?? new Set<string>();
        dependencies.add(field.$key);
        this.conditionDependencies.set(field.conditional.field, dependencies);
      }
    }
  }

  /**
   * 필드명으로 필드 정부 구하기
   *
   * @public
   * @param {string} fieldName 필드명
   * @returns {FormField}
   */
  public getFieldName(fieldName: string): FormField {
    return this.allFieldInfo[this.keyNameMap[fieldName]];
  }

  /**
   * 필드 키로 정보 구하기
   *
   * @public
   * @param {string} fieldKey
   * @returns {FormField}
   */
  public get(fieldKey: string): FormField {
    return this.allFieldInfo[fieldKey];
  }

  /**
   * 필드명 있는지 여부 체크.
   *
   * @public
   * @param {string} fieldName 필드명
   * @returns {boolean}
   */
  public hasFieldName(fieldName: string): boolean {
    if (this.keyNameMap[fieldName] && this.allFieldInfo[this.keyNameMap[fieldName]]) {
      return true;
    }

    return false;
  }

  /**
   * 모든 필드 정보
   *
   * @public
   * @returns {NumberFieldMap}
   */
  public getAllFieldInfo(): NumberFieldMap {
    return this.allFieldInfo;
  }

  /**
   * 필드 정보 맵에서 지우기
   *
   * @public
   * @param {string} fieldName
   */
  public removeFieldInfo(fieldName: string) {
    const fieldKey = this.keyNameMap[fieldName];

    if (utils.isUndefined(fieldKey)) return;

    this.removeFieldInfoByKey(fieldKey);
    delete this.keyNameMap[fieldName];
  }

  /**
   * 필드 키로 필드 정보 맵에서 지우기
   *
   * @public
   * @param {string} fieldKey
   */
  public removeFieldInfoByKey(fieldKey: string) {
    const fieldInfo = this.allFieldInfo[fieldKey];

    if (fieldInfo && this.keyNameMap[fieldInfo.$validName] === fieldKey) {
      delete this.keyNameMap[fieldInfo.$validName];
    }

    delete this.allFieldInfo[fieldKey];

    this.conditionFields.delete(fieldKey);
    this.customConditionFields.delete(fieldKey);
    if (fieldInfo?.conditional?.field) {
      const dependencies = this.conditionDependencies.get(fieldInfo.conditional.field);
      dependencies?.delete(fieldKey);
      if (dependencies?.size === 0) this.conditionDependencies.delete(fieldInfo.conditional.field);
    }
  }

  /**
   * 모든 필드값 구하기
   *
   * @public
   * @param {boolean} validationCheck
   * @returns {*}
   */
  public getAllFieldValue(formValue: any, validationCheck: boolean) {
    const useTypeValue = this.form.getOptions().useTypeValue;
    const result = this.cleanFieldValues(formValue);

    if (validationCheck !== true) {
      for (let [key, fieldInfo] of Object.entries(this.allFieldInfo)) {
        if (this.isConditionFieldCheck(fieldInfo)) addFormValue(result, fieldInfo, useTypeValue);
      }
      return result;
    }

    return new Promise((resolve, reject) => {
      for (let [key, fieldInfo] of Object.entries(this.allFieldInfo)) {
        if (!this.isConditionFieldCheck(fieldInfo)) {
          continue;
        }

        let fieldValid = this.getFieldValidation(fieldInfo, true);

        if (fieldValid !== true) {
          reject(new Error(fieldValid.message, { cause: fieldValid }));
          return;
        }

        addFormValue(result, fieldInfo, useTypeValue);
      }

      resolve(result);
    });
  }

  public getFormDataValue(formValue: any, validationCheck: boolean) {
    const useTypeValue = this.form.getOptions().useTypeValue;
    const values = this.cleanFieldValues(formValue);
    const createFormData = () => {
      const data = new FormData();
      for (const [key, value] of Object.entries(values)) data.set(key, value as string);
      return data;
    };
    if (validationCheck !== true) {
      let reval = createFormData();

      for (let [key, fieldInfo] of Object.entries(this.allFieldInfo)) {
        if (this.isConditionFieldCheck(fieldInfo)) addFieldFormData(reval, fieldInfo, useTypeValue);
      }

      return reval;
    }

    return new Promise((resolve, reject) => {
      let reval = createFormData();

      for (let [key, fieldInfo] of Object.entries(this.allFieldInfo)) {
        if (!this.isConditionFieldCheck(fieldInfo)) {
          continue;
        }

        let fieldValid = this.getFieldValidation(fieldInfo, true);

        if (fieldValid !== true) {
          reject(new Error(fieldValid.message, { cause: fieldValid }));
          return;
        }

        addFieldFormData(reval, fieldInfo, useTypeValue);
      }

      resolve(reval);
    });
  }

  private cleanFieldValues(formValue: Record<string, unknown>): Record<string, unknown> {
    const values = { ...formValue };
    for (const field of Object.values(this.allFieldInfo)) {
      delete values[field.name];
      delete values[field.$validName];
      delete values[field.$validName + FILE_REMOVE_IDS_SUFFIX];
    }
    return values;
  }

  /**
   *
   *
   * @param field
   * @returns
   */
  public isConditionFieldCheck(field: FormField) {
    let parent = field;

    while (typeof parent !== "undefined") {
      if (!this.isConditionField(parent)) {
        return false;
      }

      parent = parent.$parent;
    }

    return true;
  }

  /**
   * field 활성 비활성화 여부.
   *
   * @param field form field
   * @returns
   */
  public isConditionField(field: FormField) {
    if (!this.conditionFields.has(field.$key)) {
      return true;
    }

    let condFlag = false;

    const conditional = field.conditional;
    if (!conditional) return true;
    if (conditional.custom) {
      condFlag = conditional.custom.call(null, field);
    } else {
      if (conditional.field) {
        const condField = this.getFieldName(conditional.field);

        if (condField) {
          if (conditional.eq == condField.$instance.getValue()) {
            condFlag = true;
          }
        }
      }
    }

    return conditional.show === false ? !condFlag : condFlag;
  }

  /**
   * 컬럼 로우 보이고 안보이기 체크.
   *
   * @public
   */
  public conditionCheck(changedFieldName?: string) {
    const fields = changedFieldName === undefined
      ? this.conditionFields
      : new Set([...this.customConditionFields, ...(this.conditionDependencies.get(changedFieldName) ?? [])]);
    fields.forEach((fieldKey) => {
      const fieldInfo = this.allFieldInfo[fieldKey];
      if (!fieldInfo) return;

      let condFlag = this.isConditionField(fieldInfo);

      if (condFlag) {
        fieldInfo.$instance.show();
      } else {
        fieldInfo.$instance.hide();
      }
    });
  }

  /**
   * field validation check
   *
   * @param fieldInfo FormField
   * @returns boolean true or ValidResult
   */
  public getFieldValidation(fieldInfo: FormField, focusFlag: boolean | undefined) {
    if (!this.isConditionFieldCheck(fieldInfo)) {
      return true;
    }

    const renderInfo = fieldInfo.$instance;
    let fieldValid = renderInfo.valid();

    if (fieldValid === true) return true;

    if (focusFlag) {
      renderInfo.focus();
    }
    fieldValid = fieldValid as ValidResult;
    if (utils.isUndefined(fieldValid.message)) {
      fieldValid.message = Language.validMessage(fieldInfo, fieldValid)[0];
    }

    return fieldValid;
  }
}

/**
 * add form value
 * @param formData {Object} return Object value
 * @param fieldInfo {FormField} field info
 * @param fieldValue {any} form value
 */
function addFormValue(formData: any, fieldInfo: FormField, useTypeValue?: boolean) {
  if (utils.ignoreValueField(fieldInfo)) {
    return formData;
  }

  const fieldValue = fieldInfo.$instance.getValue();

  if (fieldInfo.renderType === "file") {
    const uploadFiles = fieldValue["uploadFile"];

    formData[fieldInfo.$validName] = uploadFiles;
    formData[fieldInfo.$validName + FILE_REMOVE_IDS_SUFFIX] = fieldValue["removeIds"];
  } else {
    if (useTypeValue !== true) {
      if (utils.isTabType(fieldInfo)) {
        for (let [key, value] of Object.entries(fieldValue)) {
          formData[key] = value;
        }
      } else {
        if (!utils.isEmpty(fieldInfo.name)) {
          formData[fieldInfo.name] = fieldValue;
        }
      }
    } else {
      formData[fieldInfo.$validName] = fieldValue;
    }
  }

  return formData;
}

function addFieldFormData(formData: FormData, fieldInfo: FormField, useTypeValue?: boolean) {
  if (utils.ignoreValueField(fieldInfo)) {
    return formData;
  }

  const fieldValue = fieldInfo.$instance.getValue();

  if (fieldInfo.renderType === "file") {
    const uploadFiles = fieldValue["uploadFile"];
    formData.delete(fieldInfo.$validName);
    for (let uploadFile of uploadFiles) {
      formData.append(fieldInfo.$validName, uploadFile);
    }

    const removeKey = fieldInfo.$validName + FILE_REMOVE_IDS_SUFFIX;
    formData.delete(removeKey);
    for (const id of fieldValue["removeIds"]) formData.append(removeKey, String(id));
  } else {
    if (useTypeValue !== true) {
      if (utils.isTabType(fieldInfo)) {
        for (let [key, value] of Object.entries(fieldValue)) {
          formData.set(key, value as any);
        }
      } else {
        if (!utils.isEmpty(fieldInfo.name)) {
          formData.set(fieldInfo.$validName, fieldValue);
        }
      }
    } else {
      formData.set(fieldInfo.$validName, fieldValue);
    }
  }

  return formData;
}
