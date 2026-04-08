# Story 0.5 CI/CD Implementation — Quick Start

**Status:** ✅ Complete  
**Files Created:** 7 new files  
**Setup Time:** ~30 minutes (AWS) + 5 minutes (GitHub)  
**First Deploy:** ~10 minutes

---

## Files Created in Story 0.5

### Workflows (3 files)
| File | Purpose | Trigger |
|------|---------|---------|
| `.github/workflows/tests.yml` | Testing & linting | Push to main/develop or PR |
| `.github/workflows/build.yml` | Docker build & ECR push | Push to main (backend changes) |
| `.github/workflows/deploy.yml` | ECS deployment | Manual or release tag |

### Configuration (2 files)
| File | Purpose |
|------|---------|
| `.aws/task-definition.json` | ECS task definition template |
| `.dockerignore` | Docker build optimization |

### Documentation (2 files)
| File | Purpose |
|------|---------|
| `.aws/CI-CD-SETUP.md` | Complete AWS setup guide (400+ lines) |
| `.github/workflows/README.md` | Workflow reference & troubleshooting |

### Updates (1 file)
| File | Changes |
|------|---------|
| `README.md` | Added CI/CD section, status badges |

---

## ⚡ Quick Start: From Zero to Deployment

### Phase 1: Setup AWS (30 mins)

#### 1.1 Create ECR Repository
```bash
aws ecr create-repository \
  --repository-name eventhub-api \
  --region us-east-1
```

Save the ECR URI: `ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/eventhub-api`

#### 1.2 Create ECS Cluster
```bash
aws ecs create-cluster \
  --cluster-name eventhub-production \
  --region us-east-1
```

#### 1.3 Setup GitHub OIDC Trust
Follow: `.aws/CI-CD-SETUP.md` Section 2

```bash
# Create role with GitHub Actions trust policy
aws iam create-role \
  --role-name github-actions-eventhub \
  --assume-role-policy-document file://github-actions-trust-policy.json

# Attach ECR permissions
aws iam put-role-policy \
  --role-name github-actions-eventhub \
  --policy-name ecr-access \
  --policy-document file://ecr-policy.json
```

#### 1.4 Create Secrets Manager Entries
```bash
# Database secrets
aws secretsmanager create-secret \
  --name eventhub/db/host \
  --secret-string "your-db-host.rds.amazonaws.com"

aws secretsmanager create-secret \
  --name eventhub/db/password \
  --secret-string "your-secure-password"

# JWT keys (copy from backend/.env)
aws secretsmanager create-secret \
  --name eventhub/jwt/private-key \
  --secret-string "$(cat backend/.env | grep JWT_PRIVATE_KEY | cut -d= -f2-)"
```

### Phase 2: Configure GitHub Secrets (5 mins)

Go to: **Settings > Secrets and variables > Actions > New repository secret**

Add 3 secrets:
```
AWS_ROLE_ARN = arn:aws:iam::ACCOUNT_ID:role/github-actions-eventhub
AWS_ECR_REGISTRY = ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
SLACK_WEBHOOK = https://hooks.slack.com/services/... (optional)
```

### Phase 3: First Deploy (10 mins)

#### 3.1 Trigger Tests Workflow
```bash
# Create a test branch
git checkout -b feature/test-workflow
git commit --allow-empty -m "Test workflow"
git push origin feature/test-workflow

# Create PR on GitHub
# → tests.yml auto-triggers
```

#### 3.2 Trigger Build Workflow
```bash
# Make a backend change or just merge the PR
git checkout main
git pull origin main

# Push to main (or make backend changes)
# → build.yml auto-triggers

# Watch in: GitHub > Actions > Build & Push Docker Image
```

#### 3.3 Register ECS Task Definition
```bash
# After successful Docker build
aws ecs register-task-definition \
  --cli-input-json file://.aws/task-definition.json
```

#### 3.4 Create ECS Service
```bash
# Create service for staging first
aws ecs create-service \
  --cluster eventhub-production \
  --service-name eventhub-api-staging \
  --task-definition eventhub-api:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx]}"
```

#### 3.5 Manual Deploy
```bash
# Go to GitHub Actions
# Click: Deploy to Production
# Click: Run workflow
# Select: staging
# Click: Run workflow (green button)
```

---

## 📊 Workflow Summary

### tests.yml - Runs on Every PR/Push

```
Branch: main/develop
Trigger: PR or push
Duration: 8-12 minutes

Steps:
1. Setup Node + PostgreSQL
2. Install dependencies
3. Run migrations
4. Run Jest tests (66/91 expected)
5. Run ESLint
6. Upload coverage
7. Comment results on PR
```

**Success Criteria:**
- Tests pass or meet acceptance threshold
- Linting passes (max 5 warnings)
- No critical security issues

**If Fails:**
- Check logs in Actions tab
- Review test output
- Fix and re-push
- PR will block merge until passing

### build.yml - Runs on Push to Main

```
Branch: main only
Trigger: Push to main
Duration: 5-10 minutes

Steps:
1. Build Docker image (with cache)
2. Push to ECR
3. Security scan (Trivy)
4. Auto-deploy to staging
5. Notify Slack (if configured)
```

**Success Criteria:**
- Image builds successfully
- No critical vulnerabilities
- ECR push succeeds
- Staging deployment succeeds

