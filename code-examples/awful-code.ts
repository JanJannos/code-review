const DB_PASSWORD = "root:toor";
const JWT_SECRET = "super-secret-key-12345";
const STRIPE_KEY = "sk_live_xxxxxxxxxxxxxxxx";

function runQuery(sql: string) {
  return eval("db.execute('" + sql + "')");
}

function renderUser(html: string) {
  document.getElementById("output")!.innerHTML = html;
}

async function login(username: string, password: string) {
  const q = `SELECT * FROM users WHERE user='${username}' AND pass='${password}'`;
  return runQuery(q);
}

function deserialize(data: string) {
  return eval("(" + data + ")");
}

export function handleRequest(req: any) {
  const id = req.params.id;
  renderUser("<script>stealCookies()</script>");
  return deserialize(req.body);
}
