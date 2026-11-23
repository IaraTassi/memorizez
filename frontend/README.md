# ✨ MEMORIZEZ Frontend

Interface web da aplicação **MEMORIZEZ**, desenvolvida para facilitar a organização de conteúdos e o aprendizado por meio de cartões de estudo (_flashcards_).

O frontend permite criar e organizar coleções, gerenciar cartões, realizar revisões programadas, estudar livremente e acompanhar o histórico de aprendizagem.

## 🌷 Funcionalidades

- 👤 **Users:** cadastro, autenticação, consulta e exclusão de conta.
- 📚 **Collections:** criação, consulta, atualização e exclusão de coleções.
- 🗂️ **Cards:** gerenciamento dos cartões de cada coleção.
- 🔁 **Review:** realização de revisões programadas.
- 🎓 **Free Study:** estudo livre dos cartões de uma coleção.
- 📖 **History:** consulta do histórico de estudos e acontecimentos relacionados aos cartões.

## 🌐 Acesso à aplicação

- **Interface web:** https://memorizez-memorizez.vercel.app
- **API:** https://memorizez.onrender.com
- **Documentação Swagger:** https://memorizez.onrender.com/swagger-ui/index.html
- **Documentação Postman:** https://documenter.getpostman.com/view/26225227/2sBYHbsbpQ

## 🛠️ Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript
- Bootstrap 5.3.8
- Google Fonts (Inter)
- Jest 30.5.2
- JSDOM

## 📋 Pré-requisitos

- Node.js e npm.
- Navegador atualizado.
- Visual Studio Code (recomendado).
- Backend do MEMORIZEZ disponível para integração.

## 🚀 Como executar localmente

### 1. Acessar o diretório

```bash
cd frontend/memorizez
```

### 2. Instalar as dependências

```bash
npm install
```

### 3. Iniciar o frontend

O projeto utiliza páginas HTML, CSS e JavaScript, sem necessidade de processo de build.

Para executar localmente, abra o projeto no Visual Studio Code e utilize a extensão **Live Server**, iniciando a aplicação pela porta `5500`.

Acesse:

```text
http://localhost:5500
```

### 4. Configuração da API

A comunicação com o backend é centralizada no arquivo `js/core/api.js`.

No ambiente local, quando executado pelo Live Server na porta `5500`, o frontend direciona as requisições para:

```text
http://localhost:8080
```

Em produção, as requisições são direcionadas para a API hospedada no Render:

```text
https://memorizez.onrender.com
```

A integração entre frontend e backend utiliza comunicação HTTP por meio de uma API REST, com configuração de CORS para permitir as requisições entre as origens autorizadas.

## 🔐 Autenticação JWT

A autenticação do MEMORIZEZ utiliza **JSON Web Token (JWT)**, permitindo o acesso às funcionalidades privadas sem depender de sessões HTTP no servidor.

O fluxo de autenticação funciona da seguinte forma:

1. O usuário informa suas credenciais na tela de login.
2. O frontend envia os dados para o endpoint de autenticação da API.
3. Após a validação das credenciais, o backend retorna um token JWT.
4. O frontend armazena o token no `sessionStorage` do navegador.
5. Nas requisições às funcionalidades privadas, o token é enviado no cabeçalho `Authorization`, utilizando o formato `Bearer`.
6. Ao realizar logout, o token armazenado é removido.

O gerenciamento da autenticação no frontend é centralizado nos arquivos:

- `js/core/auth.js`: gerenciamento do token.
- `js/core/api.js`: comunicação com a API e envio do token nas requisições.
- `js/core/session.js`: controle da autenticação e do estado da sessão no frontend.

O token possui validade configurada no backend. O segredo utilizado para sua assinatura é mantido exclusivamente no ambiente do servidor, por meio da variável de ambiente `JWT_SECRET`.

## 🧪 Testes automatizados

O projeto utiliza **Jest** com **JSDOM** para executar os testes automatizados do frontend.

Para executar os testes:

```bash
npm test
```

Os testes abrangem funcionalidades como autenticação, gerenciamento de coleções e cartões, estudos, revisões, histórico, componentes da interface, layout privado e comunicação com a API.

## 🔗 Integração com o Backend

O frontend consome a API REST do MEMORIZEZ, desenvolvida em Java com Spring Boot.

A comunicação entre as aplicações contempla:

- Requisições HTTP para operações de cadastro, consulta, atualização e exclusão de dados.
- Autenticação e autorização por meio de tokens JWT.
- Envio do token de acesso no cabeçalho `Authorization` das requisições privadas.
- Tratamento de erros e respostas da API.
- Comunicação entre diferentes origens por meio de CORS.

O backend e o frontend são mantidos em projetos separados e possuem hospedagem independente.

## 💡 Sobre o projeto

O MEMORIZEZ foi desenvolvido com foco na organização dos estudos e na aprendizagem contínua, oferecendo recursos para criação de coleções, gerenciamento de cartões, revisão de conteúdos e acompanhamento do histórico de estudos.

---

✨ Feito com carinho e dedicação.

**MEMORIZEZ** · Projeto de desenvolvimento de software

Desenvolvido por **Iara Tassi** · 2026
