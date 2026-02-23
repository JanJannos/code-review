/**
 * OAuth token manager for VCS providers.
 * Stub implementation — extend for multi-provider support.
 */
export class AuthService {
  getToken(provider: "github" | "gitlab"): string | undefined {
    if (provider === "github") return process.env.GITHUB_TOKEN;
    if (provider === "gitlab") return process.env.GITLAB_TOKEN;
    return undefined;
  }
}
