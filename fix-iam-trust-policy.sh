#!/bin/bash
# Fix GitHub Actions IAM Trust Policy for EventHub

RoleName="github-actions-eventhub"
AccountID="385080556067"
RepoOwner="abi11-11"
RepoName="eventhub"
Branch="main"
Region="ap-south-2"

echo "Updating trust policy for role: $RoleName"
echo "Repository: $RepoOwner/$RepoName"
echo "Branch: $Branch"
echo ""

# Create the trust policy JSON
TrustPolicy=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${AccountID}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:${RepoOwner}/${RepoName}:ref:refs/heads/${Branch}"
        }
      }
    }
  ]
}
EOF
)

# Update the trust policy
aws iam update-assume-role-policy \
  --role-name "$RoleName" \
  --policy-document "$TrustPolicy" \
  --region "$Region"

if [ $? -eq 0 ]; then
  echo "✅ Trust policy updated successfully!"
  echo ""
  echo "Trust policy sub condition set to:"
  echo "  repo:${RepoOwner}/${RepoName}:ref:refs/heads/${Branch}"
  echo ""
  echo "Next steps:"
  echo "1. Go to GitHub Actions and re-run the failed workflow"
  echo "2. The build should now proceed successfully"
else
  echo "❌ Error updating trust policy"
  exit 1
fi
