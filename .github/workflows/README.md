# GitHub Actions Workflows Quick Reference

## Available Workflows

### 1. tests.yml (On PR & Push to main/develop)

**Trigger:** 
- Pull requests to main or develop
- Pushes to main or develop

**What it does:**
- ✅ Runs Jest test suite with PostgreSQL
- ✅ Runs ESLint linting
- ✅ Generates code coverage reports
- ✅ Uploads coverage to Codecov
- ✅ Comments test results on PR
- ✅ Runs database migrations
- ✅ Validates code formatting

**Status Badge:**
```markdown
![Tests](https://github.com/YOUR_ORG/eventhub-app/actions/workflows/tests.yml/badge.svg)
```

**View Details:**
- GitHub > Actions > Tests & Linting > Latest run
- Check individual step logs for debugging

---

### 2. build.yml (On Push to main after merge)

**Trigger:**
- Push to main branch
- Only when backend/, Dockerfile, docker-compose.yml, or build.yml changes

**What it does:**
- 🐳 Builds Docker image with buildx
- 📤 Pushes image to AWS ECR
- 🔍 Scans for vulnerabilities (Trivy)
- 🚀 Auto-deploys to staging
- 📊 Caches layers for faster builds
- ⏱️ ~5-10 minutes duration

**Image Tags Created:**
- `main-<commit-hash>` (e.g., `main-a1b2c3d`)
- `main` (latest on main)
- Version tags from releases

**Success Indicators:**
- ✅ Docker image pushed to ECR
- ✅ Security scan passed
- ✅ Staging deployment triggered
- ✅ Slack notification (if configured)

**Failure Recovery:**
- Automatic rollback in staging
- Check logs for build errors
- Common issues: memory constraints, dependency resolution

---

### 3. deploy.yml (Manual or on Release)

**Trigger Modes:**

1. **Manual Workflow Dispatch:**
   - GitHub > Actions > Deploy to Production
   - Select environment: staging or production
   - Click "Run workflow"
   - ~3-5 minutes deployment

2. **On Release Published:**
   - Create release on main branch
   - Automatically deploys to production
   - Uses release tag as image version

**What it does:**
- ✅ Validates deployment prerequisites
- ✅ Updates ECS task definition
- ✅ Deploys to ECS cluster
- ✅ Waits for service stability
- ✅ Runs health checks (GET /health)
- ✅ Executes smoke tests
- ✅ Sends Slack notifications
- ⚠️ Can rollback if health checks fail

**Timeline:**
1. Pre-deployment checks (~30s)
2. AWS credential configuration (~30s)
3. ECS task definition update (~60s)
4. Service deployment (~120s)
5. Health checks (~60s)
6. Smoke tests (~60s)
7. Post-deployment tasks (~30s)

**Total:** ~5-10 minutes typical

---

## Workflow Status & Dashboard

### GitHub Actions Dashboard
- URL: `https://github.com/YOUR_ORG/eventhub-app/actions`
- View all workflow runs
- Filter by workflow, branch, actor
- Check logs, artifacts, annotations

### Individual Workflow Runs
- Click workflow name on Actions page
- View step-by-step execution
- Download artifacts (test reports, coverage)
- View annotations (lint errors, test failures)

### Status Badges in README
```markdown
[![Tests](https://github.com/YOUR_ORG/eventhub-app/actions/workflows/tests.yml/badge.svg)](https://github.com/YOUR_ORG/eventhub-app/actions/workflows/tests.yml)
[![Build](https://github.com/YOUR_ORG/eventhub-app/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/YOUR_ORG/eventhub-app/actions/workflows/build.yml)
```

---

## Environment Variables & Secrets

### GitHub Actions Secrets (Required)
Must be set in Settings > Secrets and variables > Actions

| Secret | Example | Where Used |
|--------|---------|-----------|
| `AWS_ROLE_ARN` | `arn:aws:iam::385080556067:role/github-actions-eventhub` | build.yml, deploy.yml |
| `AWS_ECR_REGISTRY` | `385080556067.dkr.ecr.ap-south-2.amazonaws.com` | build.yml |
| `SLACK_WEBHOOK` | `https://hooks.slack.com/services/...` | build.yml, deploy.yml (optional) |

### Task Definition Secrets (AWS)
Set in AWS Secrets Manager (referenced in task-definition.json)

| Secret | Purpose |
|--------|---------|
| `eventhub/db/host` | PostgreSQL host |
| `eventhub/db/password` | PostgreSQL password |
| `eventhub/redis/url` | Redis connection |
| `eventhub/jwt/private-key` | JWT signing key |

