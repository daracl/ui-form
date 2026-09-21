import { FormField } from "@t/FormField";
import { ValidResult } from "@t/ValidResult";
import { DaraForm } from "@/DaraForm";
import * as utils from "@/util/utils";

export abstract class Render {
  protected daraForm;
  protected rowElement;
  protected field;

  private enableView: boolean = true;

  constructor(form: DaraForm, field: FormField, rowElement: HTMLElement) {
    this.daraForm = form;
    this.field = field;
    this.rowElement = rowElement;
    this.createField();

    if (field.tooltip) rowElement.querySelector(".df-tooltip")?.setAttribute("tooltip", field.tooltip);
  }

  public setDefaultInfo() {
    if (utils.isUndefined(this.field.defaultValue)) {
      this.setValue("", false);
    } else {
      this.setValue(this.field.defaultValue, false);
    }

    if (!utils.isUndefined(this.field.placeholder)) {
      const ele = this.getElement();
      if (ele instanceof Element) {
        ele.setAttribute("placeholder", this.field.placeholder);
      }
    }
  }

  public setDefaultOption() {
    this.setDisabled(this.field.disabled ?? false);
  }

  public addChildField(element: Element) {
    this.rowElement.querySelector(".df-field-container")?.append(element);
  }

  static isDataRender(): boolean {
    return true;
  }

  static isChildrenCreate(): boolean {
    return true;
  }

  public getForm(): DaraForm {
    return this.daraForm;
  }

  public abstract mounted(): void;
  public abstract getValue(): any;
  public abstract setValue(value: any, changeCheckFlag?: boolean): void;
  public abstract reset(): void;
  public abstract getElement(): any;
  public abstract valid(): ValidResult | boolean;
  public abstract createField(): void;

  public setValueItems(value: any): void {}

  public static getDescriptionTemplate(field: FormField): string {
    const classNames = field.descriptionClass ? utils.replaceXss(field.descriptionClass) : "";
    const style = field.descriptionStyle ? 'style="' + utils.replaceXss(field.descriptionStyle) + '"' : "";

    return field.description ? `<div class="df-description ${classNames}" ${style}>${field.description}</div>` : "";
  }

  public changeEventCall(field: FormField, e: Event | null, rederInfo: Render, fieldValue: any): boolean | undefined {
    if (field.onChange) {
      let changeInfo: any = {
        field: field,
        evt: e,
        oldValue: field.$value,
        value: fieldValue,
      };

      if (field.listItem?.list) {
        let valuesItem = [];
        const valueKey = Render.valuesValueKey(field);

        for (let val of field.listItem.list) {
          let changeVal = val[valueKey];
          if (utils.isString(fieldValue)) {
            if (changeVal == fieldValue) {
              valuesItem.push(val);
              break;
            }
          } else if (utils.isArray(fieldValue)) {
            if (fieldValue.includes(changeVal)) {
              valuesItem.push(val);
            }
          }
        }

        changeInfo.valueItems = valuesItem;
      }

      if (changeInfo.oldValue != changeInfo.value && field.onChange.call(null, changeInfo) === false) {
        rederInfo.setValue(field.$value, false);
        return false;
      }

      field.$value = changeInfo.value;
    }

    this.daraForm.conditionCheck();
  }

  public focus() {
    this.getElement().focus();
  }

  public isEnableView() {
    return this.enableView;
  }

  public show() {
    this.enableView = true;
    this.rowElement.classList.remove("df-hidden");
  }

  public hide() {
    this.enableView = false;
    if (!this.rowElement.classList.contains("df-hidden")) {
      this.rowElement.classList.add("df-hidden");
    }
  }

  /**
   * 설명 추가
   *
   * @public
   * @param {string} desc
   */
  public setDescription(desc: string) {
    const descEle = this.rowElement.querySelector(".df-description");
    if (descEle) {
      descEle.textContent = desc;
    } else {
      const fieldEle = this.rowElement.querySelector(".df-field");
      if (fieldEle) {
        const parser = new DOMParser();
        this.field.description = desc;
        const descEle = parser.parseFromString(Render.getDescriptionTemplate(this.field), "text/html").querySelector(".df-description");

        if (descEle) fieldEle.parentNode?.insertBefore(descEle, fieldEle.nextSibling);
      }
    }
  }

  public setActive(id: string): void {
    //console.log("parent");
  }

  public setDisabled(flag: boolean) {
    const ele = this.getElement();
    if (ele instanceof HTMLElement) {
      if (flag === false) {
        this.getElement().removeAttribute("disabled");
      } else {
        this.getElement().setAttribute("disabled", true);
      }
    }
  }

  public commonValidator() {
    //this.field.diff
  }

  public static valuesValueKey(field: FormField): string {
    return field.listItem?.valueField ? field.listItem.valueField : "value";
  }

  public static valuesLabelKey(field: FormField): string {
    return field.listItem?.labelField ? field.listItem.labelField : "label";
  }

  public static valuesLabelValue(label: string, val: any) {
    let replaceFlag = false;
    const resultValue = label.replace(/\{\{([A-Za-z0-9_.]*)\}\}/g, (match, key) => {
      replaceFlag = true;
      return val[key] || "";
    });

    if (replaceFlag) {
      return resultValue;
    }

    return val[label] || "";
  }
}