**If Fails:**
- Check Docker build logs
- Verify ECR permissions
- Check staging service status

### deploy.yml - Manual or Release

```
Trigger: Manual workflow_dispatch or release tag
Duration: 5-10 minutes

Steps:
1. Pre-deployment validation
2. Update ECS task definition
3. Deploy to target environment
4. Wait for service stability
5. Run health checks
6. Notify Slack
```

**Success Criteria:**
- Health check passes
- Service is stable
- No error spikes in logs

**If Fails:**
- Check ECS task logs
- Verify secrets are set
- Check database connection
- Auto-rollback to previous version

---

## 🔍 Monitoring & Validation

### Check Workflow Status
```bash
# GitHub Actions tab
# Or via CLI:
gh run list --workflow tests.yml

# View specific run
gh run view RUN_ID --log
```

### Check ECR Images
```bash
# List images in ECR
aws ecr describe-images --repository-name eventhub-api

# Get image details
aws ecr describe-images \
  --repository-name eventhub-api \
  --query 'imageDetails[0]'
```

### Check ECS Deployment
```bash
# List running tasks
aws ecs list-tasks --cluster eventhub-production

# Get task details
aws ecs describe-tasks \
  --cluster eventhub-production \
  --tasks TASK_ARN

# View service status
aws ecs describe-services \
  --cluster eventhub-production \
  --services eventhub-api-staging
```

### Check Health
```bash
# After deployment
curl https://your-api-endpoint/health

# Should return:
# HTTP 200
# {"status":"ok","timestamp":"2026-04-01T..."}
```

---

## 🐛 Troubleshooting

### Tests Failing
```bash
# 1. Check logs in Actions tab
# 2. Check specific test failure
# 3. Run locally:
cd backend && npm test

# 4. Common causes:
#    - Database not running
#    - Missing environment variables
#    - Incorrect JWT keys
```

### Docker Build Failing
```bash
# 1. Test locally:
docker build -t eventhub:test .

# 2. Check for:
#    - Syntax errors in Dockerfile
#    - Missing npm dependencies
#    - Large files in .dockerignore
```

### ECR Push Failing
```bash
# 1. Check IAM permissions
aws iam get-user

# 2. Test ECR access
aws ecr describe-repositories --repository-names eventhub-api

# 3. Verify AWS credentials in GitHub secrets
```

### ECS Deployment Failing
```bash
# 1. Check service events
aws ecs describe-services \
  --cluster eventhub-production \
  --services eventhub-api-staging \
  --query 'services[0].events' | head -20

# 2. Check task logs
aws logs tail /ecs/eventhub-api --follow

# 3. Common causes:
#    - Secrets not found in Secrets Manager
#    - Database connection issues
#    - InsufficientMemory (task def too small)
```

### Health Check Failing
```bash
# 1. Verify endpoint exists
curl http://localhost:3000/health

# 2. Check logs
npm run dev | grep -i health

# 3. Verify backend/src/index.js has:
#    app.get('/health', (req, res) => res.json({status: 'ok'}))
```

---

## 💡 Pro Tips

### Local Testing
```bash
# Test Docker build locally before pushing
docker build -t eventhub-api:local .
docker run -p 3000:3000 eventhub-api:local

# Test with docker-compose
docker-compose up -d
curl http://localhost:3000/health
```

### Debugging Workflows
```bash
# Add debug logging to workflow:
# Add this step:
#   - name: Debug
#     run: |
#       echo "Image: ${{ steps.meta.outputs.tags }}"
#       echo "AWS Role: ${{ secrets.AWS_ROLE_ARN }}"

# Or use GitHub CLI:
gh run view RUN_ID --log > run.log
grep -i error run.log
```

### Manual Triggers
```bash
# Trigger workflow manually
gh workflow run tests.yml
gh workflow run build.yml
gh workflow run deploy.yml -f environment=staging

# Check status
gh run list --workflow tests.yml | head -5
```

---

## ✅ Checklist for Production

Before deploying to production:

- [ ] AWS ECR repository created
- [ ] AWS ECS cluster created
- [ ] AWS Secrets Manager secrets set up
- [ ] GitHub secrets configured (AWS_ROLE_ARN, AWS_ECR_REGISTRY)
- [ ] GitHub OIDC provider setup
- [ ] IAM role created for GitHub Actions
- [ ] Tests passing (66/91 minimum)
- [ ] Docker image builds locally
- [ ] Health endpoint verified
- [ ] Staging deployment tested
- [ ] Production database ready
- [ ] CloudWatch logging configured
- [ ] Slack notifications setup (optional)
- [ ] Team trained on CI/CD process
- [ ] Runbook documented

---

## 📚 Full Documentation

For detailed information, see:
- [.aws/CI-CD-SETUP.md](.aws/CI-CD-SETUP.md) — Complete AWS setup
- [.github/workflows/README.md](.github/workflows/README.md) — Workflow reference
- [README.md](README.md) — Project overview
- [STORY_0_5_COMPLETION.md](STORY_0_5_COMPLETION.md) — Story details

---

**Status:** ✅ Ready to deploy  
**Estimated Deploy Time:** < 2 hours from zero  
**Support:** See troubleshooting above or check documentation files