---

## Troubleshooting

### Tests Failing
```bash
# 1. Check test output in Actions > Tests & Linting > Logs
# 2. View detailed failure in "Run tests" step
# 3. Check for:
#    - Database connection issues
#    - Missing environment variables
#    - Test data setup problems

# Local reproduction:
cd backend
npm test
```

### Docker Build Failing
```bash
# Common causes:
# 1. Dockerfile syntax error
#    → Validate locally: docker build -t test .

# 2. Missing npm dependencies
#    → Check package.json and package-lock.json

# 3. Build context issues
#    → Check .dockerignore for excluded files

# 4. Memory constraints
#    → GitHub Actions runners have 7GB memory
#    → Reduce build parallelism if needed
```

### ECR Push Failing
```bash
# 1. Check AWS_ECR_REGISTRY secret is set correctly
# 2. Verify IAM role has ecr:PutImage, ecr:InitiateLayerUpload
# 3. Check ECR repository exists and is accessible

aws ecr describe-repositories --repository-names eventhub-api
```

### ECS Deployment Failing
```bash
# 1. Check ECS service status
aws ecs describe-services --cluster eventhub-production \
  --services eventhub-api-production

# 2. View deployment events
aws ecs describe-services --cluster eventhub-production \
  --services eventhub-api-production --query 'services[0].events'

# 3. Check task logs
aws logs tail /ecs/eventhub-api --follow

# 4. Verify task definition
aws ecs describe-task-definition --task-definition eventhub-api
```

### Health Check Failing
```bash
# 1. Verify health endpoint exists
curl http://localhost:3000/health

# 2. Check backend/src/index.js has health route:
grep -n "router.get.*health" backend/src/index.js

# 3. View ECS task logs for errors:
aws logs tail /ecs/eventhub-api --follow
```

---

## Best Practices

### Before Pushing Code
```bash
# 1. Run tests locally
npm test

# 2. Run linting
npx eslint src --max-warnings 0

# 3. Verify Docker builds
docker build -t eventhub-api:test .

# 4. Test Docker health check
docker run -p 3000:3000 eventhub-api:test
curl http://localhost:3000/health
```

### PR Review Process
1. ✅ Tests must pass (66/91 minimum)
2. ✅ Linting must pass
3. ✅ Coverage report shows no regressions
4. ✅ At least 1 approval from team
5. ✅ Merge to main

### Deployment Checklist
- [ ] All tests passing
- [ ] No security vulnerabilities in Trivy scan
- [ ] Staging deployment successful
- [ ] Smoke tests passing
- [ ] No alert spikes in monitoring
- [ ] Team notified of deployment

---

## Monitoring & Alerts

### CloudWatch Dashboards
- Track deployment frequency
- Monitor build times
- Alert on failures
- Cost analysis

### Slack Notifications
When configured with `SLACK_WEBHOOK`:
- ✅ Successful builds → #deployments
- ❌ Failed deployments → #deployments
- 📊 Deployment metrics

### Failed Workflow Recovery
1. Check logs in Actions tab
2. Review error messages
3. Fix root cause
4. Retry workflow (if applicable)
5. Manual intervention (if needed)

---

## Quick Commands

### Manually Trigger Tests
```bash
git fetch origin
git checkout -b feature/test-workflow
git commit --allow-empty -m "Trigger tests"
git push origin feature/test-workflow

# Create PR on GitHub
# → Tests workflow auto-triggers
```

### Manually Trigger Build
```bash
git push origin main
# → build.yml auto-triggers if backend files changed
```

### Manually Trigger Deploy
```bash
# Via GitHub Actions UI:
# 1. Go to Actions > Deploy to Production
# 2. Click "Run workflow"
# 3. Select environment (staging or production)
# 4. Click green "Run workflow" button

# Or create release (auto-deploys to production):
gh release create v1.0.0 --target main
```

### View Logs
```bash
# GitHub CLI (if installed)
gh run view <run-id> --log

# Or via UI:
# Actions > Workflow > Run ID > Click step name > View logs
```

---

## Documentation References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Jest Testing](https://jestjs.io/docs/getting-started)
- [ESLint Configuration](https://eslint.org/docs/rules/)

---

## Support

For questions or issues:
1. Check this guide first
2. Review workflow logs in GitHub Actions
3. Check CloudWatch logs
4. Ask team lead or DevOps engineer
5. File GitHub issue with error details
