# Como pegar o `GOOGLE_CLIENT_ID` (passo-a-passo)

O Iron Track usa **Google Identity Services** (Sign-in with Google). Você só precisa de **uma coisa**: o `GOOGLE_CLIENT_ID`. Sem `client_secret`, sem redirect URIs (porque a verificação acontece direto via ID token).

Tempo total: ~5 minutos.

---

## Se você já tem um Google OAuth app

Pula direto pro **passo 4** (adicionar a origem autorizada do Iron Track) e copia o Client ID que já existe.

---

## 1. Acessar o Google Cloud Console

Abre: https://console.cloud.google.com/

Logue com a conta Google que você quer usar pra administrar o app (não precisa ser a mesma do login no Iron Track).

## 2. Criar (ou escolher) um projeto

- Topo da página, clica no seletor de projetos
- "Novo projeto" → nome livre, ex: "Iron Track"
- Esperar uns 10s pra criar
- Selecionar o projeto novo

## 3. Configurar a tela de consentimento OAuth

Antes de criar credenciais, o Google exige que você defina como o popup de login vai aparecer pro usuário.

- Menu esquerdo → **APIs e Serviços** → **Tela de consentimento OAuth**
- Tipo: **Externo** (pra qualquer conta Google poder logar) → **Criar**
- Preenche:
  - **Nome do app**: Iron Track
  - **E-mail de suporte**: seu e-mail
  - **Logotipo**: opcional
  - **Domínio do app**: seu domínio (ex: `iron.alcetus.com`) — quando tiver
  - **E-mails de contato do desenvolvedor**: seu e-mail
- Próxima → **Escopos**: deixa vazio, próxima
- **Usuários de teste**: opcional (você pode adicionar e-mails específicos pra testar antes de publicar)
- Voltar pro dashboard

> Dica: o app fica em "Modo de teste" por padrão — só usuários de teste cadastrados conseguem logar. Pra liberar geral, depois você publica em **Painel** → **Publicar app**. Pra você usar sozinho, deixa em modo teste e adiciona seu próprio e-mail.

## 4. Criar a credencial OAuth

- Menu esquerdo → **APIs e Serviços** → **Credenciais**
- Botão **+ Criar credenciais** (topo) → **ID do cliente OAuth**
- Tipo de aplicativo: **Aplicativo da Web**
- Nome: livre (ex: "Iron Track Web")
- **Origens JavaScript autorizadas** — adicione todas as URLs onde o app vai rodar:
  - `https://iron.SEU-DOMINIO.com` (produção, depois do TLS estar instalado)
  - `http://localhost:5173` (dev local com Vite)
  - `http://127.0.0.1:5173` (dev local — alguns sistemas resolvem `localhost` diferente)
- **URIs de redirecionamento autorizados**: deixa **vazio** (não usamos OAuth code flow)
- **Criar**

Vai aparecer um popup com **ID do cliente** e **Chave secreta do cliente**:
- Copia o **ID do cliente** (formato: `123456789-abcdefghijk.apps.googleusercontent.com`)
- A chave secreta **não é necessária** pro Iron Track

## 5. Salvar no `.env` da VPS

SSH na VPS (ou terminal browser do painel Hostinger) e edita o `.env`:

```bash
nano /opt/iron-track/server/.env
```

Substitui o valor placeholder pelo Client ID real:

```
GOOGLE_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
```

Salva (`Ctrl+O`, `Enter`, `Ctrl+X`) e recria o container:

```bash
cd /opt/iron-track
docker compose up -d --force-recreate
```

## 6. Configurar o frontend pra conhecer o Client ID

O frontend precisa do Client ID em **build time** via `VITE_GOOGLE_CLIENT_ID`. No Iron Track o build do frontend já roda dentro do Dockerfile, então adiciona como build arg no `docker-compose.yml`:

Edita `docker-compose.yml`:

```yaml
services:
  app:
    build:
      context: .
      args:
        VITE_GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
    # ... resto igual
```

E no `Dockerfile`, na etapa `frontend-builder`, recebe o arg:

```dockerfile
FROM node:22-alpine AS frontend-builder
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
WORKDIR /app
# ... resto igual
```

(Esses dois trechos já vão no próximo deploy.)

Rebuild:

```bash
docker compose build --no-cache app
docker compose up -d
```

## 7. Testar

Abre `https://iron.SEU-DOMINIO.com` num navegador, clica em **Continuar com Google**, escolhe sua conta. Se o popup do Google aparece, escolhe a conta, e o app te redireciona pro onboarding — está tudo certo.

### Se der erro `400: redirect_uri_mismatch`

Não usamos redirect URI. Esse erro indica que o popup tá tentando usar OAuth code flow em vez de Identity Services. Confere se você não publicou um Client ID com **URIs de redirecionamento** preenchidos — eles devem ficar **vazios** pro nosso fluxo.

### Se der erro `idpiframe_initialization_failed: Not a valid origin`

A URL onde o app está rodando não está na lista de **Origens JavaScript autorizadas**. Volta no Google Cloud Console (passo 4) e adiciona.

### Se o botão do Google não aparece

Confira se `VITE_GOOGLE_CLIENT_ID` está chegando no build. Pode debugar no devtools: `import.meta.env.VITE_GOOGLE_CLIENT_ID` (acessa `console` do browser e digita `import.meta.env`).

---

## Quando publicar pro mundo

Enquanto estiver em "Modo de teste", só os e-mails que você adicionou em **Tela de consentimento → Usuários de teste** conseguem logar. Pra liberar geral:

- Tela de consentimento → **Publicar app** → **Confirmar**
- O Google pode pedir verificação se o app fica famoso (escopos sensíveis), mas pro Sign-in básico geralmente não exige

## Custos

**Zero**. O Google Identity Services e a verificação de ID token são gratuitos pra qualquer volume de uso pessoal.
