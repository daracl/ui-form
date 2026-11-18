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
      this.rangeNumElement.textContent = e.target.value;

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
            <span class="df-range-num"></span>
            <input type="range" name="${field.$xssName}" class="df-form-field df-range df-help-icon"/>
        </div> 
        ${Render.getDescriptionTemplate(field)}
        <div class="df-help-message"></div>
       `;

    this.element = fieldContainerElement.querySelector(`[name="${field.$xssName}"]`) as HTMLInputElement;
    this.element.min = String(field.rule?.minimum ?? 0);
    this.element.max = String(field.rule?.maximum ?? 100);
    const rangeNumber = fieldContainerElement.querySelector(".df-range-num");
    if (rangeNumber) rangeNumber.textContent = String(field.defaultValue || 0);
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
