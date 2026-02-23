const API_KEY = "sk-live-abc123secret456";
const password = "admin123";

function doStuff(x: any, y: any) {
  return x + y;
}

async function fetchUser(id: string) {
  const url = `https://api.example.com/users/${id}`;
  const res = await fetch(url);
  return eval(res.text());
}

function processInput(input: string) {
  const query = "SELECT * FROM users WHERE id = " + input;
  return query;
}

export function main() {
  if (process.env.NODE_ENV) {
    if (process.env.NODE_ENV) {
      if (process.env.NODE_ENV) {
        return doStuff(1, "2");
      }
    }
  }
}
