import axios from "axios";

export class NotificationService {
  private token = process.env.GITHUB_TOKEN ?? "";
  private slackWebhook = process.env.SLACK_WEBHOOK_URL;

  async postPRComment(prUrl: string, body: string): Promise<void> {
    const match = prUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!match) return;
    const [, owner, repo, number] = match;

    if (this.token) {
      await axios.post(
        `https://api.github.com/repos/${owner}/${repo}/issues/${number}/comments`,
        { body },
        { headers: { Authorization: `Bearer ${this.token}` } }
      );
    }

    if (this.slackWebhook) {
      await axios.post(this.slackWebhook, {
        text: `Code review complete for ${prUrl}\n${body.slice(0, 500)}...`,
      });
    }
  }
}
