import { Message } from "@t/Message";
import { FormField } from "../types/FormField";
import { ValidResult } from "@t/ValidResult";
import { RULES } from "@/constants";
import { unReplace } from "./utils";

let localeMessage: Message = {
  file: {
    maxFileSize: "파일 크기는 {maxFileSize}바이트 이하여야 합니다.",
    maxFiles: "파일은 최대 {maxFiles}개까지 선택할 수 있습니다.",
    accept: "허용된 파일 형식만 선택할 수 있습니다.",
  },
  required: "{label} 필수 입력사항입니다.",
  fileButton: "파일찾기",
  selection: "선택",
  string: {
    minLength: "{minLength} 글자 이상으로 입력하세요.",
    maxLength: "{maxLength} 글자 이하로 입력하세요.",
    between: "{minLength} ~ {maxLength} 사이의 글자를 입력하세요.",
  },
  number: {
    nan: "숫자만 입력 가능 합니다.",
    minimum: "{minimum} 값과 같거나 커야 합니다",
    exclusiveMinimum: "{minimum} 보다 커야 합니다",
    maximum: "{maximum} 값과 같거나 작아야 합니다",
    exclusiveMaximum: "{maximum} 보다 작아야 합니다.",
    between: "{minimum}~{maximum} 사이의 값을 입력하세요.",
    betweenExclusiveMin: "{minimum} 보다 크고 {maximum} 보다 같거나 작아야 합니다",
    betweenExclusiveMax: "{minimum} 보다 같거나 크고 {maximum} 보다 작아야 합니다",
    betweenExclusiveMinMax: "{minimum} 보다 크고 {maximum} 보다 작아야 합니다",
  },
  regexp: {
    mobile: "핸드폰 번호가 유효하지 않습니다.",
    email: "이메일이 유효하지 않습니다.",
    url: "URL이 유효하지 않습니다.",
    alpha: "영문만 입력 가능 합니다.",
    "alpha-num": "영문과 숫자만 입력 가능 합니다.",
    number: "숫자만 입력 가능 합니다.",
    variable: "값이 유효하지 않습니다.",
    "number-char": "숫자, 문자 각각 하나 이상 포함 되어야 합니다.",
    "upper-char": "대문자가 하나 이상 포함 되어야 합니다.",
    "upper-char-special": "대문자,소문자,특수문자 각각 하나 이상 포함 되어야 합니다.",
    "upper-char-special-number": "대문자,소문자,특수문자,숫자 각각 하나 이상 포함 되어야합니다.",
  },
};

/**
 * validation 메시지 처리.
 *
 * @class Language
 * @typedef {Language}
 */
class Language {
  private lang: Message = localeMessage;

  /**
   * 다국어 메시지 등록
   *
   * @public
   * @param {?Message} [lang] 둥록할 메시지
   */
  public set(lang?: Message) {
    this.lang = Object.assign({}, localeMessage, lang);
  }

  /**
   * 메시지 얻기
   *
   * @public
   * @param {string} messageKey 메시지 키
   * @returns {*}
   */
  public getMessage(messageKey: string): any {
    return (this.lang as any)[messageKey];
  }

  /**
   * ValidResult 값을 메시지로 변경.
   *
   * @public
   * @param {FormField} field
   * @param {ValidResult} validResult
   * @returns {string[]}
   */
  public validMessage(field: FormField, validResult: ValidResult): string[] {
    let messageFormat = "";

    let messageFormats: string[] = [];

    if (validResult.regexp) {
      messageFormat = (this.lang.regexp as any)[validResult.regexp];
      messageFormats.push(messageFormat);
    }

    (validResult.constraint ?? []).forEach((constraint) => {
      if (constraint === RULES.REQUIRED) {
        messageFormat = this.lang.required;
        messageFormats.push(messageFormat);
      }

      if (field.renderType === "file") {
        messageFormat = this.lang.file?.[constraint as keyof NonNullable<Message["file"]>] ?? "";
        messageFormats.push(messageFormat);
      } else if (field.renderType == "number" || field.renderType == "range") {
        messageFormat = (this.lang.number as any)[constraint];
        messageFormats.push(messageFormat);
      } else {
        messageFormat = (this.lang.string as any)[constraint];
        messageFormats.push(messageFormat);
      }
    });

    const reMessage: string[] = [];

    const msgParam = Object.assign({}, { name: field.name, label: unReplace(field.label) }, field.rule);
    messageFormats.forEach((msgFormat) => {
      if (msgFormat) {
        reMessage.push(message(msgFormat, msgParam));
      }
    });

    if (validResult.validator) {
      reMessage.push(validResult.validator.message);
    }

    return reMessage;
  }
}

function message(msgFormat: string, msgParam: any): string {
  return msgFormat.replace(/\{{1,1}([A-Za-z0-9_.]*)\}{1,1}/g, (match, key) => {
    return typeof msgParam[key] !== "undefined" ? msgParam[key] : match;
  });
}

export default new Language();
