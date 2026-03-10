const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

function stopPreviousNextDevWindows() {
  const projectPath = process.cwd().replace(/\\/g, "\\\\");
  const command = [
    "$projectPath = '" + projectPath + "'",
    "$procs = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*next dev*' -and $_.CommandLine -like \"*$projectPath*\" }",
    "if ($procs) { $procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } }",
  ].join("; ");

  spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command], {
    stdio: "inherit",
  });
}

function removeStaleLock() {
  const lockPath = path.join(process.cwd(), ".next", "dev", "lock");
  if (fs.existsSync(lockPath)) {
    fs.rmSync(lockPath, { force: true });
    console.log("Removed stale Next.js dev lock.");
  }
}

function stopProcessOnPortWindows(port) {
  const command = [
    `$port = ${port}`,
    "$listeners = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue",
    "if ($listeners) {",
    "  $pids = $listeners | Select-Object -ExpandProperty OwningProcess -Unique",
    "  foreach ($procId in $pids) {",
    "    if ($procId -and $procId -ne $PID) {",
    "      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue",
    "      Write-Output \"Stopped process on port ${port}: PID=${procId}\"",
    "    }",
    "  }",
    "}",
  ].join("; ");

  spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command], {
    stdio: "inherit",
  });
}

function startDevServer() {
  const devPort = process.env.PORT || "3002";
  console.log(`Starting Next.js on http://localhost:${devPort}`);

  const nextBin = path.join(process.cwd(), "node_modules", ".bin", "next");
  const child = spawn(nextBin, ["dev", "-p", devPort], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  child.on("close", (code) => {
    process.exit(code ?? 0);
  });
}

if (process.platform === "win32") {
  stopPreviousNextDevWindows();
  stopProcessOnPortWindows(process.env.PORT || "3002");
}

removeStaleLock();
startDevServer();
