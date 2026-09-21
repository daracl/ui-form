import { FormField } from "@t/FormField";
import { Render } from "./Render";
import { invalidMessage, resetRowElementStyleClass } from "@/util/validUtils";
import { DaraForm } from "@/DaraForm";
import * as utils from "@/util/utils";
import { stringValidator } from "@/rule/stringValidator";

export default class CustomRender extends Render {
  private customFunction;

  constructor(field: FormField, rowElement: HTMLElement, daraForm: DaraForm) {
    super(daraForm, field, rowElement);
    if (field.renderer) {
      this.customFunction = field.renderer;
      this.mounted();
      this.setDefaultOption();
      this.setDefaultInfo();
    } else {
      this.customFunction = {} as any;
    }
  }

  mounted() {
    if (this.customFunction.mounted) {
      (this.customFunction.mounted as any).call(this, this.field, this.rowElement);
    }
  }

  static isDataRender(): boolean {
    return false;
  }

  createField() {
    const field = this.field;

    const fieldTemplate = utils.isEmpty(field.template) ? "" : utils.isString(field.template) ? field.template : field.template();

    const fieldContainerElement = this.rowElement.querySelector(".df-field-container") as HTMLElement;

    fieldContainerElement.innerHTML = ` <div class="df-field">
        ${fieldTemplate}
        </div>
          ${Render.getDescriptionTemplate(field)}
        <div class="df-help-message"></div>`;
  }

  getValue() {
    if (this.customFunction.getValue) {
      return (this.customFunction.getValue as any).call(this, this.field, this.rowElement);
    }
    return "";
  }

  setValue(value: any, changeCheckFlag?: boolean): void {
    if (this.customFunction.setValue) {
      if (changeCheckFlag !== false && this.changeEventCall(this.field, null, this, value) === false) {
        value = this.field.$value;
      }
      (this.customFunction.setValue as any).call(this, value, this.field, this.rowElement);
    }

    this.field.$value = value;
  }

  reset() {
    this.setDefaultInfo();
    resetRowElementStyleClass(this.rowElement);
  }

  getElement() {
    if (this.customFunction.getElement) {
      return (this.customFunction.getElement as any).call(this, this.field, this.rowElement);
    }
    return null;
  }

  valid(): any {
    if (this.customFunction.valid) {
      const validResult = (this.customFunction.valid as any).call(this, this.field, this.rowElement);

      invalidMessage(this.field, this.rowElement, validResult);

      return;
    }
    const validResult = stringValidator(this.getValue(), this.field);

    invalidMessage(this.field, this.rowElement, validResult);

    return validResult;
  }

  /**
   * focus
   */
  focus(): void {
    if (this.customFunction.focus) {
      (this.customFunction.focus as any).call(this, this.field, this.rowElement);
    }
  }
}
