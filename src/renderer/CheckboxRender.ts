import { FormField, ValuesInfo } from "@t/FormField";
import { Render } from "./Render";
import * as utils from "@/util/utils";
import { ValidResult } from "@t/ValidResult";
import { OrientationMap, RULES } from "@/constants";
import { resetRowElementStyleClass, invalidMessage } from "@/util/validUtils";
import { customChangeEventCall } from "@/event/renderEvents";
import { DaraForm } from "@/DaraForm";
import { orientationClassName } from "@/util/styleUtils";

export default class CheckboxRender extends Render {
  private defaultCheckValue: any[] = [];

  constructor(field: FormField, rowElement: HTMLElement, daraForm: DaraForm) {
    super(daraForm, field, rowElement);

    this.defaultCheckValue = [];
    let initDefaultValue = [] as any;
    if (!utils.isUndefined(field.defaultValue)) {
      if (utils.isArray(field.defaultValue)) {
        initDefaultValue = field.defaultValue;
      } else {
        initDefaultValue = [field.defaultValue];
      }
    }

    const valueKey = CheckboxRender.valuesValueKey(field);

    if (utils.isUndefined(this.field.listItem)) {
      this.setValueItems([{ label: "", value: "Y" }]);
    }

    let initDefaultValueFlag = false;
    this.field.listItem?.list?.forEach((item) => {
      let itemValue = item[valueKey];
      if (item.selected) {
        this.defaultCheckValue.push(itemValue ? itemValue : true);
      }
      if (initDefaultValue.includes(itemValue)) {
        initDefaultValueFlag = true;
      }
    });

    this.defaultCheckValue = initDefaultValueFlag ? initDefaultValue : this.defaultCheckValue;

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
    return `input[type="checkbox"][name="${this.field.$xssName}"]`;
  }

  createField() {
    const field = this.field;

    const fieldContainerElement = this.rowElement.querySelector(".df-field-container") as HTMLElement;

    const templates: string[] = [];
    const fieldName = field.$xssName;

    const labelKey = Render.valuesLabelKey(field);
    const valueKey = Render.valuesValueKey(field);

    templates.push(` <div class="df-field"><div class="df-field-group">`);
    field.listItem?.list?.forEach((val) => {
      const checkVal = val[valueKey];
      templates.push(`
          <span class="df-field-item ${orientationClassName(field.listItem.orientation ?? OrientationMap.horizontal)}">
              <label>
                  <input type="checkbox" name="${fieldName}" value="${checkVal ? utils.replaceXss(checkVal) : ""}" class="df-form-field df-checkbox" ${val.selected ? "checked" : ""} ${val.disabled ? "disabled" : ""}  />
                  ${Render.valuesLabelValue(labelKey, val)}
              </label>
          </span>
      `);
    });
    templates.push(`<i class="df-form-icon df-help-icon"></i></div></div> ${Render.getDescriptionTemplate(field)}<div class="df-help-message"></div>`);

    fieldContainerElement.innerHTML = templates.join("");
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
    const checkboxes = this.rowElement.querySelectorAll(this.getSelector());

    if (checkboxes.length > 1) {
      const checkValue: any[] = [];
      checkboxes.forEach((ele) => {
        const checkEle = ele as HTMLInputElement;
        if (checkEle.checked) {
          checkValue.push(checkEle.value);
        }
      });
      return checkValue;
    } else {
      const checkElement = this.rowElement.querySelector(`[name="${this.field.$xssName}"]`) as HTMLInputElement;

      if (checkElement?.checked) {
        return checkElement.value ? checkElement.value : true;
      }

      return checkElement.value ? "" : false;
    }
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

    let valueArr: any[] = [];
    if (utils.isArray(value)) {
      valueArr = value;
    } else {
      valueArr.push(value);
    }

    const checkboxes = this.rowElement.querySelectorAll(this.getSelector());

    checkboxes.forEach((ele) => {
      (ele as HTMLInputElement).checked = false;
    });

    valueArr.forEach((val) => {
      const ele = this.rowElement.querySelector(`[name="${this.field.$xssName}"][value="${val}"]`) as HTMLInputElement;
      if (ele) ele.checked = true;
    });
  }

  reset() {
    if (this.field.listItem?.list?.length == 1 && this.defaultCheckValue.length == 1) {
      this.setValue(true, false);
    } else {
      this.setValue(this.defaultCheckValue, false);
    }
    this.setDisabled(false);
    resetRowElementStyleClass(this.rowElement);
  }

  getElement(): any {
    return this.rowElement.querySelectorAll(`[name="${this.field.$xssName}"]`);
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

    if (this.field.required && utils.isArray(value)) {
      if ((value as any[]).length < 1) {
        validResult = { name: this.field.name, constraint: [] };
        validResult.constraint.push(RULES.REQUIRED);
      }
    }

    invalidMessage(this.field, this.rowElement, validResult);

    return validResult;
  }
}
