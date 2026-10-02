# HTTP e HTTPS

HTTP define comunicação, métodos e respostas. HTTPS é HTTP protegido por TLS. Usar GET/POST não liga HTTPS automaticamente.

## Desenvolvimento

`npm run dev` usa React em http://localhost:5173 e API em http://127.0.0.1:3000. Vite encaminha `/api` para a API, mantendo o navegador na mesma origem. Esta conexão local não é criptografada.

## HTTPS direto no Node (opcional)

1. Obtenha um certificado e a chave privada correspondentes. Para testes locais, uma ferramenta como mkcert pode emitir um certificado confiável para `localhost` e `127.0.0.1`, mas exige instalação e configuração de confiança no computador. Isso não foi feito nesta entrega.
2. Coloque-os em `backend/certs/localhost.pem` e `backend/certs/localhost-key.pem`.
3. Ajuste `backend/.env`:

```dotenv
NODE_ENV=production
HOST=127.0.0.1
PORT=3443
HTTPS_KEY_FILE=./certs/localhost-key.pem
HTTPS_CERT_FILE=./certs/localhost.pem
FRONTEND_ORIGINS=https://localhost:3443,https://127.0.0.1:3443
```

4. Execute `npm run build` e `npm start`.
5. Acesse https://localhost:3443. O navegador precisa confiar no certificado. O certificado deve corresponder ao hostname utilizado.

Com os dois caminhos preenchidos, o servidor usa `https.createServer` e exige TLS 1.2 ou superior. Sem os caminhos, usa HTTP. Uma configuração incompleta interrompe a inicialização.

Para voltar ao desenvolvimento padrão, remova as variáveis HTTPS, restaure `NODE_ENV=development`, `PORT=3000` e as origens HTTP do `.env.example`.

## Publicação

Também é possível terminar TLS em um proxy reverso com certificado válido e encaminhar para Node em loopback. Configure `NODE_ENV=production` e `FRONTEND_ORIGINS` com a origem HTTPS exata do site. Não exponha a porta HTTP interna publicamente. Limites por IP ficarão conservadoramente compartilhados pelo IP do proxy enquanto `trust proxy` não for configurado; só configure proxies conhecidos após definir a implantação.

Nenhum certificado, domínio, implantação pública ou renovação automática foi configurado nesta entrega. Não desative a validação TLS nem versione a chave privada.
