import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../site/", import.meta.url));
const port = Number(process.env.CBS_SITE_PORT || 4173);
const host = process.env.CBS_SITE_HOST || "127.0.0.1";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

createServer((request, response) => {
  const pathname = decodeURIComponent(
    new URL(request.url, `http://${request.headers.host}`).pathname,
  );
  const requestedPath =
    pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const absolutePath = normalize(join(root, requestedPath));

  if (
    !absolutePath.startsWith(root) ||
    !existsSync(absolutePath) ||
    !statSync(absolutePath).isFile()
  ) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type":
      contentTypes[extname(absolutePath).toLowerCase()] ||
      "application/octet-stream",
  });
  createReadStream(absolutePath).pipe(response);
}).listen(port, host, () => {
  process.stdout.write(`CBS Mail site available at http://${host}:${port}\n`);
});
