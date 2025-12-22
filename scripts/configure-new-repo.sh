#!/bin/bash
# Configure a newly created GitHub repository with the correct permissions
# Usage: ./configure-new-repo.sh <owner/repo>

set -e

REPO=$1

if [ -z "$REPO" ]; then
  echo "Usage: $0 <owner/repo>"
  echo "Example: $0 crh225/my-new-api"
  exit 1
fi

echo "Configuring repository: $REPO"

# Set workflow permissions to write (allows GHCR push)
echo "✓ Setting workflow permissions to 'write'..."
gh api -X PUT "repos/$REPO/actions/permissions/workflow" \
  -F default_workflow_permissions=write \
  -F can_approve_pull_request_reviews=true

# Verify settings
echo "✓ Verifying settings..."
PERMS=$(gh api "repos/$REPO/actions/permissions/workflow" --jq '{default_workflow_permissions, can_approve_pull_request_reviews}')
echo "  Current permissions: $PERMS"

# Enable GitHub Actions if not already enabled
echo "✓ Ensuring Actions are enabled..."
gh api -X PUT "repos/$REPO/actions/permissions" \
  --input - <<EOF
{
  "enabled": true,
  "allowed_actions": "all"
}
EOF

echo ""
echo "✅ Repository $REPO configured successfully!"
echo "   - Workflow permissions: write"
echo "   - Can approve PRs: true"
echo "   - Actions enabled: true"
