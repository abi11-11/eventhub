# CI/CD Pipeline Setup Guide

This guide walks through setting up the EventHub CI/CD pipeline with GitHub Actions and AWS.

## Overview

The CI/CD pipeline consists of three workflows:

1. **tests.yml** - Runs on PRs and commits to main/develop
   - Tests, linting, coverage reporting
   - Database migrations and integration tests

2. **build.yml** - Runs on push to main
   - Builds Docker image
   - Pushes to AWS ECR
   - Runs security scan (Trivy)
   - Auto-deploys to staging

3. **deploy.yml** - Manual or on release tag
   - Deploys to production or staging
   - Health checks and smoke tests
   - Slack notifications
   - Rollback capability

## Prerequisites

- AWS Account with ECR, ECS, and RDS (PostgreSQL)
- GitHub repository with Actions enabled
- Docker installed locally
- AWS CLI configured

## Step 1: Create AWS Resources

### 1.1 Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name eventhub-api \
  --region us-east-1 \
  --image-tag-mutability MUTABLE \
  --image-scanning-configuration scanOnPush=true
```

### 1.2 Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name eventhub-production \
  --region us-east-1
```

Or via AWS Console: ECS > Clusters > Create Cluster

### 1.3 Create CloudWatch Log Group

```bash
aws logs create-log-group \
  --log-group-name /ecs/eventhub-api \
  --region us-east-1
```

### 1.4 Create RDS PostgreSQL Instance (if not exists)

```bash
aws rds create-db-instance \
  --db-instance-identifier eventhub-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.1 \
  --master-username postgres \
  --master-user-password <SECURE_PASSWORD> \
  --allocated-storage 20 \
  --vpc-security-group-ids <SG_ID>
```

### 1.5 Create AWS Secrets Manager Secrets

```bash
# Database host
aws secretsmanager create-secret \
  --name eventhub/db/host \
  --secret-string "<db-instance.rds.amazonaws.com>"

# Database port
aws secretsmanager create-secret \
  --name eventhub/db/port \
  --secret-string "5432"

# Database name
aws secretsmanager create-secret \
  --name eventhub/db/name \
  --secret-string "eventhub"

# Database user
aws secretsmanager create-secret \
  --name eventhub/db/user \
  --secret-string "postgres"

# Database password
aws secretsmanager create-secret \
  --name eventhub/db/password \
  --secret-string "<SECURE_PASSWORD>"

# Redis URL
aws secretsmanager create-secret \
  --name eventhub/redis/url \
  --secret-string "redis://<elasticache-endpoint>:6379"

# JWT Keys (copy from backend/.env)
aws secretsmanager create-secret \
  --name eventhub/jwt/private-key \
  --secret-string "$(cat backend/.env | grep JWT_PRIVATE_KEY | cut -d= -f2-)"

aws secretsmanager create-secret \
  --name eventhub/jwt/public-key \
  --secret-string "$(cat backend/.env | grep JWT_PUBLIC_KEY | cut -d= -f2-)"

# Firebase credentials
aws secretsmanager create-secret \
  --name eventhub/firebase/project-id \
  --secret-string "<firebase-project-id>"

aws secretsmanager create-secret \
  --name eventhub/firebase/private-key \
  --secret-string "$(cat /path/to/firebase-key.json)"
```

## Step 2: Create IAM Role for GitHub Actions

### 2.1 Create Trust Policy

Create `github-actions-trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/eventhub-app:*"
        }
      }
    }
  ]
}
```

### 2.2 Create IAM Role

```bash
aws iam create-role \
  --role-name github-actions-eventhub \
  --assume-role-policy-document file://github-actions-trust-policy.json
```

### 2.3 Attach Policies

```bash
# ECR permissions
aws iam put-role-policy \
  --role-name github-actions-eventhub \
  --policy-name ecr-access \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "ecr:GetAuthorizationToken",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:DescribeRepositories",
          "ecr:ListImages"
        ],
        "Resource": "arn:aws:ecr:us-east-1:ACCOUNT_ID:repository/eventhub-api"
      }
    ]
  }'

# ECS permissions
aws iam put-role-policy \
  --role-name github-actions-eventhub \
  --policy-name ecs-access \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "ecs:UpdateService",
          "ecs:DescribeServices",
          "ecs:DescribeTaskDefinition",
          "ecs:DescribeTasks",
          "ecs:ListTasks",
          "ecs:RegisterTaskDefinition"
        ],
        "Resource": "*"
      }
    ]
  }'

# Secrets Manager permissions
aws iam put-role-policy \
  --role-name github-actions-eventhub \
  --policy-name secrets-access \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "secretsmanager:GetSecretValue"
        ],
        "Resource": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:eventhub/*"
      }
    ]
  }'
```

