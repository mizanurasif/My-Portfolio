# My Portfolio

A Next.js portfolio site that stores its content in MongoDB.

| Route   | What it does                                          |
|---------|-------------------------------------------------------|
| `/`     | Public portfolio page                                 |
| `/edit` | Form to edit every section; saves to MongoDB          |

Data is stored as one document (`_id: "main"`) in the `Portfolio` collection
of the `user-account` database. Until the first save, the page shows the
default content from `lib/portfolio.ts`.

> `/edit` has no login. Anyone who can reach the site can change the portfolio.

## Local development

1. Start MongoDB: `docker compose -f my-app.yaml up -d mongodb`
2. `npm install && npm run dev`
3. Open http://localhost:3000 (edit at http://localhost:3000/edit)

`.env.local` points the app at `mongodb://admin:password@localhost:27017`.

## Docker & Kubernetes Cheatsheet

Run all commands from the project root (`my-app/`).

### 1. Build the Docker image

```bash
docker build -t my-app:2.0 .
```

Rebuild after every code change; the containers keep running the old image until you do.

Check it exists:

```bash
docker images
```

### 2. Run with Docker Compose

The compose file is `my-app.yaml` (not the default `docker-compose.yaml`), so pass it with `-f`:

```bash
docker compose -f my-app.yaml up -d      # start
docker compose -f my-app.yaml ps         # status
docker compose -f my-app.yaml logs -f    # logs
docker compose -f my-app.yaml down       # stop
```

- App: http://localhost:3000
- Mongo Express: http://localhost:8080

### Kubernetes architecture

Everything runs in the `default` namespace. The Ingress is the only way in from outside the cluster; every Service is `ClusterIP` (internal only).

```mermaid
flowchart TD
    user(["Browser<br/>http://myapp.com"])

    subgraph cluster["minikube cluster"]
        ing["Ingress: my-app-ingress<br/>class nginx · host myapp.com"]

        subgraph web["App"]
            appSvc["Service: my-app-service<br/>ClusterIP :3000"]
            appPod["Pod: my-app-deployment<br/>image my-app:2.0 · :3000"]
        end

        subgraph admin["Admin UI"]
            meSvc["Service: mongo-express-service<br/>ClusterIP :8081"]
            mePod["Pod: mongo-express-deployment<br/>image mongo-express · :8081"]
        end

        subgraph db["Database"]
            dbSvc["Service: mongo-service<br/>ClusterIP :27017"]
            dbPod["Pod: mongo-deployment<br/>image mongo · :27017"]
        end

        secret[("Secret: mongo-secret<br/>mongo-user, mongo-password,<br/>mongo-url, mongo-user-account")]
        cm[("ConfigMap: mongo-config<br/>mongo-url = mongo-service")]
    end

    user --> ing
    ing -- "path /" --> appSvc --> appPod
    ing -- "path /mongo-express" --> meSvc --> mePod
    appPod -- "MONGODB_URI" --> dbSvc
    mePod -- "ME_CONFIG_MONGODB_URL" --> dbSvc
    dbSvc --> dbPod

    secret -. env .-> appPod
    secret -. env .-> mePod
    secret -. env .-> dbPod
    cm -. env .-> mePod
```

| File                 | Resources                                    | Port  | Reads from                         |
| -------------------- | -------------------------------------------- | ----- | ---------------------------------- |
| `my-app-ingress.yaml`| Ingress `my-app-ingress`                      | 80    | routes `/` and `/mongo-express`    |
| `my-app.yaml`        | Deployment + Service `my-app-service`         | 3000  | `mongo-secret`                     |
| `mongo-express.yaml` | Deployment + Service `mongo-express-service`  | 8081  | `mongo-secret`, `mongo-config`     |
| `mongo.yaml`         | Deployment + Service `mongo-service`          | 27017 | `mongo-secret`                     |
| `mongo-secret.yaml`  | Secret `mongo-secret`                         | –     | –                                  |
| `mongo-config.yaml`  | ConfigMap `mongo-config`                      | –     | –                                  |

