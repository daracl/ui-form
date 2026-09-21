import { FormField } from "@t/FormField";
import { Render } from "./Render";
import { stringValidator } from "@/rule/stringValidator";
import { resetRowElementStyleClass, invalidMessage } from "@/util/validUtils";
import { inputEvent } from "@/event/renderEvents";
import { DaraForm } from "@/DaraForm";

export default class TextRender extends Render {
  private element: HTMLInputElement;

  constructor(field: FormField, rowElement: HTMLElement, daraForm: DaraForm) {
    super(daraForm, field, rowElement);
    this.mounted();
    this.setDefaultOption();
    this.setDefaultInfo();
  }

  mounted() {
    inputEvent(this.field, this.element, this);
  }

  createField() {
    const field = this.field;

    const fieldContainerElement = this.rowElement.querySelector(".df-field-container") as HTMLElement;

    fieldContainerElement.innerHTML = `
      <div class="df-field">
       <input type="text" name="${field.$xssName}" class="df-form-field df-text df-help-icon" />
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

  getElement(): HTMLInputElement {
    return this.element;
  }

  valid(): any {
    const validResult = stringValidator(this.getValue(), this.field);

    invalidMessage(this.field, this.rowElement, validResult);

    return validResult;
  }
}