## Step 3: Configure GitHub Secrets

Go to: Settings > Secrets and variables > Actions > New repository secret

Add the following secrets:

```
AWS_ROLE_ARN = arn:aws:iam::ACCOUNT_ID:role/github-actions-eventhub
AWS_ECR_REGISTRY = ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
SLACK_WEBHOOK = https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## Step 4: Create ECS Task Definition

```bash
# Register task definition
aws ecs register-task-definition \
  --cli-input-json file://.aws/task-definition.json
```

## Step 5: Create ECS Service

```bash
# Create service
aws ecs create-service \
  --cluster eventhub-production \
  --service-name eventhub-api-production \
  --task-definition eventhub-api:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=eventhub-api,containerPort=3000 \
  --deployment-configuration "maximumPercent=200,minimumHealthyPercent=50"
```

## Step 6: Test the Pipeline

### Local Test

```bash
# Build Docker image locally
docker build -t eventhub-api:test .

# Test image runs
docker run -p 3000:3000 eventhub-api:test

# Check health
curl http://localhost:3000/health
```

### GitHub Actions Test

1. Create a feature branch
2. Make a small change to trigger tests
3. Create PR to main
4. Watch workflow run in Actions tab
5. Check test results and coverage

### Trigger Manual Deployment

Go to Actions > Deploy to Production > Run workflow > Select environment

## Monitoring & Troubleshooting

### View Logs

```bash
# GitHub Actions logs
# Available in Actions tab on GitHub

# ECS Task logs
aws logs tail /ecs/eventhub-api --follow

# View running tasks
aws ecs list-tasks --cluster eventhub-production
aws ecs describe-tasks --cluster eventhub-production --tasks <task-arn>
```

### Common Issues

**ECR Push Failed**
```bash
# Check credentials
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <registry>

# Check repository exists
aws ecr describe-repositories --repository-names eventhub-api
```

**ECS Deployment Failed**
```bash
# Check task definition
aws ecs describe-task-definition --task-definition eventhub-api

# Check service status
aws ecs describe-services --cluster eventhub-production --services eventhub-api-production

# View events
aws ecs describe-services --cluster eventhub-production --services eventhub-api-production --query 'services[0].events'
```

**Health Check Failing**
```bash
# Test health endpoint locally
curl -v http://localhost:3000/health

# Check logs in ECS
aws ecs describe-tasks --cluster eventhub-production --tasks <task-arn> --query 'tasks[0].containers[0]'
```

## Scaling & Performance

### Auto Scaling

```bash
# Create autoscaling target
aws autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/eventhub-production/eventhub-api-production \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws autoscaling put-scaling-policy \
  --policy-name eventhub-scale-up \
  --service-namespace ecs \
  --resource-id service/eventhub-production/eventhub-api-production \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

### Monitoring

- CloudWatch Dashboards: Create custom dashboards for metrics
- CloudWatch Alarms: Set up alerts for errors, latency, CPU
- X-Ray: Enable for distributed tracing
- Performance Insights: Monitor database and application performance

## Security Best Practices

1. ✅ Store secrets in AWS Secrets Manager (not in .env)
2. ✅ Use IAM roles with least privilege
3. ✅ Enable ECR image scanning for vulnerabilities
4. ✅ Use VPC security groups to restrict network access
5. ✅ Enable CloudTrail for audit logging
6. ✅ Rotate JWT keys regularly
7. ✅ Use HTTPS for all communication
8. ✅ Enable WAF on ALB for DDoS protection

## Maintenance

### Weekly Tasks
- Review CloudWatch logs for errors
- Check deployment success rate
- Monitor cost trends

### Monthly Tasks
- Review and rotate secrets
- Update dependencies
- Performance optimization review
- Security patch review

### Quarterly Tasks
- Load testing and capacity planning
- Disaster recovery testing
- Documentation updates

## Next Steps

1. Verify all AWS resources are created
2. Configure GitHub secrets (AWS_ROLE_ARN, AWS_ECR_REGISTRY, SLACK_WEBHOOK)
3. Push code changes to trigger CI/CD pipeline
4. Monitor first deployment through Actions tab
5. Test manual deployment
6. Setup monitoring and alerting
7. Document team runbooks
