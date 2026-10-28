// managed by ui-common-harness
// Claude Code PostToolUse 훅 : style/ 아래 .scss 를 수정하면 SCSS 진입 파일이 컴파일되는지 곧바로 확인한다.
//  - 컴파일 실패 → stderr 로 알리고 종료 코드 2 (Claude 에게 피드백)
//  - Sass 경고 → 알리기만 하고 통과 (기존 경고 때문에 작업을 막지 않는다)
//  - sass 나 @daracl/ui-style 이 설치되어 있지 않으면 안내만 하고 통과
// 빠른 확인일 뿐이므로 빌드 / 테스트를 대신하지 않는다.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const root = resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd());

let input = {};
try {
  input = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0);
}
const file = input?.tool_input?.file_path;
if (!file) process.exit(0);
const rel = relative(root, resolve(file)).replace(/\\/g, '/');
if (!rel.startsWith('style/') || !rel.endsWith('.scss')) process.exit(0);

// sass : 프로젝트 → 연결된 ui-style 순으로 찾는다.
const candidates = [join(root, 'package.json'), join(root, 'node_modules/@daracl/ui-style/package.json')];
let sass = null;
for (const c of candidates) {
  try {
    if (existsSync(c)) sass = createRequire(c)('sass');
    if (sass) break;
  } catch {
    /* 다음 후보 */
  }
}
if (!sass) {
  console.error('[hook] sass 를 찾지 못해 SCSS 빠른 확인을 건너뜁니다.');
  process.exit(0);
}

// @daracl/ui-style 해석 (package.json exports 의 sass 조건)
const styleRoot = join(root, 'node_modules/@daracl/ui-style');
let styleExports = null;
try {
  styleExports = JSON.parse(readFileSync(join(styleRoot, 'package.json'), 'utf8')).exports;
} catch {
  /* ui-style 을 쓰지 않는 프로젝트이거나 아직 설치되지 않음 */
}
const importers = styleExports
  ? [
      {
        findFileUrl(url) {
          if (!url.startsWith('@daracl/ui-style')) return null;
          const sub = url.slice('@daracl/ui-style'.length);
          const entry = styleExports[sub ? `.${sub}` : '.'];
          return entry?.sass ? pathToFileURL(resolve(styleRoot, entry.sass)) : null;
        },
      },
    ]
  : [];

const styleDir = join(root, 'style');
const entries = readdirSync(styleDir).filter((f) => f.endsWith('.scss') && !f.startsWith('_'));
const warnings = [];
for (const entry of entries) {
  try {
    sass.compile(join(styleDir, entry), { importers, loadPaths: [join(root, 'node_modules')], logger: { warn: (m) => warnings.push(m.split('\n')[0]), debug: () => {} } });
  } catch (e) {
    console.error(`[hook] ${rel} 수정 후 style/${entry} 컴파일 실패\n${String(e.message).split('\n').slice(0, 8).join('\n')}`);
    process.exit(2);
  }
}
if (warnings.length) console.error(`[hook] Sass 경고 ${warnings.length}건 (참고): ${[...new Set(warnings)].slice(0, 3).join(' / ')}`);
process.exit(0);
