import { FileInfo, FileRendererOptions, FormField } from "@t/FormField";
import { Render } from "./Render";
import { resetRowElementStyleClass, invalidMessage } from "@/util/validUtils";
import { fileValidator } from "@/rule/fileValidator";
import Language from "@/util/Language";
import { customChangeEventCall } from "@/event/renderEvents";
import { DaraForm } from "@/DaraForm";
import { isArray } from "@daracl/core/utils";

export default class FileRender extends Render {
  private element: HTMLInputElement;
  private removeIds: Array<string | number> = [];
  private uploadFiles: Record<number, File> = {};
  private fileList: FileInfo[] = [];
  private fileSeq = 0;
  private disabled = false;

  private get fileOptions(): FileRendererOptions {
    const options = (this.field.rendererOptions as FileRendererOptions | undefined) ?? {};
    return {
      buttonLabel: options.buttonLabel ?? this.field.buttonLabel,
      multiple: options.multiple ?? this.field.multiple,
      accept: options.accept ?? this.field.accept,
      downloadable: options.downloadable ?? this.field.downloadable,
      allowDuplicate: options.allowDuplicate ?? this.field.allowDuplicate,
      onRemove: options.onRemove ?? this.field.onRemove,
    };
  }

  private get fileIdKey(): string {
    return this.field.listItem?.valueField ?? "fileId";
  }

  private get fileNameKey(): string {
    return this.field.listItem?.labelField ?? "fileName";
  }

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
        this.element.value = "";
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
          <input type="file" name="${field.$xssName}" class="df-form-field df-file" />
          <span class="df-file-button-text"></span>
        </label>
        <i class="df-form-icon df-help-icon"></i>
      </span>
    </div>
    ${Render.getDescriptionTemplate(field)}
    <div class="df-file-list"></div>
    <div class="df-help-message"></div>
    `;

    this.element = fieldContainerElement.querySelector(`[name="${field.$xssName}"]`) as HTMLInputElement;
    const options = this.fileOptions;
    this.element.multiple = options.multiple !== false;
    const accept = options.accept ?? field.rule?.accept;
    if (accept?.length) this.element.accept = accept.map((ext) => ext.startsWith(".") ? ext : `.${ext}`).join(",");
    const label = fieldContainerElement.querySelector(".df-file-button-text");
    if (label) label.textContent = options.buttonLabel ?? Language.getMessage("fileButton");
  }

  addFiles(files: any[]) {
    if (this.disabled) return;
    let addFlag = false;

    const newFiles: FileInfo[] = [];

    for (let item of files) {
      const fileCheckList = this.fileOptions.allowDuplicate ? [] : this.fileList.filter((fileItem) => fileItem[this.fileNameKey] === item.name && fileItem.fileSize === item.size);

      if (fileCheckList.length > 0) continue;
      this.fileSeq += 1;
      this.uploadFiles[this.fileSeq] = item;

      let newFileInfo = {
        fileName: item.name,
        [this.fileNameKey]: item.name,
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
        fileListElement.replaceChildren();
      }
      fileList.forEach((file) => {
        const row = document.createElement("div");
        row.className = "df-file-item";
        row.dataset.seq = String(file.$seq);
        const download = document.createElement("span");
        const canDownload = this.fileOptions.downloadable !== false && (file[this.fileIdKey] !== undefined && file[this.fileIdKey] !== null || Boolean(file.url));
        download.className = `df-file-icon ${canDownload ? "df-file-download" : "df-empty-icon"}`;
        const remove = document.createElement("span");
        remove.className = "df-file-icon df-file-remove";
        const name = document.createElement("span");
        name.className = "df-file-name";
        name.textContent = String(file[this.fileNameKey] ?? file.fileName ?? "");
        row.append(download, remove, name);
        fileListElement.append(row);
      });

      fileList.forEach((item) => {
        this.removeFileEvent(item, fileListElement);
        this.downloadFileEvent(item, fileListElement);
      });
      this.updateDisabledView();
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

            if (item.url) {
              location.href = item.url;
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
        if (this.disabled) return;
        const fileItemElement = (evt.target as Element).closest(".df-file-item");

        if (fileItemElement) {
          const attrSeq = fileItemElement.getAttribute("data-seq");
          if (attrSeq) {
            const seq = parseInt(attrSeq, 10);
            const removeIdx = this.fileList.findIndex((v) => v.$seq === seq);

            const removeItem = this.fileList[removeIdx];
            if (!removeItem || (this.field.onRemove ?? this.fileOptions.onRemove)?.(removeItem) === false) return;

            this.fileList.splice(removeIdx, 1);
            delete this.uploadFiles[seq];
            fileItemElement.remove();

            const fileId = removeItem[this.fileIdKey];
            if (typeof fileId === "string" || typeof fileId === "number") {
              this.removeIds.push(fileId);
            }
            customChangeEventCall(this.field, evt, this, this.getValue());
          }
        }
        this.valid();
      });
    }
  }

  getValue() {
    return {
      uploadFile: Object.values(this.uploadFiles),
      removeIds: [...this.removeIds],
    };
  }

  public setValueItems(value: any): void {
    this.fileList = [];
    this.uploadFiles = {};
    this.removeIds = [];
    for (let file of value) {
      this.fileList.push({ ...file, $seq: this.fileSeq += 1 });
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
    this.element.value = "";
    this.setValueItems([]);
    resetRowElementStyleClass(this.rowElement);
  }

  getElement(): HTMLInputElement {
    return this.element;
  }

  valid(): any {
    const validResult = fileValidator(this.element, this.field, this.fileList, Object.values(this.uploadFiles));

    invalidMessage(this.field, this.rowElement, validResult);

    return validResult;
  }

  public setDisabled(flag: boolean): void {
    this.disabled = flag;
    this.element.disabled = flag;
    this.updateDisabledView();
  }

  private updateDisabledView(): void {
    this.rowElement.querySelector(".df-file-label")?.classList.toggle("df-file-disabled", this.disabled);
    this.rowElement.querySelectorAll<HTMLElement>(".df-file-remove").forEach((element) => {
      element.hidden = this.disabled;
    });
  }
}
