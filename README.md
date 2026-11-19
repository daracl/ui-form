# DaraForm
JavaScript form creation library

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/darainfo/daracl.form/blob/main/LICENSE)
[![npm version](https://badge.fury.io/js/@daracl%2Fform.svg)](https://badge.fury.io/js/@daracl%2Fform)
[![npm](https://img.shields.io/npm/d18m/%40daracl%2Fform)](https://github.com/darainfo/daracl.form/releases)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/@daracl%2Fform)](https://bundlephobia.com/package/@daracl%2Fform)



## Browser Support

![Chrome](https://raw.github.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png) | ![Firefox](https://raw.github.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png) | ![Safari](https://raw.github.com/alrra/browser-logos/master/src/safari/safari_48x48.png) | ![Opera](https://raw.github.com/alrra/browser-logos/master/src/opera/opera_48x48.png) | ![Edge](https://raw.github.com/alrra/browser-logos/master/src/edge/edge_48x48.png)  
--- | --- | --- | --- | --- |  
Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ |  


<p>
<img src="https://github.com/darainfo/daracl.form/blob/main/demo.gif?raw=true"/>
</p>


## Development

Install Node.js 24 LTS and npm. With nvm, run `nvm use` first.

```sh
git clone https://github.com/daracl/ui-form.git
cd ui-form
npm ci
npm run dev
```

Open the address printed by Vite at `/uitest/index.html`. `npm start` starts the same server.

- `npm run typecheck`: TypeScript checks
- `npm test`: shared utility regression tests
- `npm run build`: ES/CJS, UMD, CSS and declarations
- `npm run verify`: type checks, Node tests, builds and package smoke tests

Browser regression tests cover the six examples and form interactions. Run `npx playwright install chromium` once, then `npm run verify` followed by `npm run pwtest` (the browser suite also checks the generated dist bundles). To use an already installed Edge instead, set `PLAYWRIGHT_CHANNEL=msedge` in your shell. CI runs both `verify` and browser tests. Browser tests start and stop their own server; no manually running dev server is needed.

Build configuration is ESM (`vite.config.mjs`). `npm run build` uses one Node process for Vite, generates declarations in parallel, cleans `dist` once and copies public assets once. ES/CJS, UMD, CSS and sourcemap filenames stay unchanged. `npm run build:escjs` and `npm run build:umd` only refresh their own bundles; use the full build for packaging.

The dev/preview server binds to the local machine by default and restricts file access to this checkout. Use `npm run dev -- --host` only when LAN access is intentional. Host validation and Vite's default CORS restrictions remain enabled.

`npm run audit:security` checks production dependencies; `npm run audit:security:all` includes development tools. esbuild is overridden to the patched version for toast's unused build-tool dependency too. Removed unused Webpack loaders, cpx, TSLint, Jest and legacy documentation dependencies. Tests use Node's built-in test runner; file operations use Node's filesystem APIs.

See [build verification results](BUILD.md) for timing, security checks and compatibility limits.

Shared utilities use the public npm package `@daracl/core@0.0.12`. No sibling corejs checkout, absolute path, npm link or private server is required. Commit package.json and package-lock.json together; teammates install with `npm ci`. Publish corejs changes before updating this dependency. Utilities import the public `@daracl/core/utils` entry point, which avoids loading the core root module and its styles.

The npm override unifies core at 0.0.12 because the current toast and datetimepicker packages declare older core peer ranges. Recheck their compatibility when upgrading. Overrides apply to this repository; consumers of the published form package may need the same override until those peer ranges are updated upstream.

Type checks, blank checks, own-property checks, deep merges, HTML escaping, template-to-element conversion and CSS class whitespace normalization delegate to core. `replaceXss` and `unReplace` alias core's `xss` and `unXss`; form-specific field-name transformations stay here. `isEmpty` still means null/undefined only; numeric checks preserve existing coercion. Merge returns a new object and follows core array merging rules while excluding prototype pollution keys.


# 사용방법
```
const form = new DaraForm("#loginForm", {
    message: "This value is not valid",
     style: {
      position: 'top-left',
      labelWidth: '3'

    },
    // form load 이후 호출. 
    onMounted: function () {
      console.log(this)
    },
    message: {
      empty: "{name} 필수 입력사항입니다.",
      string: {
        minLength: "{size} 글자 이상 입력해야합니다.",
        maxLength: "{size} 글자 이상 입력할 수 없습니다.",
      },
      number: {
        minimum: "{size} 보다 커야 합니다",
        miximum: "{size} 보다 커야 합니다",
      },
      regexp: {
        email: "이메일이 유효하지 않습니다.",
        url: "URL이 유효하지 않습니다.",
      },
    },
    fields: [
      {
        name: "uid",
        label: "아이디",
        tooltip: "아이디를 넣어주세요.",
        placeholder: "아이디를 넣어주세요.",
        renderType: "text",
      }
      , {
        name: "password",
        label: "패스워드",
        description: "비밀번호는 대문자 소문자 포함입니다.",
        placeholder: "패스워드를 입력하세요",
        renderType: "password",
      }
    ]
  });
```
  

# Form 옵션
| key | 설명 | 기본값 | 옵션값 |
|-----|------|-----|-----|
| style |  width: form 넓이<br> labelWidth : label 넓이 <br> valueWidth : value width<br> position : '"[label위치]"-[글자 정렬위치]' <br> -- ex) 'top-left','left-right' |  width: "100%" <br>  labelWidth: 3<br> valueWidth: 9<br> position: "left-right" | position : top,left,right - left,center,right |
| autoFocus |  포커스 여부 |  true | true , false |
| notValidMessage |   폼 유효하지 않을때 메시지 |   'This value is not valid'  | |
| onMounted |  폼 로드후 이벤트 |  |  |
| fields |  폼필드 [설명](#field-option) | | |
| message |  폼 유효성 체크 메시지 [설명](#form-message) |  | 
| useTypeValue | form에 값을 renderer type별로 값을 구 할지 여부. renderType tab 값을 구할때 영향이 있음 |  | 


# Form message
```javascript
required:  '{name} 필수 입력사항입니다.'
string: {
  minLength: '{size} 글자 이상 입력해야합니다.'
  maxLength: '{size} 글자 이상 입력할 수 없습니다.'
};
number: {
  min: '{size} 보다 커야 합니다'
  max: '{size} 보다 커야 합니다'
};
type: {
  message: '{type} 유효하지 않습니다.'
};
```

# Field Option

## 파일 필드 값과 옵션

`getValue()`의 파일 필드는 `{필드명}: File[]`와 `{필드명}RemoveIds: (string | number)[]`로 반환됩니다. 예를 들어 `attachments` 필드에서 새 파일 하나를 선택하고 기존 파일 ID `7`을 삭제했다면 `{ attachments: [file], attachmentsRemoveIds: [7] }`입니다. 접미사는 `FILE_REMOVE_IDS_SUFFIX`로 내보냅니다. `getFormDataValue()`는 새 파일과 삭제 ID를 각각 반복 항목으로 추가합니다.

파일 필드의 `rule`에는 `maxFileSize`(바이트), `maxFiles`(새 파일 개수), `accept`(예: `['.png', '.jpg']`)를 지정할 수 있습니다. 검증은 새로 선택한 파일에만 적용되고, `accept`는 파일 입력에도 반영됩니다. `rendererOptions`에는 `buttonLabel`, `multiple`(기본 `true`), `accept`, `downloadable`(기본 `true`), `allowDuplicate`(기본 `false`), `onRemove(file)`, `sizeUnit`(기본 `"mb"`)을 지정할 수 있습니다. `onRemove`가 `false`를 반환하면 삭제를 취소합니다. 기존 파일의 ID와 이름은 `listItem.valueField`, `listItem.labelField`로 매핑할 수 있습니다.

파일 크기는 바이트 단위의 `fileSize`를 `rendererOptions.sizeUnit`으로 변환해 표시합니다. 단위는 `"b"`, `"kb"`, `"mb"`, `"gb"`를 지원하며 1 KB는 1024바이트입니다. 예: `rendererOptions: { sizeUnit: "kb" }`. 크기 값이 없는 기존 파일은 크기 표시를 생략합니다.

`getValue()`와 `getFormDataValue()`는 조건이 거짓인 필드와 숨겨진 그룹의 자식 필드를 제외합니다. `conditional.show: false`는 조건이 참일 때 숨깁니다. `description`, `tooltip`, 선택지 문구 및 검증 메시지는 HTML을 실행하지 않고 텍스트로 표시합니다. 파일 항목의 `url`은 같은 출처의 HTTP(S) 주소만 직접 열며, 그 밖의 주소는 `fileDownload` 콜백으로 처리할 수 있습니다.
| key | 설명 | 기본값 | 옵션값 |
|-----|------|-----|-----|
| name |  field name |   |  |
| label |  label |   |  |
| tooltip |  툴팁문구 |   |  |
| disabled |  비활성화 여부 |   |  |
| placeholder |  placeholder |   |  |
| orientation |  차식 field 가 있을경우 방향 | vertical  | horizontal, vertical |
| required |  필수 여부 |   |  |
| regexpType |  정규식 타입 |   | email, url, alpha, alpha-num |
| template | custom value 템플릿 |   |  |
| listItem |  dropdown, radio, checkbox 옵션값 |   |  |
| description |  설명 | labelField: label key <br> valueField: value key<br>  list: 옵션 리스트<br>
  orientation: 방향  |  |
| children | 자식 field 리스트 |   |  |
| onChange | 입력값 변경시 호출되는 메소드 |   |  |
| onClick | button 타입 클릭 이벤트 |   |  |
| fileDownload | file 타입일경우 다운로드 메소드 |   |  |
| renderer | custom renderer |   |  |
| conditional | 보이기 여부 조건 | show: 보이기 여부 <br/>  field: field name <br> eq: 비교 값 <br> custom: custom 체크 메소드   |  |
| renderType |  render type  | text  | number, text, file, textarea, dropdown, radio, checkbox, date(dara-datetimepicker모듈 사용), group, custom |
| rendererOptions |  date 타입등의 추가 module에서 사용하는 추가 옵션 |   |  |
| style |  width: field 넓이<br> labelHide : label 숨김여부 <br> labelWidth : label 넓이<br>  customClass : custom class <br> valueWidth : value width <br> tabAlign : render type이 tab일 경우 정렬 <br> position : '"[label위치]"-[글자 정렬위치]' <br> -- ex) 'top-left','left-right' |  width: "100%" <br>  labelWidth: 3<br> valueWidth: 9<br> position: "left-right" | position : top,left,right - left,center,right <br> tabAlign:left, center, right|
| rule |  유효성 규칙 | minLength: 최소 길이 <br>  maxLength: 최대길이<br> minimum: 최소값 <br>    exclusiveMinimum: 최소값 포함 여부 <br> maximum: 최대값 <br>exclusiveMaximum: 최대값 포함여부 |  |
| different | field 값이 다른지 비교 | field: field name <br> message: 메시지   |  |
| identical | field 값이 같은지 비교 | field: field name <br> message: 메시지   |  |


# 테마

색상 값은 [`@daracl/ui-style`](https://www.npmjs.com/package/@daracl/ui-style) 의 테마 변수(`--dui-*`)를 사용합니다.
light 값이 기본값으로 들어 있어 별도 설정 없이도 표시되지만, **dark 테마를 쓰려면 테마 변수 CSS 를 함께 로드**해야 합니다.
(`daracl.form.umd` 와 함께 쓰는 CSS 에는 이미 포함되어 있습니다.)

```js
import '@daracl/ui-style/theme-vars.css';

// dark 로 전환
document.documentElement.setAttribute('data-daracl-theme', 'dark');
```

> 이전 버전의 `body.dark` / `.daracl-form.dark` 클래스 방식은 지원하지 않습니다. `data-daracl-theme` 속성만 사용합니다.

## Custom templates

`renderType: "custom"` displays `template` as plain text by default. To render HTML that you control, set `trustedTemplate: true`:

```js
{ name: "summary", label: "Summary", renderType: "custom", template: "<strong>Ready</strong>", trustedTemplate: true }
```

Only use `trustedTemplate` with trusted HTML. Escape or sanitize any data inserted into that HTML. When upgrading from earlier versions, add this option to custom fields that intentionally render HTML.

## License
Darainfo is under [MIT License](./LICENSE).
