import { describe, it, expect, vi, beforeEach } from "vitest";
import { CacheService } from "../../app/services/cache.service";

vi.mock("ioredis", () => ({
  default: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
  })),
}));

describe("CacheService", () => {
  let cache: CacheService;
  let mockGet: ReturnType<typeof vi.fn>;
  let mockSet: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const Redis = (await import("ioredis")).default;
    mockGet = vi.fn().mockResolvedValue(null);
    mockSet = vi.fn().mockResolvedValue("OK");
    vi.mocked(Redis).mockImplementation(
      () =>
        ({
          get: mockGet,
          set: mockSet,
        }) as never
    );
    cache = new CacheService("redis://test");
  });

  it("returns null for missing key", async () => {
    mockGet.mockResolvedValue(null);
    const result = await cache.get<string>("missing");
    expect(result).toBeNull();
  });

  it("returns parsed value for existing key", async () => {
    mockGet.mockResolvedValue(JSON.stringify({ foo: "bar" }));
    const result = await cache.get<{ foo: string }>("key");
    expect(result).toEqual({ foo: "bar" });
  });

  it("sets value with TTL", async () => {
    await cache.set("key", { data: 1 }, 3600);
    expect(mockSet).toHaveBeenCalledWith("key", '{"data":1}', "EX", 3600);
  });
});
