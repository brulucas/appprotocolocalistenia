# Publicar no Cloudflare Pages

## Estrutura

- `index.html`: app com tela de e-mail e verificação de acesso.
- `functions/api/check-access.js`: endpoint `POST /api/check-access`.
- `functions/api/hotmart-webhook.js`: endpoint `POST /api/hotmart-webhook`.
- `wrangler.toml`: configuração do binding KV.
- `sw.js`, `manifest.json` e `icons/`: PWA offline instalável.
- `assets/`, `pdf/` e `pdfs/`: bundle e materiais originais.

## 1. Criar o KV

1. Instale e autentique o Wrangler:

```bash
npm install -g wrangler
wrangler login
```

2. Crie os namespaces:

```bash
wrangler kv namespace create ACCESS_KV
wrangler kv namespace create ACCESS_KV --preview
```

3. Copie os IDs retornados para `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "ACCESS_KV"
id = "ID_DE_PRODUCAO"
preview_id = "ID_DE_PREVIEW"
```

## 2. Configurar o segredo

No Cloudflare Pages, abra **Settings → Environment variables** e crie:

```text
HOTMART_HOTTOK=seu_hottok_da_configuracao_do_webhook
```

Configure em **Production** e, se quiser testar previews, também em **Preview**.

## 3. Publicar com GitHub

1. Envie todos os arquivos deste pacote para um repositório GitHub.
2. No Cloudflare, abra **Workers & Pages → Create application → Pages → Connect to Git**.
3. Selecione o repositório.
4. Como o site é estático, deixe o build vazio e use `.` como diretório de saída.
5. Salve o projeto e faça o primeiro deploy.
6. Em **Settings → Functions → KV namespace bindings**, crie o binding:
   - Variable name: `ACCESS_KV`
   - Namespace: o KV de produção criado no passo anterior.
7. Faça um novo deploy depois de salvar o binding.

## 4. Publicar com Wrangler

Na raiz do pacote:

```bash
npm install -g wrangler
wrangler login
wrangler pages project create calistenia-militar
wrangler pages deploy . --project-name calistenia-militar
```

Para Functions e bindings, mantenha a pasta `functions/` e o `wrangler.toml` na raiz do projeto. Confira no painel do Pages se o binding `ACCESS_KV` está conectado ao projeto.

## 5. URLs finais

Depois do deploy, substitua `SEU-SITE.pages.dev`:

```text
https://SEU-SITE.pages.dev/api/check-access
https://SEU-SITE.pages.dev/api/hotmart-webhook
```

Use a segunda URL na configuração de webhook da Hotmart. O código valida `X-HOTMART-HOTTOK`, concede somente quando o evento é `PURCHASE_APPROVED` ou `PURCHASE_COMPLETE` com `data.purchase.status = APPROVED`, e remove em reembolso, chargeback, cancelamento, expiração ou protesto.

## 6. IDs de produto

- Principal: `8624726`
- Bono 1: `8625421`
- Bono 2: `8625342`
- Bono 3: `8625393`

Os links dos botões de checkout continuam usando os códigos de oferta originais.

## 7. Teste sem compra

```bash
curl -i -X POST "https://SEU-SITE.pages.dev/api/hotmart-webhook" \
  -H "Content-Type: application/json" \
  -H "X-HOTMART-HOTTOK: SEU_HOTMART_HOTTOK" \
  -d '{"event":"PURCHASE_APPROVED","data":{"product":{"id":8624726},"purchase":{"status":"APPROVED"},"buyer":{"email":"teste@example.com"}}}'
```

Depois consulte:

```bash
curl -X POST "https://SEU-SITE.pages.dev/api/check-access" \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@example.com"}'
```

Resposta esperada:

```json
{"email":"teste@example.com","products":["8624726"]}
```
