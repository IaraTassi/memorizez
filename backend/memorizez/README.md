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
- Maven
- PostgreSQL 16
- Docker
- SpringDoc / OpenAPI

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

Na pasta `backend/memorizez`, execute:

```powershell
.\mvnw.cmd spring-boot:run
```

Para compilar o projeto:

```powershell
.\mvnw.cmd clean compile
```

> 🔐 Configure as variáveis de ambiente exigidas pela aplicação antes de iniciar o backend. Não publique senhas, tokens ou arquivos `.env` com credenciais reais.

## ☕ Testes do Backend — JUnit 5 e Mockito

O backend utiliza **JUnit 5** para executar testes automatizados e **Mockito** para simular dependências, permitindo verificar o comportamento dos componentes de forma isolada.

Entre os testes existentes estão:

- Carregamento do contexto da aplicação Spring Boot.
- Carregamento dos dados de usuário pelo e-mail.
- Tratamento de usuários não encontrados.

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

A API possui documentação interativa e uma coleção de requisições no Postman:

- 🔎 [Swagger UI — MemorizeZ](https://memorizez.onrender.com/swagger-ui/index.html)
- 🌐 [Postman — API MemorizeZ](https://documenter.getpostman.com/view/26225227/2sBYHbsbpQ)

## 💗 Observações de desenvolvimento

- O banco PostgreSQL local é executado pelo Docker Compose.
- O ambiente E2E utiliza banco de dados e portas separados do ambiente de desenvolvimento.
- Não compartilhe credenciais, cookies de sessão ou tokens CSRF.
- Preserve os volumes do Docker quando precisar manter os dados locais.

---

✨ Feito com carinho e dedicação.

**MEMORIZEZ** · Projeto de desenvolvimento de software

Desenvolvido por **Iara Tassi** · 2026