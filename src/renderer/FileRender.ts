import { FileInfo, FormField } from "@t/FormField";
import { Render } from "./Render";
import { resetRowElementStyleClass, invalidMessage } from "@/util/validUtils";
import { fileValidator } from "@/rule/fileValidator";
import Language from "@/util/Language";
import { customChangeEventCall } from "@/event/renderEvents";
import { DaraForm } from "@/DaraForm";
import { isArray } from "@daracl/core";

export default class FileRender extends Render {
  private element: HTMLInputElement;
  private removeIds: any[] = [];
  private uploadFiles: any = {};
  private fileList: any[] = [];
  private fileSeq = 0;

  constructor(field: FormField, rowElement: HTMLElement, daraForm: DaraForm) {
    super(daraForm, field, rowElement);

    this.element = rowElement.querySelector(`[name="${field.$xssName}"]`) as HTMLInputElement;
    this.fileList = field.listItem?.list || [];
    this.mounted();
    this.setDefaultOption();
  }

  mounted() {
    this.element.addEventListener("change", (e: Event) => {
      const files = (e.target as HTMLInputElement)?.files;

      if (files) {
        let fileList = [];
        for (let item of files) {
          fileList.push(item);
        }
        this.addFiles(fileList);
      }
      customChangeEventCall(this.field, e, this, this.fileList);
      this.valid();
    });

    this.fileList.forEach((file) => {
      file.$seq = this.fileSeq += 1;
    });

    this.setFileList(this.fileList);
  }

  createField() {
    const field = this.field;

    const fieldContainerElement = this.rowElement.querySelector(".df-field-container") as HTMLElement;

    fieldContainerElement.innerHTML = `
    <div class="df-field">
      <span class="df-file-wrapper">
        <label class="df-file-label">
          <input type="file" name="${field.$xssName}" class="df-form-field df-file" multiple />
          ${Language.getMessage("fileButton")}
        </label>
        <i class="df-form-icon df-help-icon"></i>
      </span>
    </div>
    ${Render.getDescriptionTemplate(field)}
    <div class="df-file-list"></div>
    <div class="df-help-message"></div>
    `;

    this.element = fieldContainerElement.querySelector(`[name="${field.$xssName}"]`) as HTMLInputElement;
  }

  addFiles(files: any[]) {
    let addFlag = false;

    const newFiles: FileInfo[] = [];

    for (let item of files) {
      const fileCheckList = this.fileList.filter((fileItem) => fileItem.fileName == item.name && fileItem.fileSize == item.size && fileItem.lastModified == item.lastModified);

      if (fileCheckList.length > 0) continue;
      this.fileSeq += 1;
      this.uploadFiles[this.fileSeq] = item;

      let newFileInfo = {
        fileName: item.name,
        $seq: this.fileSeq,
        fileSize: item.size,
        lastModified: item.lastModified,
      } as FileInfo;

      newFiles.push(newFileInfo);
      addFlag = true;
    }
    if (addFlag) {
      this.setFileList(newFiles);
      this.fileList.push(...newFiles);
    }
  }

  private setFileList(fileList: FileInfo[], initFlag?: boolean | undefined) {
    const fileListElement = this.rowElement.querySelector(".df-file-list");

    if (fileListElement) {
      if (initFlag === true) {
        fileListElement.innerHTML = "";
      }

      const fileTemplateHtml: string[] = [];

      fileList.forEach((file) => {
        fileTemplateHtml.push(`
        <div class="df-file-item" data-seq="${file.$seq}">
          ${file.fileId ? '<span class="df-file-icon df-file-download"></span>' : '<span class="df-file-icon"></span>'} <span class="df-file-icon df-file-remove"></span>
          <span class="df-file-name">${file.fileName}</span > 
        </div>`);
      });

      fileListElement.insertAdjacentHTML("beforeend", fileTemplateHtml.join(""));

      fileList.forEach((item) => {
        this.removeFileEvent(item, fileListElement);
        this.downloadFileEvent(item, fileListElement);
      });
    }
  }

  /**
   * 파일 다운로드 이벤트 처리.
   *
   * @param item
   * @param fileListElement
   */
  private downloadFileEvent(item: FileInfo, fileListElement: Element) {
    const ele = fileListElement.querySelector(`[data-seq="${item.$seq}"] .df-file-download`);
    if (ele) {
      ele.addEventListener("click", (evt: Event) => {
        const fileItemElement = (evt.target as Element).closest(".df-file-item");

        if (fileItemElement) {
          const attrSeq = fileItemElement.getAttribute("data-seq");
          if (attrSeq) {
            const seq = parseInt(attrSeq, 10);
            const idx = this.fileList.findIndex((v) => v.$seq === seq);

            const item = this.fileList[idx];

            if (item["url"]) {
              location.href = item["url"];
              return;
            }

            if (this.field.fileDownload) {
              this.field.fileDownload.call(null, { file: item, field: this.field });
              return;
            }
          }
        }
      });
    }
  }

  /**
   * 파일 삭제  처리.
   *
   * @param item
   * @param fileListElement
   */
  private removeFileEvent(item: FileInfo, fileListElement: Element) {
    const ele = fileListElement.querySelector(`[data-seq="${item.$seq}"] .df-file-remove`);
    if (ele) {
      ele.addEventListener("click", (evt: Event) => {
        const fileItemElement = (evt.target as Element).closest(".df-file-item");

        if (fileItemElement) {
          const attrSeq = fileItemElement.getAttribute("data-seq");
          if (attrSeq) {
            const seq = parseInt(attrSeq, 10);
            const removeIdx = this.fileList.findIndex((v) => v.$seq === seq);

            const removeItem = this.fileList[removeIdx];

            this.fileList.splice(removeIdx, 1);
            delete this.uploadFiles[seq];
            fileItemElement.remove();

            if (removeItem.fileId) {
              this.removeIds.push(removeItem.fileId);
            }
          }
        }
        this.valid();
      });
    }
  }

  getValue() {
    return {
      uploadFile: Object.values(this.uploadFiles),
      removeIds: this.removeIds,
    };
  }

  public setValueItems(value: any): void {
    this.fileList = [];
    this.uploadFiles = [];
    this.removeIds = [];
    for (let file of value) {
      file.$seq = this.fileSeq += 1;

      this.fileList.push(file);
    }

    this.setFileList(this.fileList, true);
  }

  setValue(value: any): void {
    if (isArray(value)) {
      this.setValueItems(value);
    }
    this.element.value = "";
  }

  reset() {
    this.setValue("");
    this.setValueItems([]);
    resetRowElementStyleClass(this.rowElement);
  }

  getElement(): HTMLInputElement {
    return this.element;
  }

  valid(): any {
    const validResult = fileValidator(this.element, this.field, this.fileList);

    invalidMessage(this.field, this.rowElement, validResult);

    return validResult;
  }
}
