import { FormField } from "@t/FormField";
import { Render } from "./Render";
import { numberValidator } from "@/rule/numberValidator";
import { resetRowElementStyleClass, invalidMessage } from "@/util/validUtils";
import { customChangeEventCall, numberInputEvent } from "@/event/renderEvents";
import { DaraForm } from "@/DaraForm";

export default class RangeRender extends Render {
  private element: HTMLInputElement;
  private rangeNumElement: Element;

  constructor(field: FormField, rowElement: HTMLElement, daraForm: DaraForm) {
    super(daraForm, field, rowElement);

    this.rangeNumElement = rowElement.querySelector(".df-range-num") as Element;

    this.mounted();
    this.setDefaultOption();
    this.setDefaultInfo();
  }

  mounted() {
    this.element.addEventListener("input", (e: any) => {
      this.rangeNumElement.innerHTML = e.target.value;

      this.element.setAttribute("title", e.target.value);
      customChangeEventCall(this.field, e, this, this.getValue());
      this.valid();
    });
  }

  createField() {
    const field = this.field;

    const fieldContainerElement = this.rowElement.querySelector(".df-field-container") as HTMLElement;

    fieldContainerElement.innerHTML = `
        <div class="df-field">
            <span class="df-range-num">${field.defaultValue ? field.defaultValue : 0}</span>
            <input type="range" name="${field.$xssName}" class="df-form-field df-range df-help-icon" min="${field.rule.minimum}" max="${field.rule.maximum}"/>
        </div> 
        ${Render.getDescriptionTemplate(field)}
        <div class="df-help-message"></div>
       `;

    this.element = fieldContainerElement.querySelector(`[name="${field.$xssName}"]`) as HTMLInputElement;
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
    this.setDefaultInfo();
    this.setDisabled(false);
    resetRowElementStyleClass(this.rowElement);
  }

  getElement(): HTMLElement {
    return this.element;
  }

  valid(): any {
    const validResult = numberValidator(this.getValue(), this.field);

    invalidMessage(this.field, this.rowElement, validResult);

    return validResult;
  }
}
