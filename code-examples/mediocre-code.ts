let cachedData: any = null;
const DEFAULT_TIMEOUT = 5000;

function fetchData(url: string) {
  return fetch(url).then((r) => r.json());
}

export function getItem(id: number) {
  if (!cachedData) {
    cachedData = fetchData(`/api/items/${id}`);
  }
  return cachedData;
}

export function processOrder(order: any) {
  if (order.amount > 0) {
    return { success: true };
  }
  return { success: false };
}

function unusedHelper() {
  console.log("never called");
}
