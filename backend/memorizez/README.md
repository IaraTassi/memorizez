# ✨ MEMORIZEZ Backend

*Uma aplicação para organizar coleções de cartões e tornar o aprendizado mais consistente.*

O **MEMORIZEZ** é uma aplicação desenvolvida com Java e Spring Boot. Seu backend disponibiliza uma API REST para gerenciamento de usuários, coleções, cartões, revisão programada, estudo livre e histórico.

---

## 🌷 Funcionalidades

- 👤 **Users:** cadastro, autenticação, consulta e exclusão de conta.
- 📚 **Collections:** criação, consulta, atualização e exclusão de coleções.
- 🗂️ **Cards:** gerenciamento dos cartões de cada coleção.
- 🔁 **Review:** recursos relacionados à revisão programada.
- 🎓 **Free Study:** estudo livre dos cartões de uma coleção.
- 📖 **History:** consulta do histórico de estudos.

## 🌐 API em Produção

A API do MEMORIZEZ está publicada em:

- **Base URL:** https://memorizez.onrender.com

## 🛠️ Tecnologias

- Java 21
- Spring Boot 4
- Spring Security
- OAuth2 Resource Server / JWT
- Maven
- PostgreSQL 16
- Docker
- SpringDoc / OpenAPI

## 🔐 Autenticação JWT

A API utiliza autenticação baseada em **JSON Web Token (JWT)**, com configuração stateless por meio do Spring Security.

O fluxo de autenticação funciona da seguinte forma:

1. O usuário envia suas credenciais para o endpoint de login (`POST /users/login`).
2. O backend valida as credenciais e retorna um token JWT.
3. O frontend armazena o token durante a sessão de navegação.
4. Nas requisições aos endpoints protegidos, o frontend envia o token no cabeçalho `Authorization`, utilizando o formato `Bearer`.
5. O backend valida o token antes de permitir o acesso aos recursos protegidos.
6. Ao sair da aplicação, o frontend remove o token armazenado.

A chave utilizada para assinatura dos tokens é configurada por meio da variável de ambiente `JWT_SECRET`.

> 🔒 A chave JWT deve ser mantida em ambiente seguro e nunca deve ser publicada no repositório ou compartilhada. Não utilize valores reais de credenciais em arquivos de configuração versionados.

## 🧪 Ferramentas de desenvolvimento e testes

- **Postman:** testes e documentação das requisições da API.
- **JUnit 5:** execução de testes automatizados do backend.
- **Mockito:** simulação de dependências durante os testes.
- **Cypress:** testes automatizados End-to-End (E2E).

## 📋 Pré-requisitos

Antes de iniciar, instale:

