# Cloud App — Lab Implementation Guide

## Project Structure
```
project/
├── backend/
│   ├── index.js          ← Express API + SQLite
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── index.html        ← Login page
│   ├── nginx.conf        ← Proxies /api to backend
│   └── Dockerfile
├── k8s/
│   └── app.yaml          ← All Kubernetes objects
├── .github/
│   └── workflows/
│       └── deploy.yml    ← CI/CD pipeline
└── docker-compose.yml    ← For local testing only
```

---

## STEP 1 — Install Rancher Desktop
1. Download from https://docs.rancherdesktop.io/getting-started/installation/
2. Open it, go to **Kubernetes Settings**, make sure Kubernetes is **enabled**
3. Wait for the green "running" status (takes 2–3 min first time)
4. Open a terminal and verify:
   ```bash
   kubectl get nodes
   # Should show a node with STATUS=Ready
   ```

---

## STEP 2 — Test locally with Docker Compose
```bash
cd project/
docker compose up --build
```
- Open http://localhost:8080 → you should see the login form
- Login with `admin` / `password123`
- It should show "Welcome, admin!" and list users from DB

If this works, your app is correct. Stop it with Ctrl+C.

---

## STEP 3 — Push code to GitHub
```bash
cd project/
git init
git add .
git commit -m "initial commit"
# Create a NEW repo on github.com (call it cloud-app), then:
git remote add origin https://github.com/YOUR_USERNAME/cloud-app.git
git branch -M main
git push -u origin main
```

---

## STEP 4 — Set up Docker Hub
1. Go to https://hub.docker.com → Sign in
2. Create two repositories: `backend` and `frontend` (both public)
3. Remember your Docker Hub username

---

## STEP 5 — Replace YOUR_DOCKERHUB_USERNAME in k8s/app.yaml
Open `k8s/app.yaml` and replace both occurrences of:
```
YOUR_DOCKERHUB_USERNAME
```
with your actual Docker Hub username. Then commit and push:
```bash
git add k8s/app.yaml
git commit -m "set dockerhub username"
git push
```

---

## STEP 6 — Build and push images manually (first time)
```bash
# Login to Docker Hub
docker login

# Build and push backend
docker build -t YOUR_DOCKERHUB_USERNAME/backend:latest ./backend
docker push YOUR_DOCKERHUB_USERNAME/backend:latest

# Build and push frontend
docker build -t YOUR_DOCKERHUB_USERNAME/frontend:latest ./frontend
docker push YOUR_DOCKERHUB_USERNAME/frontend:latest
```

---

## STEP 7 — Deploy to Kubernetes
```bash
kubectl apply -f k8s/app.yaml

# Watch pods come up (takes ~30 seconds)
kubectl get pods -w

# You should see 4 pods total: 2 backend, 2 frontend
# NAME                        READY   STATUS    RESTARTS
# backend-xxx                 1/1     Running   0
# backend-yyy                 1/1     Running   0
# frontend-xxx                1/1     Running   0
# frontend-yyy                1/1     Running   0
```

Open http://localhost:30080 → login form should appear, fully working.

---

## STEP 8 — Set up GitHub Actions secrets
Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these 3 secrets:

| Name | Value |
|------|-------|
| `DOCKER_USERNAME` | your Docker Hub username |
| `DOCKER_PASSWORD` | your Docker Hub password |
| `KUBECONFIG` | (see below) |

**Getting your KUBECONFIG value:**
```bash
cat ~/.kube/config
```
Copy the ENTIRE output and paste it as the value for the `KUBECONFIG` secret.

---

## STEP 9 — Test CI/CD (the demo moment)
Make a visible change to prove it works. Edit `backend/index.js`:

Change this line:
```js
value: "1.0"
```
To:
```js
value: "2.0"
```

Then push:
```bash
git add backend/index.js
git commit -m "update version to 2.0"
git push
```

Now:
1. Go to GitHub → **Actions** tab → watch the pipeline run
2. While it's running, keep http://localhost:30080 open — the site stays up
3. After ~2 minutes, refresh the page — the version badge changes to `backend v2.0 ✓`

This is your zero-downtime rolling update demo. ✓

---

## What to say at defense

**"What is Kubernetes and why use it instead of just Docker?"**
Docker runs one container on one machine. Kubernetes manages many containers across machines — it handles restarts, load balancing, rolling updates, and scaling automatically.

**"What is a Service in Kubernetes?"**
A Service gives a stable network address to a set of pods. Even if pods restart and get new IPs, the Service name stays the same — that's why our frontend can call `backend-service:3000`.

**"What is a Deployment?"**
A Deployment describes the desired state — "I want 2 replicas of this image running." Kubernetes constantly ensures that state is maintained.

**"What is CI/CD?"**
Continuous Integration / Continuous Deployment. When you push code to GitHub, it automatically builds a new Docker image, pushes it, and tells Kubernetes to do a rolling update — replacing old pods with new ones without downtime.

**"How does zero-downtime work?"**
The rolling update strategy with `maxUnavailable: 0` means Kubernetes starts the new pod and waits until it passes the readiness probe before killing the old one. So there's always at least 2 healthy pods serving traffic.
