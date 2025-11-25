/**
 * Backup Domain Entity
 * Represents a Terraform state backup
 */
export class Backup {
  constructor({
    environment,
    name,
    blobPath,
    backupType,
    timestamp,
    gitSha,
    createdAt,
    lastModified,
    sizeBytes
  }) {
    this.environment = environment; // Environment value object
    this.name = name;
    this.blobPath = blobPath;
    this.backupType = backupType; // 'backup', 'pre-restore', or 'unknown'
    this.timestamp = timestamp;
    this.gitSha = gitSha;
    this.createdAt = createdAt;
    this.lastModified = lastModified;
    this.sizeBytes = sizeBytes;
  }

  /**
   * Get size in megabytes
   */
  get sizeMB() {
    return (this.sizeBytes / (1024 * 1024)).toFixed(2);
  }

  /**
   * Calculate expiration date (30 days from creation)
   */
  get expirationDate() {
    const expiration = new Date(this.createdAt);
    expiration.setDate(expiration.getDate() + 30);
    return expiration;
  }

  /**
   * Check if backup is expired
   */
  get isExpired() {
    return this.expirationDate < new Date();
  }

  /**
   * Get days until expiration
   */
  get daysUntilExpiration() {
    const now = new Date();
    const daysLeft = Math.ceil((this.expirationDate - now) / (1000 * 60 * 60 * 24));
    return daysLeft;
  }

  /**
   * Convert to DTO for API response
   */
  toDTO() {
    return {
      environment: this.environment.value,
      name: this.name,
      blobPath: this.blobPath,
      backupType: this.backupType,
      timestamp: this.timestamp,
      gitSha: this.gitSha,
      createdAt: this.createdAt,
      lastModified: this.lastModified,
      sizeBytes: this.sizeBytes,
      sizeMB: this.sizeMB
    };
  }
}
