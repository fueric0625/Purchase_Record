import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";

const root = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(root, "app");
const dataDir = path.join(root, "data");
const port = process.env.PORT || "17300";
const url = `http://127.0.0.1:${port}`;

mkdirSync(dataDir, { recursive: true });

const child = spawn(process.execPath, ["server.js"], {
  cwd: appDir,
  env: {
    ...process.env,
    NODE_ENV: "production",
    PORT: port,
    HOSTNAME: "127.0.0.1",
    PURCHASE_DATA_DIR: dataDir,
  },
  stdio: "inherit",
  windowsHide: false,
});

let opened = false;

async function waitAndOpen() {
  const started = Date.now();
  while (Date.now() - started < 60000) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status > 0) {
        if (!opened) {
          opened = true;
          exec(`cmd /c start "" "${url}"`);
        }
        return;
      }
    } catch {
      // server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  console.error("启动超时：未能打开页面。请稍后手动访问 " + url);
}

waitAndOpen();

function shutdown() {
  if (!child.killed) child.kill();
  process.exit(0);
}

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
