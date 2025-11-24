/**
 * GitHub Signature Verifier Domain Service
 * Verifies GitHub webhook signatures using HMAC SHA256
 */
import crypto from "crypto";

export class GitHubSignatureVerifier {
  constructor(webhookSecret) {
    this.webhookSecret = webhookSecret;
  }

  /**
   * Verify GitHub webhook signature
   * @param {string} payload - The raw request body as string
   * @param {string} signature - The X-Hub-Signature-256 header
   * @returns {boolean} True if signature is valid
   */
  verify(payload, signature) {
    if (!this.webhookSecret) {
      console.warn("[GitHubSignatureVerifier] No webhook secret configured - signature verification disabled");
      return true; // Allow in development without secret
    }

    if (!signature) {
      console.warn("[GitHubSignatureVerifier] No signature provided in webhook request");
      return false;
    }

    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    // Use timingSafeEqual to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (e) {
      return false;
    }
  }
}
