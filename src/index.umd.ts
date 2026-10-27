import { DaraForm } from "./DaraForm";

// CDN / <script> 로 단독 사용하는 경우에도 dark 테마가 동작하도록 테마 변수(--dui-*)를 CSS 에 함께 포함한다.
import "@daracl/ui-style/theme-vars.css";
import "../style/daracl.form.scss";

import  "@daracl/datetimepicker/dist/daracl.datetimepicker.min.css";

// 2) 브라우저 전역에 등록 (데모 실행용)
declare global {
  interface Window {
    Daracl?: any;
  }
}

if (typeof window !== "undefined") {
  window.Daracl = window.Daracl || {};
  window.Daracl.form = DaraForm;
}