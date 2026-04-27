# Deploy na VPS Hostinger

Tudo aqui é **copia-e-cola no terminal browser do painel da Hostinger**. Sem GUI, sem SSH local.

## Pré-requisitos

1. VPS Hostinger ativa (Ubuntu 22.04 ou 24.04)
2. Domínio (ou subdomínio) apontando pro IP da VPS via registro A
3. Google OAuth Client ID criado no [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Adicionar o domínio em **Authorized JavaScript origins** (ex: `https://iron.alcetus.com`)
   - Não precisa de redirect URIs porque usamos Google Identity Services no front, não OAuth code flow

## Sequência de deploy

### 1. Setup inicial da VPS (1x na vida)

Cole no terminal browser, dá enter:

```bash
curl -fsSL https://raw.githubusercontent.com/SEU-USUARIO/gym-alcetus/main/deploy/hostinger-setup.sh | sudo bash
```

Ou, se ainda não tem o repo público, copia o conteúdo de `hostinger-setup.sh` e cola direto.

Esse passo instala Docker, abre porta 80/443 no firewall.

### 2. Deploy do app

```bash
sudo bash <(curl -fsSL https://raw.githubusercontent.com/SEU-USUARIO/gym-alcetus/main/deploy/hostinger-app.sh)
```

Ele vai pedir:
- URL do repo Git (1ª vez)
- `GOOGLE_CLIENT_ID` (1ª vez)

E vai gerar `JWT_SECRET` automaticamente. Em seguida `docker compose build && up -d`.

App fica rodando em `127.0.0.1:3000` (interno, sem TLS).

### 3. nginx + HTTPS

```bash
sudo bash /opt/gym-alcetus/deploy/hostinger-tls.sh iron.seu-dominio.com seu@email.com
```

certbot pega cert Let's Encrypt e configura nginx como reverse proxy.

App fica disponível em `https://iron.seu-dominio.com`.

## Atualizar (depois de mudanças no código)

```bash
cd /opt/gym-alcetus
git pull
docker compose build
docker compose up -d
```

Ou simplesmente:

```bash
sudo bash /opt/gym-alcetus/deploy/hostinger-app.sh
```

(idempotente — re-roda os passos)

## Backup do banco

O SQLite mora num volume Docker (`gym-alcetus-data`). Pra fazer backup:

```bash
docker run --rm -v gym-alcetus-data:/data -v $(pwd):/backup alpine \
  sh -c "cp /data/gym-alcetus.db /backup/gym-alcetus-$(date +%Y%m%d-%H%M%S).db"
```

## Logs / debug

```bash
docker compose logs -f         # live
docker compose ps              # status
docker compose restart         # reiniciar
docker exec -it gym-alcetus sh  # entrar no container
```

## Imagens dos exercícios

As 44 fotos vêm pré-baixadas do [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (UNLICENSE — livre pra uso comercial) e ficam commitadas no repo em `server/data/exercise-images/*.jpg` (~2.8MB total). Quando o container sobe, o boot detecta os arquivos e popula automaticamente o campo `imagePath` no banco — é só funcionar.

### Adicionar mais imagens depois

Se você criar exercícios customizados ou quiser substituir alguma foto:

```bash
# 1. Coloca o arquivo em /opt/gym-alcetus/server/data/exercise-images/
#    seguindo a convenção: <exercise-id>.jpg (ou .png/.gif/.webp)
sudo cp minha-foto.jpg /opt/gym-alcetus/server/data/exercise-images/ex-meu-id.jpg

# 2. Reinicia o container (auto-detect roda no boot)
cd /opt/gym-alcetus && docker compose restart
```

### Re-baixar tudo (caso queira atualizar das fontes)

Pra ambientes de dev (precisa de `tsx` instalado, ou seja, deps de dev):

```bash
cd server
npm run images:fetch              # baixa tudo (substitui)
npm run images:fetch -- --skip-existing   # só os faltantes
npm run images:fetch:dry          # só lista o que faria, sem baixar
```

O mapping `IMAGE_HINTS` em `server/src/db/seed-data.ts` controla qual entry do free-exercise-db é usada pra cada exercício local.

## Custo / consumo

Em VPS de 1GB RAM (plano básico Hostinger), idle:

| Componente | RAM idle | Disco |
|---|---|---|
| Container Gym Alcetus | ~50–80 MB | ~150 MB (imagem) + DB (uns KBs) |
| nginx | ~10 MB | — |
| Sistema base Ubuntu | ~250 MB | — |
| **Total** | **~350 MB** | **<200 MB** |

Sobra muito espaço pra outros apps na mesma VPS.
