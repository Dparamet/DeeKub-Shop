import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";

const root = fileURLToPath(new URL("../", import.meta.url));
dotenv.config({ path: path.join(root, ".env"), override: true, quiet: true });
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (publicKey) {
  let permitted = publicKey.startsWith("sb_publishable_");
  if (!permitted) {
    try {
      permitted =
        JSON.parse(Buffer.from(publicKey.split(".")[1], "base64url").toString())
          .role === "anon";
    } catch {
      /* Invalid key. */
    }
  }
  if (!permitted) {
    console.error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ต้องเป็น publishable หรือ anon เท่านั้น",
    );
    process.exit(1);
  }
}
const action = process.argv[2];
const apiDir = path.join(root, "apps", "api");
const webDir = path.join(root, "apps", "web");
process.env.GOCACHE ||= path.join(apiDir, ".cache", "go-build");
const children = new Set();
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (process.platform === "win32" && child.pid) {
      spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        windowsHide: true,
        stdio: "ignore",
      });
    } else child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 500);
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());

function run(command, args, cwd, env = process.env, service = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: "inherit",
      windowsHide: true,
    });
    children.add(child);
    child.on("error", (error) => {
      children.delete(child);
      reject(error);
    });
    child.on("exit", (code) => {
      children.delete(child);
      if (service && !stopping) stop(code || 0);
      if (code === 0 || stopping) resolve();
      else reject(new Error(`${command} exited (${code})`));
    });
  });
}
async function api() {
  if (!process.env.DATABASE_URL?.trim())
    throw new Error("ใส่ DATABASE_URL ใน .env ที่โฟลเดอร์หลักก่อน");
  mkdirSync(path.join(apiDir, ".cache"), { recursive: true });
  const executable = path.join(
    apiDir,
    ".cache",
    process.platform === "win32" ? "server.exe" : "server",
  );
  await run(
    "go",
    ["build", "-buildvcs=false", "-o", executable, "./cmd/server"],
    apiDir,
  );
  return run(executable, [], apiDir, process.env, true);
}
function web(command) {
  const args = [
    path.join(root, "node_modules", "next", "dist", "bin", "next"),
    command,
  ];
  if (command === "dev" || command === "start")
    args.push("--port", process.env.WEB_PORT || "3000");
  const webEnv = { ...process.env, PORT: process.env.WEB_PORT || "3000" };
  delete webEnv.DATABASE_URL;
  return run(
    process.execPath,
    args,
    webDir,
    webEnv,
    command !== "build",
  );
}
try {
  switch (action) {
    case "dev":
      await Promise.all([api(), web("dev")]);
      break;
    case "dev:api":
      await api();
      break;
    case "dev:web":
      await web("dev");
      break;
    case "db:migrate":
      await run("go", ["run", "-buildvcs=false", "./cmd/migrate"], apiDir);
      break;
    case "admin:grant":
      await run(
        "go",
        ["run", "-buildvcs=false", "./cmd/admin", ...process.argv.slice(3)],
        apiDir,
      );
      break;
    case "build":
      await web("build");
      break;
    case "start":
      await web("start");
      break;
    default:
      throw new Error(`Unknown command: ${action}`);
  }
} catch (error) {
  console.error(error.message);
  stop(1);
}
