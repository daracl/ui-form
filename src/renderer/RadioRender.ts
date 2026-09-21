import { FormField, ValuesInfo } from "@t/FormField";
import { Render } from "./Render";
import { ValidResult } from "@t/ValidResult";
import { OrientationMap, RULES } from "@/constants";
import { resetRowElementStyleClass, invalidMessage } from "@/util/validUtils";
import { customChangeEventCall } from "@/event/renderEvents";
import { DaraForm } from "@/DaraForm";
import * as utils from "@/util/utils";
import { orientationClassName } from "@/util/styleUtils";

export default class RadioRender extends Render {
  private defaultCheckValue;

  constructor(field: FormField, rowElement: HTMLElement, daraForm: DaraForm) {
    super(daraForm, field, rowElement);

    this.defaultCheckValue = "";
    let initDefaultValue = [] as any;
    if (!utils.isUndefined(field.defaultValue)) {
      initDefaultValue = field.defaultValue;
    }

    const valueKey = RadioRender.valuesValueKey(field);
    let initDefaultValueFlag = false;
    this.field.listItem?.list?.forEach((item) => {
      let itemValue = item[valueKey];
      if (item.selected) {
        this.defaultCheckValue = itemValue;
      }

      if (initDefaultValue == itemValue) {
        initDefaultValueFlag = true;
      }
    });

    // 처리 할것.

    if (initDefaultValueFlag) {
      this.defaultCheckValue = initDefaultValue;
    } else if (!this.defaultCheckValue) {
      this.defaultCheckValue = this.field.listItem?.list?.length > 0 ? this.field.listItem?.list[0][valueKey] : "";
    }

    this.mounted();
    this.setDefaultOption();
    this.setValue(this.defaultCheckValue, false);
  }

  public mounted() {
    this.initEvent();
  }

  public initEvent() {
    const checkboxes = this.rowElement.querySelectorAll(this.getSelector());

    checkboxes.forEach((ele) => {
      ele.addEventListener("change", (e: Event) => {
        customChangeEventCall(this.field, e, this, this.getValue());

        this.valid();
      });
    });
  }

  public getSelector() {
    return `input[type="radio"][name="${this.field.$xssName}"]`;
  }

  createField() {
    const field = this.field;

    const fieldContainerElement = this.rowElement.querySelector(".df-field-container") as HTMLElement;

    const templates: string[] = [];
    const fieldName = field.$xssName;

    const labelKey = Render.valuesLabelKey(field);
    const valueKey = Render.valuesValueKey(field);

    templates.push(`<div class="df-field"><div class="df-field-group">`);

    field.listItem?.list?.forEach((val) => {
      const radioVal = val[valueKey];

      templates.push(
        `<span class="df-field-item ${orientationClassName(field.orientation ?? OrientationMap.horizontal)}">
        <label>
            <input type="radio" name="${fieldName}" value="${radioVal}" class="df-form-field df-radio" ${val.selected ? "checked" : ""} ${val.disabled ? "disabled" : ""}/>
            ${Render.valuesLabelValue(labelKey, val)}
        </label>
        </span>
                `
      );
    });
    templates.push(`<i class="df-form-icon df-help-icon"></i></div></div>
        ${Render.getDescriptionTemplate(field)}
     <div class="df-help-message"></div>
    `);

    fieldContainerElement.innerHTML = templates.join("");

    this.initEvent();
  }

  public setValueItems(items: any): void {
    const containerEle = this.rowElement.querySelector(".df-field-container");
    if (containerEle) {
      if (this.field.listItem) {
        this.field.listItem.list = items;
      } else {
        this.field.listItem = {
          list: items,
        } as ValuesInfo;
      }

      this.createField();

      if (!utils.isBlank(this.field.$value)) {
        const currentValue = this.field.$value;
        this.field.$value = "";
        this.setValue(currentValue);
      }
    }
  }

  getValue() {
    return (this.rowElement.querySelector(`[name="${this.field.$xssName}"]:checked`) as HTMLInputElement)?.value;
  }

  setValue(value: any, changeCheckFlag?: boolean): void {
    if (changeCheckFlag !== false && this.changeEventCall(this.field, null, this, value) === false) {
      value = this.field.$value;
    }

    this.field.$value = value;
    if (value === true) {
      (this.rowElement.querySelector(`[name="${this.field.$xssName}"]`) as HTMLInputElement).checked = true;
      return;
    }

    if (value === false) {
      (this.rowElement.querySelector(`[name="${this.field.$xssName}"]`) as HTMLInputElement).checked = false;
      return;
    }

    const elements = this.rowElement.querySelectorAll(this.getSelector());

    elements.forEach((ele) => {
      let radioEle = ele as HTMLInputElement;
      if (radioEle.value == value) {
        radioEle.checked = true;
      } else {
        radioEle.checked = false;
      }
    });
  }

  reset() {
    this.setValue(this.defaultCheckValue, false);
    this.setDisabled(false);
    resetRowElementStyleClass(this.rowElement);
  }

  getElement(): any {
    return this.rowElement.querySelectorAll(this.getSelector());
  }

  public focus() {
    const elements = this.getElement();

    if (elements && elements.length > 0) {
      this.getElement()[0].focus();
    }
  }

  valid(): any {
    const value = this.getValue();

    let validResult: ValidResult | boolean = true;

    if (this.field.required) {
      if (utils.isBlank(value)) {
        validResult = { name: this.field.name, constraint: [] };
        validResult.constraint.push(RULES.REQUIRED);
      }
    }

    invalidMessage(this.field, this.rowElement, validResult);

    return validResult;
  }
}
