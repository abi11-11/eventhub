# Setup ECS IAM Roles for EventHub
# Creates ecsTaskExecutionRole and ecsTaskRole with proper permissions

$AccountID = "385080556067"
$Region = "ap-south-2"

Write-Host "Creating ECS IAM roles for EventHub..." -ForegroundColor Cyan
Write-Host ""

# Trust policy - same for both roles
$trustPolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Principal = @{
                Service = "ecs-tasks.amazonaws.com"
            }
            Action = "sts:AssumeRole"
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "Step 1: Creating ecsTaskExecutionRole..." -ForegroundColor Yellow

# Create execution role
try {
    aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document $trustPolicy 2>&1 | Out-Null
    Write-Host "  ✅ Role created" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ Role may already exist (or error)" -ForegroundColor Yellow
}

# Attach AWS managed policy
aws iam attach-role-policy `
  --role-name ecsTaskExecutionRole `
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy 2>&1 | Out-Null
Write-Host "  ✅ Attached AmazonECSTaskExecutionRolePolicy" -ForegroundColor Green

# Attach secrets policy
$secretsPolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Action = @("secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret")
            Resource = "arn:aws:secretsmanager:${Region}:${AccountID}:secret:eventhub/*"
        }
    )
} | ConvertTo-Json -Depth 10

aws iam put-role-policy `
  --role-name ecsTaskExecutionRole `
  --policy-name eventhub-secrets-access `
  --policy-document $secretsPolicy 2>&1 | Out-Null
Write-Host "  ✅ Attached Secrets Manager access policy" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Creating ecsTaskRole..." -ForegroundColor Yellow

# Create task role
try {
    aws iam create-role --role-name ecsTaskRole --assume-role-policy-document $trustPolicy 2>&1 | Out-Null
    Write-Host "  ✅ Role created" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ Role may already exist (or error)" -ForegroundColor Yellow
}

# Attach app permissions policy
$appPolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Action = @("logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents")
            Resource = "arn:aws:logs:${Region}:${AccountID}:log-group:/ecs/eventhub-api:*"
        },
        @{
            Effect = "Allow"
            Action = @("secretsmanager:GetSecretValue")
            Resource = "arn:aws:secretsmanager:${Region}:${AccountID}:secret:eventhub/*"
        }
    )
} | ConvertTo-Json -Depth 10

aws iam put-role-policy `
  --role-name ecsTaskRole `
  --policy-name eventhub-app-permissions `
  --policy-document $appPolicy 2>&1 | Out-Null
Write-Host "  ✅ Attached application permissions policy" -ForegroundColor Green
Write-Host ""

Write-Host "Created IAM Roles:" -ForegroundColor Cyan
Write-Host "  • ecsTaskExecutionRole: arn:aws:iam::${AccountID}:role/ecsTaskExecutionRole" -ForegroundColor Yellow
Write-Host "  • ecsTaskRole: arn:aws:iam::${AccountID}:role/ecsTaskRole" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Push code to GitHub: git push origin main" -ForegroundColor White
Write-Host "  2. Re-run the deployment workflow in GitHub Actions" -ForegroundColor White