- [Java 21](https://www.oracle.com/java/technologies/downloads/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js e npm](https://nodejs.org/) — necessários para executar os testes E2E com Cypress.
- [Git](https://git-scm.com/)

O projeto inclui o Maven Wrapper (`mvnw`), utilizado nos comandos abaixo no Windows. Não é necessário instalar o Maven separadamente.

## 🐘 Banco de dados

O ambiente de desenvolvimento utiliza PostgreSQL 16 em um container Docker.

Abra um terminal na pasta `backend/memorizez`, onde está o arquivo `docker-compose.yml`.

### Iniciar o banco

```powershell
docker compose up -d
```

### Verificar o container

```powershell
docker compose ps
```

### Acessar o PostgreSQL

```powershell
docker exec -it memorizez-postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Dentro do PostgreSQL, para listar as tabelas:

```sql
\dt
```

Para sair:

```sql
\q
```

### Parar o banco

```powershell
docker compose down
```

> 💡 `docker compose down` encerra e remove o container e a rede do Compose, mas preserva os volumes. Evite `docker compose down -v` se não quiser apagar os dados persistidos.

## ⚙️ Executar o backend

Na pasta `backend/memorizez`, configure as variáveis de ambiente exigidas pela aplicação, incluindo as credenciais do banco de dados e a chave `JWT_SECRET`.

Em seguida, execute:

```powershell
.\mvnw.cmd spring-boot:run
```

Para compilar o projeto:

```powershell
.\mvnw.cmd clean compile
```

> 🔐 Não publique senhas, tokens, chaves de assinatura ou arquivos `.env` com credenciais reais.

## ☕ Testes do Backend — JUnit 5 e Mockito

O backend utiliza **JUnit 5** para executar testes automatizados e **Mockito** para simular dependências, permitindo verificar o comportamento dos componentes de forma isolada.

A suíte contempla testes relacionados aos componentes e serviços da aplicação, incluindo autenticação, usuários e funcionalidades de estudo.

### Executar todos os testes

Na pasta `backend/memorizez`, execute:

```powershell
.\mvnw.cmd test
```

### Executar um teste específico

Exemplo:

```powershell
.\mvnw.cmd test "-Dtest=CustomUserDetailsServiceTest"
```

### Compilar sem executar os testes

```powershell
.\mvnw.cmd clean compile
```

## 🌐 Testes End-to-End (E2E)

Os testes E2E utilizam um ambiente separado do ambiente de desenvolvimento:

| Serviço | Endereço |
|---|---|
| PostgreSQL E2E | `localhost:5433` |
| Backend E2E | `http://localhost:8081` |
| Cypress | Executado localmente |

### 1. Iniciar o banco E2E

Abra um terminal na pasta `backend/memorizez/e2e`:

```powershell
docker compose up -d
```

Verifique o container:

```powershell
docker compose ps
```

O container esperado é `memorizez-e2e-postgres`.

### 2. Instalar as dependências do Cypress

Na pasta `backend/memorizez/e2e`, execute:

```powershell
npm install
```

### 3. Iniciar o backend com o perfil E2E

Em outro terminal, na pasta `backend/memorizez`, execute:

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=e2e" "-Dspring-boot.run.arguments=--server.port=8081"
```

O backend E2E utiliza a porta `8081` e se conecta ao PostgreSQL E2E na porta `5433`. Não é necessário iniciar o backend normal na porta `8080` para executar esses testes.

### 4. Executar o Cypress

Em um terceiro terminal, na pasta `backend/memorizez/e2e`, execute:

```powershell
npx cypress open
```

Selecione **E2E Testing** e, em seguida, escolha o teste desejado na pasta `cypress/e2e/`.

### 5. Encerrar o ambiente E2E

Interrompa o backend com `Ctrl + C`. Depois, na pasta `backend/memorizez/e2e`, execute:

```powershell
docker compose down
```

Esse comando preserva o volume do banco. Para remover também os dados persistidos do banco E2E, utilize `docker compose down -v` somente quando realmente desejar apagá-los.

## 📖 Documentação da API

A API possui documentação interativa pelo Swagger UI e uma coleção de requisições no Postman:

- 🔎 [Swagger UI — MEMORIZEZ](https://memorizez.onrender.com/swagger-ui/index.html)
- 🌐 [Postman — API MEMORIZEZ](https://documenter.getpostman.com/view/26225227/2sBYHbsbpQ)

> 📝 A documentação do Swagger e a coleção do Postman estão passando por ajustes em razão das alterações realizadas na integração da autenticação JWT. Serão atualizadas após a conclusão e validação dessa integração.

## 💗 Observações de desenvolvimento

- O banco PostgreSQL local é executado pelo Docker Compose.
- O ambiente E2E utiliza banco de dados e portas separados do ambiente de desenvolvimento.
- A autenticação da API utiliza tokens JWT enviados no cabeçalho `Authorization`.
- Mantenha a chave `JWT_SECRET` e as credenciais do banco de dados protegidas.
- Não compartilhe tokens de autenticação.
- Preserve os volumes do Docker quando precisar manter os dados locais.

---

✨ Feito com carinho e dedicação.

**MEMORIZEZ** · Projeto de desenvolvimento de software

Desenvolvido por **Iara Tassi** · 2026