import { FormField } from "@t/FormField";
import { Render } from "./Render";
import { DaraForm } from "@/DaraForm";

export default class HiddenRender extends Render {
  constructor(field: FormField, rowElement: HTMLElement, daraForm: DaraForm) {
    super(daraForm, field, rowElement);
    this.field.$value = field.defaultValue ?? "";
  }

  mounted() {}

  createField() {
    return ``;
  }

  getValue() {
    return this.field.$value;
  }

  setValue(value: any): void {
    this.field.$value = value;
  }

  reset() {
    this.setValue(this.field.defaultValue);
  }

  getElement() {
    return;
  }

  valid(): any {
    return true;
  }
}
