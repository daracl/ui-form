export interface Message {
  file?: {
    maxFileSize: string;
    maxFiles: string;
    accept: string;
  };
  required: string;
  fileButton: string;
  selection: string;

  // string
  string: {
    minLength: string;
    maxLength: string;
    between: string;
  };

  // number message
  number: {
    nan: string;
    minimum: string;
    exclusiveMinimum: string;
    maximum: string;
    exclusiveMaximum: string;
    between: string;
    betweenExclusiveMin: string;
    betweenExclusiveMax: string;
    betweenExclusiveMinMax: string;
  };

  // 정규식 메시지
  regexp: {
    mobile: string;
    email: string;
    url: string;
    number: string;
    alpha: string;
    "alpha-num": string;
    variable: string;
    "number-char": string;
    "upper-char": string;
    "upper-char-special": string;
    "upper-char-special-number": string;
  };
}
