import { FieldStyle, FormField } from "@t/FormField";
import { Render } from "./Render";
import { invalidMessage, resetRowElementStyleClass } from "@/util/validUtils";
import { DaraForm } from "@/DaraForm";
import * as utils from "@/util/utils";
import { stringValidator } from "@/rule/stringValidator";
import { resolveFieldStyle } from "@/util/styleUtils";
import FormTemplate from "@/FormTemplate";
import { FormOptions } from "@t/FormOptions";
import { NumberKeyMap } from "@t/DataMap";

let $$idx = 0;

export default class GridRender extends Render {
  private customFunction;
  private gridForm;
  private allAddRowInfo = {} as NumberKeyMap;

  constructor(field: FormField, rowElement: HTMLElement, daraForm: DaraForm) {
    super(daraForm, field, rowElement);

    if (field.renderer) {
      this.customFunction = field.renderer;
    } else {
      this.customFunction = {} as any;
    }

    const gridFormOptions = {
      style: {
        width: "100%",
        labelWidth: 3,
        valueWidth: 9,
        position: "left-right",
      },
      autoCreate: false,
      notValidMessage: "This form is not valid.",
      fields: [],
    } as FormOptions;

    this.gridForm = new DaraForm(document.createElement("div"), gridFormOptions);

    this.mounted();
    this.setDefaultOption();
    this.setDefaultInfo();
  }

  mounted() {
    this.addRow();

    if (this.customFunction.mounted) {
      (this.customFunction.mounted as any).call(this, this.field, this.rowElement);
    }

    this.rowElement.querySelector(".df-grid-add-row-btn")?.addEventListener("click", (evt) => {
      this.addRow();
    });
  }

  static isDataRender(): boolean {
    return false;
  }

  static isChildrenCreate(): boolean {
    return false;
  }

  createField() {
    const field = this.field;

    const fieldContainerElement = this.rowElement.querySelector(".df-field-container") as HTMLElement;

    let theadTemplate = [];
    let colgroupTemplate = [];
    let addBtnTemplate = [];
    addBtnTemplate.push("");

    if (field.children) {
      colgroupTemplate.push("<colgroup>");

      theadTemplate.push("<tr>");

      colgroupTemplate.push(`<col style="width:38px">`);
      theadTemplate.push("<th>");
      if (field.rendererOptions?.disableAddButton !== true) {
        theadTemplate.push(`<button type="button" class="df-btn df-grid-add-row-btn" title="Add"><i class="df-icon df-add-icon"></i></button>`);
      }
      theadTemplate.push("</th>");

      for (const childField of field.children) {
        colgroupTemplate.push(`<col style="width:${childField.style?.width ?? "*"}">`);
        theadTemplate.push(`<th class="df-grid-header">${childField.label}</th>`);
      }
      colgroupTemplate.push("</colgroup>");
      theadTemplate.push("</tr>");
    }

    fieldContainerElement.innerHTML = `
    <div class="df-grid-field">
      ${addBtnTemplate.join("")}
     <div class="df-grid-container ${field.style?.position ?? ""}" style="height:${field.rendererOptions?.height ?? "auto"};">
        <table class="df-grid">${colgroupTemplate.join("")}<thead>${theadTemplate.join("")}</thead><tbody></tbody></table>
     </div>
     </div>
     `;
  }

