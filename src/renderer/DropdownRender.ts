import { FormField, ValuesInfo } from "@t/FormField";
import { Render } from "./Render";
import { ValidResult } from "@t/ValidResult";
import { RULES } from "@/constants";
import { resetRowElementStyleClass, invalidMessage } from "@/util/validUtils";
import { dropdownChangeEvent } from "@/event/renderEvents";
import { DaraForm } from "@/DaraForm";
import * as utils from "@/util/utils";
import Language from "@/util/Language";

export default class DropdownRender extends Render {
  private element: HTMLSelectElement;
  private defaultSelected;

  constructor(field: FormField, rowElement: HTMLElement, daraForm: DaraForm) {
    super(daraForm, field, rowElement);

    let initDefaultValue = "";

    if (!utils.isUndefined(field.defaultValue)) {
      initDefaultValue = field.defaultValue;
    }

    const valueKey = DropdownRender.valuesValueKey(field);
    let initDefaultValueFlag = false;
    this.field.listItem?.list?.forEach((item) => {
      let itemValue = item[valueKey];
      if (item.selected) {
        this.defaultSelected = itemValue;
      }
      if (itemValue == initDefaultValue) {
        initDefaultValueFlag = true;
      }
    });

    if (initDefaultValueFlag) {
      this.defaultSelected = initDefaultValue;
    } else if (!this.defaultSelected) {
      if (field.rendererOptions?.disableDefaultOption === true) {
        this.defaultSelected = this.field.listItem?.list?.length > 0 ? this.field.listItem.list[0][valueKey] || "" : "";
      }
    }

    if (utils.isUndefined(this.defaultSelected)) {
      this.defaultSelected = "";
    }

    this.mounted();
    this.setDefaultOption();
    this.setValue(this.defaultSelected, false);
  }

  mounted() {
    dropdownChangeEvent(this.field, this.element, this);
  }

  createField() {
    const field = this.field;

    const fieldContainerElement = this.rowElement.querySelector(".df-field-container") as HTMLElement;

    let template = ` <div class="df-field"><select name="${field.$xssName}" class="df-form-field df-dropdown">
          ${this.dropdownValuesTemplate(field)}
          </select> <i class="df-help-icon"></i></div>
                ${Render.getDescriptionTemplate(field)}
      <div class="df-help-message"></div>
    `;
    fieldContainerElement.innerHTML = template;

    this.element = fieldContainerElement.querySelector(`[name="${field.$xssName}"]`) as HTMLSelectElement;
  }

  public setValueItems(items: any): void {
    if (this.field.listItem) {
      this.field.listItem.list = items;
    } else {
      this.field.listItem = {
        list: items,
      } as ValuesInfo;
    }
    this.element.innerHTML = this.dropdownValuesTemplate(this.field);

    if (!utils.isBlank(this.field.$value)) {
      const currentValue = this.field.$value;
      this.field.$value = "";
      this.setValue(currentValue);
    }
  }

  getValue() {
    return this.element.value;
  }

  setValue(value: any, changeCheckFlag?: boolean): void {
    if (changeCheckFlag !== false && this.changeEventCall(this.field, null, this, value) === false) {
      this.element.value = this.field.$value;
      return;
    }
    this.field.$value = value;
    this.element.value = value;
  }

  reset() {
    this.setValue(this.defaultSelected, false);
    this.setDisabled(false);
    resetRowElementStyleClass(this.rowElement);
  }

  getElement(): HTMLElement {
    return this.element;
  }

  valid(): any {
    const value = this.getValue();

    let validResult: ValidResult | boolean = true;

    if (this.field.required) {
      if (value.length < 1) {
        validResult = { name: this.field.name, constraint: [] };
        validResult.constraint.push(RULES.REQUIRED);
      }
    }

    invalidMessage(this.field, this.rowElement, validResult);

    return validResult;
  }

  public dropdownValuesTemplate(field: FormField) {
    const labelKey = Render.valuesLabelKey(field);
    const valueKey = Render.valuesValueKey(field);
    let template = "";

    if (field.rendererOptions?.disableDefaultOption !== true) {
      template += `<option value="">${Language.getMessage("selection")}</option>`;
    }
    field.listItem?.list?.forEach((val) => {
      const attr = `${val.selected ? "selected" : ""} ${val.disabled ? "disabled" : ""}`;
      if (utils.isUndefined(val[valueKey]) && val.label) {
        template += `<option value="${val.value || ""}" ${attr}>${val.label}</option>`;
      } else {
        template += `<option value="${val[valueKey]}" ${attr}>${Render.valuesLabelValue(labelKey, val)}</option>`;
      }
    });

    return template;
  }
}