How a request flows:

1. The browser resolves `myapp.com` (from the hosts file) and hits the NGINX Ingress controller on port 80.
2. The Ingress matches the path: `/mongo-express...` goes to `mongo-express-service:8081`, everything else goes to `my-app-service:3000`.
3. Each Service load-balances to its Pod through the `app:` label selector.
4. The app and Mongo Express reach MongoDB at `mongo-service:27017`. The hostname comes from the `mongo-url` connection string in `mongo-secret` (`mongodb://admin:password@mongo-service:27017/?authSource=admin`).
5. MongoDB creates its root user on first start from `mongo-user` / `mongo-password` in `mongo-secret`.

> MongoDB has no volume, so its data is lost when the pod restarts. Each Deployment runs 1 replica.

### 3. Run on Kubernetes (minikube)

**Load the image first.** minikube has its own image store, so a local build is invisible to it — skipping this gives `ImagePullBackOff`(optional):

```bash
minikube image load my-app:2.0
```

Apply every file in the folder at once:

```bash
kubectl apply -f ./kubernetes
```

Check everything is up:

```bash
kubectl get pods
kubectl get endpoints    # must show IPs, not <none>
```

### 4. Expose with Ingress

Both Services are now plain `ClusterIP` (the `type: NodePort` and `nodePort` lines were removed), so they are no longer reachable from outside the cluster on their own. A single Ingress (`kubernetes/my-app-ingress.yaml`) is the one entry point, and routes by path on the host `myapp.com`:

| URL                                | Goes to                          |
| ---------------------------------- | -------------------------------- |
| `http://myapp.com/`                | `my-app-service:3000`            |
| `http://myapp.com/mongo-express/`  | `mongo-express-service:8081`     |

```yaml
spec:
  ingressClassName: nginx
  rules:
  - host: myapp.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-app-service
            port:
              number: 3000
      - path: /mongo-express
        pathType: Prefix
        backend:
          service:
            name: mongo-express-service
            port:
              number: 8081
```

Mongo Express is served under a sub-path, so it has to know its own base URL — otherwise it generates links and CSS/JS paths at `/` and they land on the Next.js app instead. That is why `kubernetes/mongo-express.yaml` now sets:

```yaml
- name: ME_CONFIG_SITE_BASEURL
  value: /mongo-express/
```

**Steps:**

1. Enable the NGINX Ingress controller (one time per cluster):

   ```bash
   minikube addons enable ingress
   kubectl get pods -n ingress-nginx      # wait for the controller pod to be Running
   ```

2. Apply the manifests (includes the Ingress) and check it got an address:

   ```bash
   kubectl apply -f ./kubernetes
   kubectl get ingress
   ```

3. Point `myapp.com` at the cluster. Edit the hosts file — on Windows `C:\Windows\System32\drivers\etc\hosts` (open the editor as Administrator), on Linux/Mac `/etc/hosts`:

   ```
   127.0.0.1 myapp.com
   ```

   > On Linux you can use the node IP instead (`minikube ip`, e.g. `192.168.49.2 myapp.com`) and skip the tunnel.

4. On Windows/Mac (Docker driver) start a tunnel so port 80 reaches the Ingress controller. Keep this terminal open:

   ```bash
   minikube tunnel
   ```

5. Open in the browser:

   - App: http://myapp.com
   - Mongo Express: http://myapp.com/mongo-express/ (login: admin / pass)

> Quick test without the Ingress: `kubectl port-forward service/my-app-service 3000:3000` still works on ClusterIP Services. `minikube service ...` and `http://192.168.49.2:30100` no longer apply, since there is no NodePort any more.

Tear down:

```bash
kubectl delete -f ./kubernetes
```

### Handy while debugging

```bash
kubectl describe pod <pod-name>    # why a pod won't start (image pull, config errors)
kubectl logs <pod-name>            # app output, only once the container has started
kubectl rollout restart deployment/my-app-deployment   # needed after a Secret/ConfigMap change
kubectl describe ingress my-app-ingress   # shows the routing rules and which backends it resolved
```
