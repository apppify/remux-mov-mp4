// Simple HTTP server for serving the demo
import { createServer } from "http";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join, extname } from "path";

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

// MIME types for different file extensions
const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "font/otf",
  ".txt": "text/plain",
};

// Default port
const PORT = process.env.PORT || 3000;

// Create the server
const server = createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);

  try {
    // Parse URL path
    let path = req.url;

    // Handle root path
    if (path === "/" || path === "/index.html") {
      path = "/examples/index.html";
    }

    // Prevent directory traversal attacks
    if (path.includes("..")) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    // Handle paths to dist directory when importing from the module
    if (path.startsWith("/dist/")) {
      const filePath = join(projectRoot, path);
      const content = await readFile(filePath);
      const contentType =
        MIME_TYPES[extname(filePath)] || "application/octet-stream";

      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
      return;
    }

    // Handle paths to examples directory
    if (path.startsWith("/examples/")) {
      const filePath = join(projectRoot, path);
      const content = await readFile(filePath);
      const contentType =
        MIME_TYPES[extname(filePath)] || "application/octet-stream";

      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
      return;
    }

    // Default case - file not found
    res.writeHead(404);
    res.end("Not Found");
  } catch (error) {
    console.error("Error serving request:", error);

    // Handle file not found errors
    if (error.code === "ENOENT") {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    // Handle other errors
    res.writeHead(500);
    res.end("Internal Server Error");
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`View the demo at http://localhost:${PORT}/examples/index.html`);
  console.log(`Press Ctrl+C to stop the server`);
});
