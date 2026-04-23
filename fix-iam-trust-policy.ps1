# Fix GitHub Actions IAM Trust Policy for EventHub
# Uses AWS CLI to update the trust policy

$RoleName = "github-actions-eventhub"
$AccountID = "385080556067"
$RepoOwner = "abi11-11"
$RepoName = "eventhub"
$Branch = "main"

Write-Host "Updating IAM trust policy..." -ForegroundColor Cyan
Write-Host "Role: $RoleName" -ForegroundColor Cyan
Write-Host "Repository: $RepoOwner/$RepoName (branch: $Branch)" -ForegroundColor Cyan
Write-Host ""

# Build the trust policy JSON
$trustPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::$AccountID`:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:$RepoOwner/$RepoName:ref:refs/heads/$Branch"
        }
      }
    }
  ]
}
"@

# Write to temp file
$tmpFile = [System.IO.Path]::GetTempFileName()
$trustPolicy | Out-File -FilePath $tmpFile -Encoding UTF8

try {
    Write-Host "Executing: aws iam update-assume-role-policy ..." -ForegroundColor Gray
    
    # Update using AWS CLI with policy document from file
    $output = & aws iam update-assume-role-policy `
        --role-name $RoleName `
        --policy-document file://$tmpFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Success! Trust policy updated." -ForegroundColor Green
        Write-Host ""
        Write-Host "Updated condition:" -ForegroundColor Green
        Write-Host "  Federated: arn:aws:iam::$AccountID`:oidc-provider/token.actions.githubusercontent.com" -ForegroundColor Yellow
        Write-Host "  Sub: repo:$RepoOwner/$RepoName:ref:refs/heads/$Branch" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Next: Re-run the GitHub Actions workflow" -ForegroundColor Cyan
    }
    else {
        Write-Host "❌ Error occurred:" -ForegroundColor Red
        Write-Host $output -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Exception:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
finally {
    if (Test-Path $tmpFile) {
        Remove-Item $tmpFile -Force
    }
}
