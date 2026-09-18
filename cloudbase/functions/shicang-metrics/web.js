const http = require("http");
const { main } = require("./index");

http.createServer((request, response) => {
  let body = "";
  request.on("data", chunk => { if (body.length < 20000) body += chunk; });
  request.on("end", async () => {
    const result = await main({ httpMethod: request.method, body });
    response.writeHead(result.statusCode || 200, result.headers || {});
    response.end(result.body || "");
  });
}).listen(9000, "0.0.0.0");
