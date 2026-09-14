import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseRoot = path.join(root, "release");
const releaseName = "PurchaseArchive";
const releaseDir = path.join(releaseRoot, releaseName);
const standaloneRoot = path.join(root, ".next", "standalone");

function log(message) {
  console.log(`[pack] ${message}`);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed`);
  }
}

function findStandaloneDir(dir) {
  if (existsSync(path.join(dir, "server.js"))) return dir;
  if (!existsSync(dir)) {
    throw new Error("未找到 .next/standalone，请先确认 next build 已成功。");
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const nested = path.join(dir, entry.name);
    if (existsSync(path.join(nested, "server.js"))) return nested;
  }
  throw new Error("standalone 目录中没有 server.js");
}

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      try {
        copyFileSync(from, to);
      } catch (error) {
        if (String(entry.name).endsWith(".node")) {
          log(`跳过无法复制的原生文件：${entry.name}`);
          continue;
        }
        throw error;
      }
    }
  }
}

function copyIfExists(from, to) {
  if (!existsSync(from)) return false;
  if (statSync(from).isDirectory()) copyDir(from, to);
  else {
    mkdirSync(path.dirname(to), { recursive: true });
    copyFileSync(from, to);
  }
  return true;
}

log("开始生产构建…");
if (!process.argv.includes("--skip-build")) {
  run("npm", ["run", "build"]);
} else {
  log("跳过构建（--skip-build）");
}

if (existsSync(releaseRoot)) {
  log("清理旧的发布目录…");
  for (const name of readdirSync(releaseRoot)) {
    const target = path.join(releaseRoot, name);
    try {
      rmSync(target, { recursive: true, force: true });
    } catch (error) {
      log(`无法删除 ${name}，已跳过（文件可能正在使用）`);
    }
  }
}
mkdirSync(releaseRoot, { recursive: true });
if (existsSync(releaseDir)) {
  rmSync(releaseDir, { recursive: true, force: true });
}

const standaloneDir = findStandaloneDir(standaloneRoot);
const appDir = path.join(releaseDir, "app");
mkdirSync(releaseDir, { recursive: true });
mkdirSync(path.join(releaseDir, "runtime"), { recursive: true });

log("复制程序文件…");
copyDir(standaloneDir, appDir);
if (!existsSync(path.join(appDir, "server.js"))) {
  throw new Error("复制后未找到 app/server.js");
}
log("程序文件已复制");
copyIfExists(path.join(root, ".next", "static"), path.join(appDir, ".next", "static"));
copyIfExists(path.join(root, "public"), path.join(appDir, "public"));

const docxSrc = path.join(root, "node_modules", "docx");
const docxDest = path.join(appDir, "node_modules", "docx");
if (existsSync(docxSrc)) {
  log("补充 docx 依赖…");
  copyDir(docxSrc, docxDest);
}

log("复制 Node 运行时…");
copyFileSync(process.execPath, path.join(releaseDir, "runtime", "node.exe"));

copyFileSync(
  path.join(root, "scripts", "launcher.mjs"),
  path.join(releaseDir, "launcher.mjs"),
);

if (existsSync(path.join(root, "data"))) {
  log("复制现有采购数据…");
  copyDir(path.join(root, "data"), path.join(releaseDir, "data"));
} else {
  mkdirSync(path.join(releaseDir, "data"), { recursive: true });
}

writeFileSync(
  path.join(releaseDir, "Start.bat"),
  `@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Purchase Archive
echo.
echo   Starting Purchase Archive...
echo   The browser will open automatically.
echo   Close this window to quit.
echo.
"%~dp0runtime\\node.exe" "%~dp0launcher.mjs"
pause
`,
  "utf8",
);

writeFileSync(
  path.join(releaseDir, "StartHidden.vbs"),
  [
    "Set objFSO = CreateObject(\"Scripting.FileSystemObject\")",
    "Set objShell = CreateObject(\"WScript.Shell\")",
    "strRoot = objFSO.GetParentFolderName(WScript.ScriptFullName)",
    "objShell.CurrentDirectory = strRoot",
    "strNode = strRoot & \"\\runtime\\node.exe\"",
    "strApp = strRoot & \"\\launcher.mjs\"",
    "strCmd = Chr(34) & strNode & Chr(34) & \" \" & Chr(34) & strApp & Chr(34)",
    "objShell.Run strCmd, 0, False",
    "",
  ].join("\r\n"),
  "ascii",
);

writeFileSync(
  path.join(releaseDir, "Readme.txt"),
  `Purchase Archive
===============

How to start
1. Copy the whole PurchaseArchive folder anywhere (USB drive or another PC).
2. Double-click Start.bat.
3. Wait a few seconds; the browser opens http://127.0.0.1:17300
4. Close the black window when you are done.

To start without a console window, double-click StartHidden.vbs.
To quit the hidden mode, end node.exe in Task Manager, or run Start.bat and close that window.

Requirements
Windows 10 / 11. No Node.js, Python, or other runtime install is needed.

Where data is stored
  data\\records.json     all book records
  data\\uploads\\        photos, invoices, and Word files

Copy the whole folder to back up. Do not send only the bat/vbs files without data.
`,
  "utf8",
);

log(`完成：${releaseDir}`);
log("把该文件夹整个发给别人即可，双击 Start.bat 使用。");
