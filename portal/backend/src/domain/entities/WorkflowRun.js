/**
 * WorkflowRun Domain Entity
 * Represents a GitHub workflow run from webhook
 */
export class WorkflowRun {
  constructor({
    id,
    name,
    status,
    conclusion,
    headBranch,
    htmlUrl,
    displayTitle,
    pullRequests
  }) {
    this.id = id;
    this.name = name;
    this.status = status; // e.g., "completed"
    this.conclusion = conclusion; // e.g., "success", "failure", "cancelled"
    this.headBranch = headBranch;
    this.htmlUrl = htmlUrl;
    this.displayTitle = displayTitle;
    this.pullRequests = pullRequests || [];
  }

  /**
   * Parse PR number from workflow run details
   */
  getPRNumber() {
    // Try associated pull requests first
    if (this.pullRequests && this.pullRequests.length > 0) {
      return this.pullRequests[0].number;
    }

    // Try from display title or head_commit message
    const titleMatch = this.displayTitle?.match(/#(\d+)/);
    if (titleMatch) {
      return parseInt(titleMatch[1], 10);
    }

    return null;
  }

  /**
   * Parse environment and blueprint from branch name or workflow name
   */
  parseJobInfo() {
    // Expected format: requests/{env}/{blueprint}-{hash}
    const match = this.headBranch?.match(/requests\/([^/]+)\/(.+)-(\w+)$/);
    if (match) {
      return {
        environment: match[1],
        blueprint: match[2]
      };
    }

    // Handle workflows running on main branch (backend-dev, frontend-dev, etc.)
    if (this.headBranch === 'main' && this.name) {
      // Extract environment from workflow name (e.g., "Backend Dev" -> "dev")
      const envMatch = this.name.match(/(Dev|Staging|Prod|QA)/i);
      const env = envMatch ? envMatch[1].toLowerCase() : null;

      // Extract blueprint type from workflow name
      if (this.name.toLowerCase().includes('backend')) {
        return { environment: env || 'prod', blueprint: 'backend' };
      } else if (this.name.toLowerCase().includes('frontend')) {
        return { environment: env || 'prod', blueprint: 'frontend' };
      } else if (this.name.toLowerCase().includes('terraform')) {
        return { environment: env || 'prod', blueprint: 'terraform' };
      } else if (this.name.toLowerCase().includes('pr environment')) {
        return { environment: 'pr', blueprint: 'pr-environment' };
      } else if (this.name.toLowerCase().includes('ci')) {
        return { environment: 'ci', blueprint: 'ci-build' };
      } else if (this.name.toLowerCase().includes('deploy')) {
        return { environment: env || 'prod', blueprint: 'deploy' };
      }
    }

    // Handle testpr or feature branches
    if (this.headBranch && this.headBranch !== 'main') {
      // Use workflow name as blueprint if available
      const workflowName = this.name ? this.name.replace(/\s+/g, '-').toLowerCase() : 'workflow';
      return {
        environment: 'branch',
        blueprint: workflowName
      };
    }

    // Final fallback - use workflow name if available
    if (this.name) {
      return {
        environment: 'main',
        blueprint: this.name.replace(/\s+/g, '-').toLowerCase()
      };
    }

    return {
      environment: 'system',
      blueprint: 'workflow'
    };
  }

  /**
   * Determine notification type based on conclusion
   */
  getNotificationType() {
    if (this.conclusion === 'success') {
      return 'job_success';
    } else if (this.conclusion === 'failure') {
      return 'job_failure';
    } else {
      return 'job_info';
    }
  }

  /**
   * Get notification title based on conclusion
   */
  getNotificationTitle() {
    if (this.conclusion === 'success') {
      return 'Deployment Succeeded';
    } else if (this.conclusion === 'failure') {
      return 'Deployment Failed';
    } else {
      return 'Deployment Status';
    }
  }

  /**
   * Get notification message
   */
  getNotificationMessage() {
    const { environment, blueprint } = this.parseJobInfo();
    const prNumber = this.getPRNumber();
    const prText = prNumber ? ` (#${prNumber})` : '';

    if (this.conclusion === 'success') {
      return `${environment}/${blueprint}${prText} completed successfully`;
    } else if (this.conclusion === 'failure') {
      return `${environment}/${blueprint}${prText} failed`;
    } else {
      return `${environment}/${blueprint}${prText} ${this.conclusion}`;
    }
  }
}
