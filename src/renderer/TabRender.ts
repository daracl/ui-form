import { FieldStyle, FormField } from "@t/FormField";
import { Render } from "./Render";
import { invalidMessage } from "@/util/validUtils";
import { stringValidator } from "@/rule/stringValidator";
import { DaraForm } from "@/DaraForm";
import FormTemplate from "@/FormTemplate";
import { resolveFieldStyle } from "@/util/styleUtils";
import { FormOptions } from "@t/FormOptions";
import * as utils from "@/util/utils";

export default class TabRender extends Render {
  private customFunction;
  private tabContainerElement: HTMLElement;
  constructor(field: FormField, rowElement: HTMLElement, daraForm: DaraForm) {
    super(daraForm, field, rowElement);

    if (field.renderer) {
      this.customFunction = field.renderer;
    } else {
      this.customFunction = {} as any;
    }

    this.mounted();
  }

  mounted() {
    if (this.customFunction.mounted) {
      (this.customFunction.mounted as any).call(this, this.field, this.rowElement);
    }

    this.tabContainerElement.querySelectorAll(".df-tab-item").forEach((tabItem) => {
      tabItem.addEventListener("click", (e: any) => {
        this.clickEventHandler(tabItem, e);
      });
    });
  }

  /**
   * tab item click
   *
   * @param {Element} tabItem
   * @param {*} evt
   */
  private clickEventHandler(tabItem: Element, evt: any) {
    this.setActive(tabItem.getAttribute("data-tab-id") ?? "");
  }

  public setActive(tabId: string): void {
    const tabItem = this.tabContainerElement.querySelector(`[data-tab-id="${tabId}"]`);

    if (!tabItem) return;

    if (!tabItem.classList.contains("active")) {
      for (let item of tabItem?.parentElement?.children ?? []) {
        item.classList.remove("active");
      }
      tabItem.classList.add("active");
    }

    const tabPanel = this.rowElement.querySelector(`[tab-panel-id="${tabId}"]`);

    if (!tabPanel?.classList.contains("active")) {
      for (let item of tabPanel?.parentElement?.children ?? []) {
        item.classList.remove("active");
      }

      tabPanel?.classList.add("active");
    }
  }

  static isDataRender(): boolean {
    return false;
  }

  static isChildrenCreate(): boolean {
    return false;
  }

  /**
   * tab template
   *
   * @param {FormField} field
   * @param {FormTemplate} formTemplate
   * @param {FormOptions} options
   * @returns {string} template string
   */

  createField() {
    const field = this.field;

    const formTemplate = this.daraForm.formTemplate;
    const options = this.daraForm.getOptions();

    const fieldContainerElement = this.rowElement.querySelector(".df-field-container") as HTMLElement;

    //tab 이벤트 처리 할것.
    let fieldStyle = resolveFieldStyle(options, field);

    fieldContainerElement.innerHTML = `
        <div class="df-field ">
          <div class="df-tab-header ${fieldStyle.tabAlignClass}"></div>
        </div>
        <div class="df-tab-body"></div>
    `;

    if (field.children) {
      let firstFlag = true;

      const formOptions = this.getForm().getOptions();

      let fieldStyle: FieldStyle = resolveFieldStyle(formOptions, field, null, formTemplate.isLabelHide(field));

      for (const childField of field.children) {
        childField.$parent = field;
        formTemplate.addRowFieldInfo(childField);
        let id = childField.$key;

        let tabTemplate = `<span class="df-tab-item ${firstFlag ? "active" : ""}" data-tab-id="${id}"><a href="javascript:;">${childField.label}</a></span>`;

        let tabBodyTemplate = `<div class="df-tab-panel ${firstFlag ? "active" : ""}" tab-panel-id="${id}">${Render.getDescriptionTemplate(childField)}
          <div class="df-tab-group"></div>
        </div>`;

        const tabElement = utils.templateToElement(tabTemplate);
        const tabBodyElement = utils.templateToElement(tabBodyTemplate);

        firstFlag = false;
        if (tabElement) {
          fieldContainerElement.querySelector(".df-tab-header")?.appendChild(tabElement);
        }

        if (tabBodyElement) {
          fieldContainerElement.querySelector(".df-tab-body")?.appendChild(tabBodyElement);

          if (childField.children) {
            let tabFormOptions = {
              style: {
                width: formOptions.style.width ?? "100%",
                labelWidth: formOptions.style.labelWidth ?? 3,
                valueWidth: formOptions.style.valueWidth ?? 9,
                position: formOptions.style.position ?? "left-right",
              },
              useTypeValue: formOptions.useTypeValue,
              autoCreate: false,
              notValidMessage: "This form is not valid.",
              fields: [],
            } as FormOptions;

            childField.$tabForm = new DaraForm(document.createElement("div"), tabFormOptions);

            childField.$instance = new (childField.$renderType as any)(childField, tabBodyElement?.querySelector(".df-tab-group"), childField.$tabForm);

            childField.$tabForm.formTemplate.childTemplate(childField, fieldStyle);
          }
        }
      }

      this.tabContainerElement = fieldContainerElement;
    }
  }

  getValue(): any {
    if (this.customFunction.getValue) {
      return (this.customFunction.getValue as any).call(this, this.field, this.rowElement);
    }

    let allTabValue = {} as any;

    let useTypeValue = this.getForm().getOptions().useTypeValue;

    for (const childField of this.field.children) {
      const childFieldValue = childField.$tabForm?.getValue(false);
      if (useTypeValue) {
        allTabValue[childField.$validName] = childFieldValue;
      } else {
        for (let [key, value] of Object.entries(childFieldValue)) {
          allTabValue[key] = value;
        }
      }
    }
    return allTabValue;
  }

  setValue(value: any): void {
    for (const childField of this.field.children) {
      let tabChildValue = value[childField.$validName];

      if (tabChildValue) {
        childField.$tabForm?.setValue(tabChildValue);
      }
    }
  }

  reset() {}

  getElement(): Element {
    return this.rowElement;
  }

  valid(): any {
    if (this.customFunction.valid) {
      const validResult = (this.customFunction.valid as any).call(this, this.field, this.rowElement);

      invalidMessage(this.field, this.rowElement, validResult);

      return;
    }

    const field = this.field;

    for (const childField of field.children) {
      const validResult = childField.$tabForm?.validForm();

      if (validResult && validResult.length > 0) {
        const firstItem = validResult[0];

        if (firstItem.message) {
          firstItem.message = "[" + this.field.label + "] " + firstItem.message;

          return firstItem;
        }
      }
    }

    return true;
  }

  focus(): void {}
}
