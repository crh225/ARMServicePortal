/**
 * Notification Domain Entity
 */
export class Notification {
  constructor({ id, type, title, message, prNumber, jobId, environment, blueprint, timestamp, read, url }) {
    this.id = id;
    this.type = type || 'job_info';
    this.title = title;
    this.message = message;
    this.prNumber = prNumber || null;
    this.jobId = jobId || null;
    this.environment = environment || null;
    this.blueprint = blueprint || null;
    this.timestamp = timestamp || new Date().toISOString();
    this.read = read || false;
    this.url = url || null;
  }

  /**
   * Mark notification as read
   */
  markAsRead() {
    this.read = true;
  }

  /**
   * Convert to DTO
   */
  toDTO() {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      message: this.message,
      prNumber: this.prNumber,
      jobId: this.jobId,
      environment: this.environment,
      blueprint: this.blueprint,
      timestamp: this.timestamp,
      read: this.read,
      url: this.url
    };
  }
}
