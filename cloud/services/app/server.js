import http from "node:http";
import pg from "pg";

const { Pool } = pg;
const port = Number(process.env.PORT || 3000);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const server = http.createServer(async (req, res) => {
  res.setHeader("content-type", "application/json; charset=utf-8");

  if (req.url === "/health") {
    try {
      const result = await pool.query("select now() as database_time");
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, service: "mercysoul-cloud-core", database: "ok", database_time: result.rows[0].database_time }));
    } catch (error) {
      res.writeHead(503);
      res.end(JSON.stringify({ ok: false, service: "mercysoul-cloud-core", database: "unavailable" }));
    }
    return;
  }

  if (req.url === "/") {
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, service: "mercysoul-cloud-core", status: "running" }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ ok: false, error: "not_found" }));
});

server.listen(port, () => console.log(JSON.stringify({ event: "server_started", port })));
