# Deploy

## Prerequisites

- Frontend hosting: install CloudBase CLI and log in
  - `npm i -g @cloudbase/cli`
  - `tcb login`
- SCF: install Tencent Cloud CLI and log in
  - `pip install tccli`
  - `tccli auth login`

## Frontend

```bash
export VITE_API_BASE_URL="https://1318529515-68ilz5mtwx.ap-guangzhou.tencentscf.com"
npm run deploy:web
```

Optional variables:

```bash
export TENCENT_CLOUDBASE_ENV_ID="work-5go9mdmrce0a3f13"
export TENCENT_CLOUDBASE_DEPLOY_PATH="/"
```

## SCF

```bash
npm run deploy:scf
```

Optional variables:

```bash
export TENCENT_SCF_REGION="ap-guangzhou"
export TENCENT_SCF_NAMESPACE="default"
export TENCENT_SCF_NAME="daily-check-ai"
export TENCENT_SCF_TIMEOUT="30"
```

## Full deploy

```bash
export VITE_API_BASE_URL="https://1318529515-68ilz5mtwx.ap-guangzhou.tencentscf.com"
npm run deploy:all
```