  /**
   * add row
   */
  addRow(valueItem?: any): void {
    let rowTemplate = [];

    const options = this.daraForm.getOptions();
    const formTemplate = this.gridForm.formTemplate;
    const parentName = this.field.$xssName;

    ++$$idx;
    let addColumns = [];
    rowTemplate.push(`<tr class="df-grid-row">`);

    rowTemplate.push("<td>");
    if (this.field.rendererOptions?.disableRemoveButton !== true) {
      rowTemplate.push(`<button type="button" data-row-idx="${$$idx}" class="df-btn df-grid-row-remove"><i class="df-icon df-remove-icon"></i></button>`);
    }
    rowTemplate.push("</td>");

    for (const childField of this.field.children) {
      let fieldStyle: FieldStyle = resolveFieldStyle(options, childField, null, true);

      let columnField = utils.merge({}, childField) as FormField;

      addColumns.push(columnField);
      columnField.$orgin = childField;
      columnField.name = columnField.name + "_" + $$idx;
      columnField.$xssName = parentName + "_" + utils.getXssFieldName(columnField);

      formTemplate.addRowFieldInfo(columnField);

      rowTemplate.push(`<td id="${columnField.$xssName}"><div class="df-field-container ${columnField.required ? "required" : ""} " style="${fieldStyle.valueStyle}"></div></td>`);
    }
    rowTemplate.push("</tr>");

    this.allAddRowInfo[$$idx] = addColumns;

    const addRowElement = utils.templateToElement(rowTemplate.join(""));

    if (addRowElement) {
      this.rowElement.querySelector("tbody")?.append(addRowElement);

      addRowElement.querySelector(".df-grid-row-remove")?.addEventListener("click", (evt) => {
        this.removeRow(evt);
      });
    }

    valueItem = valueItem ?? {};
    for (let columnField of addColumns) {
      columnField.$instance = new (columnField.$renderType as any)(columnField, addRowElement?.querySelector(`#${columnField.$xssName}`), this.gridForm);

      if (valueItem[columnField.$orgin.name]) {
        columnField.$instance.setValue(valueItem[columnField.$orgin.name]);
      }
    }
  }

  /**
   * remove row
   *
   * @param evt event
   */
  removeRow(evt: Event): void {
    const target = evt.target as Element;

    const rowElement = target.closest("tr");

    if (rowElement) {
      if (rowElement.parentElement?.childElementCount == 1) return;

      let rowIdx = (evt.currentTarget as Element)?.getAttribute("data-row-idx") || "-1";

      this.removeFieldInfo(rowIdx);
      rowElement.remove();
    }
  }

  /**
   *
   * @param rowIdx row index
   */
  removeFieldInfo(rowIdx?: string) {
    let removeFieldArrs = [] as any;
    if (utils.isEmpty(rowIdx)) {
      for (let key in this.allAddRowInfo) {
        removeFieldArrs = removeFieldArrs.concat(this.allAddRowInfo[key]);
      }
      this.allAddRowInfo = {} as NumberKeyMap;
    } else if (rowIdx) {
      const rowIdxNum = parseInt(rowIdx, 10);
      removeFieldArrs = removeFieldArrs.concat(this.allAddRowInfo[rowIdxNum]);
      delete this.allAddRowInfo[rowIdxNum];
    }

    for (let columnField of removeFieldArrs) {
      this.gridForm.getFieldInfoMap().removeFieldInfo(columnField.name);
    }
  }

  allRemoveRow(): void {
    this.rowElement.querySelector("tbody")?.replaceChildren();
    this.removeFieldInfo();
  }

  getValue() {
    if (this.customFunction.getValue) {
      return (this.customFunction.getValue as any).call(this, this.field, this.rowElement);
    }
    let result = [];
    const children = this.field.children;
    const childrenLength = children.length;
    for (let idx in this.allAddRowInfo) {
      const rowColumns = this.allAddRowInfo[idx];

      let rowInfo = {} as any;
      for (let childIdx = 0; childIdx < childrenLength; childIdx++) {
        let childField = children[childIdx];
        rowInfo[childField.name] = this.gridForm.getFieldValue(rowColumns[childIdx].name); // rowColumns[childIdx].$instance.getValue();
      }

      result.push(rowInfo);
    }
    return result;
  }

  setValue(value: any): void {
    this.field.$value = value;

    let valueArr: any[] = [];
    if (utils.isArray(value)) {
      valueArr = value;
    } else {
      if (utils.isPlainObject(value)) {
        valueArr.push(value);
      }
    }

    this.allRemoveRow();

    for (let valueItem of valueArr) {
      this.addRow(valueItem);
    }
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

    const validResult = this.gridForm.validForm();

    if (validResult.length > 0) {
      const firstItem = validResult[0];

      if (firstItem.message) {
        firstItem.message = "[" + this.field.label + "] " + firstItem.message;

        return firstItem;
      }
    }

    return true;
  }

  focus(): void {}
}
