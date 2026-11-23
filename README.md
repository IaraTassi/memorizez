# ✨ MEMORIZEZ

**Organize seus estudos. Aprenda no seu ritmo.**

Uma aplicação desenvolvida a partir de uma experiência pessoal com o aprendizado por meio de flashcards, com o propósito de tornar o estudo mais organizado, consciente e consistente.

## 🌷 Como nasceu a ideia

O MEMORIZEZ nasceu da minha própria experiência utilizando sistemas de flashcards para estudar.

Ao utilizar esse tipo de ferramenta, percebi o quanto os cartões podem contribuir para a organização dos conteúdos e para a revisão do que foi aprendido. Ao mesmo tempo, senti falta de uma solução simples, com regras claras e uma experiência que respeitasse o processo de aprendizagem, sem interferir nele.

Foi a partir dessa percepção que surgiu a ideia de desenvolver o MEMORIZEZ: uma aplicação que reunisse organização, revisão e acompanhamento dos estudos, mantendo o foco no que considero essencial: o próprio aprendizado.

Meu propósito com o projeto também foi aprender na prática, transformar uma ideia em uma aplicação completa e aprofundar meus conhecimentos em desenvolvimento de software.

## 🎯 Objetivo e proposta de aprendizagem

O MEMORIZEZ foi pensado para apoiar a aprendizagem por meio de dois princípios importantes: a **recuperação ativa da informação** e a **revisão espaçada**.

### 🧠 Recuperação ativa

Antes de visualizar a resposta de um cartão, o usuário tem a oportunidade de tentar recuperar a informação por conta própria.

Esse esforço de lembrar, em vez de apenas reler ou reconhecer uma resposta apresentada, é conhecido como prática de recuperação (_retrieval practice_).

Pesquisas na área da psicologia cognitiva indicam que praticar a recuperação de informações pode favorecer a aprendizagem e a retenção ao longo do tempo.

### 🔁 Revisão espaçada

Em vez de concentrar todas as revisões em um único momento, o MEMORIZEZ organiza a retomada dos conteúdos em intervalos programados.

A proposta utiliza os seguintes estágios:

- 1 dia;
- 7 dias;
- 15 dias;
- 30 dias.

A revisão espaçada é uma estratégia estudada cientificamente e associada a melhores resultados de retenção quando comparada à concentração das sessões de estudo em um único período.

A combinação entre recuperação ativa e revisão espaçada busca proporcionar oportunidades para que o usuário pratique a lembrança dos conteúdos e retome o que aprendeu ao longo do tempo.

### 📊 Histórico de aprendizagem

O histórico permite acompanhar atividades realizadas, consultar respostas e observar a evolução dos estudos.

Mais do que registrar o que foi feito, essa funcionalidade busca ajudar o usuário a identificar possíveis lacunas no conhecimento, reconhecer conteúdos que precisam de mais atenção e refletir sobre seu próprio processo de aprendizagem.

## 🌷 Benefícios propostos

- **Organização:** reunir conteúdos em coleções e cartões.
- **Participação ativa:** estimular o usuário a tentar lembrar antes de consultar a resposta.
- **Continuidade:** distribuir as revisões ao longo do tempo.
- **Autonomia:** permitir sessões de estudo livre, sem interferir nas revisões programadas.
- **Acompanhamento:** consultar o histórico e identificar conteúdos que merecem atenção.
- **Clareza:** oferecer funcionalidades com comportamentos e regras definidos.

## 🌐 Acesso à aplicação

O MEMORIZEZ está organizado em aplicações hospedadas separadamente:
Documentação da API: A documentação do Swagger e a coleção do Postman estão passando por ajustes em razão das alterações realizadas na integração da autenticação JWT. Serão atualizadas após a conclusão e validação dessa integração.

- **Frontend:** [https://memorizez-memorizez.vercel.app](https://memorizez-memorizez.vercel.app)
- **Backend / API:** [https://memorizez.onrender.com](https://memorizez.onrender.com)
- **Documentação Swagger:** [Acessar Swagger UI](https://memorizez.onrender.com/swagger-ui/index.html)
- **Documentação Postman:** [Acessar documentação da API](https://documenter.getpostman.com/view/26225227/2sBYHbsbpQ)

## 🚀 Funcionalidades

- 👤 **Users:** cadastro, autenticação, consulta e exclusão de conta.
- 📚 **Collections:** criação, consulta, atualização e exclusão de coleções.
- 🗂️ **Cards:** criação e gerenciamento de cartões vinculados às coleções.
- 🔁 **Review:** revisões programadas, registro de respostas e acompanhamento do progresso.
- 🎓 **Free Study:** estudo livre dos cartões, independente das revisões programadas.
- 📖 **History:** consulta das atividades e dos registros de aprendizagem.

## 🧩 Arquitetura da aplicação

O MEMORIZEZ utiliza uma arquitetura cliente-servidor, com responsabilidades separadas entre frontend, backend e banco de dados.

- **Frontend:** responsável pela interface e pelas interações com o usuário.
- **Backend:** responsável pelas regras de negócio, autenticação, autorização, processamento das requisições e disponibilização da API REST.
- **Banco de dados:** responsável pela persistência das informações utilizando PostgreSQL.

A comunicação entre frontend e backend ocorre por meio de requisições HTTP. As aplicações são hospedadas separadamente, e a comunicação entre suas origens é controlada por meio de CORS.

### 🔐 Autenticação e segurança

A autenticação utiliza **JSON Web Token (JWT)**, com configuração stateless no backend, sem depender de sessões HTTP para manter a autenticação dos usuários.

O fluxo de autenticação funciona da seguinte forma:

1. O usuário informa suas credenciais na aplicação.
2. O backend valida os dados de autenticação.
3. Após o login bem-sucedido, a API retorna um token JWT.
4. O frontend armazena o token no `sessionStorage` do navegador.
5. Nas requisições que exigem autenticação, o token é enviado no cabeçalho `Authorization`, utilizando o formato `Bearer`.
6. O backend valida o token antes de permitir o acesso aos recursos protegidos.
7. Ao realizar logout, o frontend remove o token armazenado.

A assinatura e a validade dos tokens são configuradas no backend. O segredo utilizado na assinatura é mantido em variável de ambiente, não sendo disponibilizado no código-fonte público.

## 🛠️ Tecnologias utilizadas

### Backend

- Java 21
- Spring Boot 4
- Spring Security
- OAuth2 Resource Server e JWT
- Maven
- PostgreSQL 16
- Docker
- SpringDoc / OpenAPI

### Frontend

- HTML5
- CSS3
- JavaScript
- Bootstrap 5.3.8
- Google Fonts — Inter

## 🧰 Ferramentas de desenvolvimento e testes

- **Postman:** testes e documentação das requisições da API.
- **JUnit 5:** testes automatizados do backend.
- **Mockito:** simulação de dependências durante os testes.
- **Cypress:** testes End-to-End (E2E).
- **Jest:** testes automatizados do frontend.
- **JSDOM:** simulação do ambiente do navegador durante os testes.
- **DevTools:** inspeção da interface, análise de estilos e depuração das requisições.

## 🧪 Testes automatizados

Os testes fazem parte do processo de desenvolvimento e ajudam a verificar o comportamento das funcionalidades e a reduzir regressões durante as alterações no sistema.

O backend utiliza JUnit 5 e Mockito para testar regras de negócio, serviços, controladores e componentes da aplicação.

O frontend utiliza Jest e JSDOM para verificar o comportamento de módulos, componentes e funcionalidades da interface.

O projeto também conta com testes End-to-End utilizando Cypress, destinados à validação dos principais fluxos de utilização da aplicação.

## 🧠 Desafios e aprendizados

Desenvolver o MEMORIZEZ foi uma oportunidade de transformar uma ideia em um sistema completo e aprender por meio de problemas reais de desenvolvimento.

Durante esse processo, enfrentei desafios que exigiram pesquisa, experimentação, análise e revisão das soluções implementadas.

Entre os principais aprendizados, destaco:

- Desenvolvimento de uma aplicação com frontend, backend e banco de dados integrados.
- Construção e organização de uma API REST com Spring Boot.
- Modelagem de dados e persistência utilizando PostgreSQL.
- Configuração de ambientes e utilização do Docker.
- Implementação de autenticação e autorização com Spring Security e JWT.
- Migração de autenticação baseada em sessão para uma arquitetura stateless.
- Integração entre frontend e backend, incluindo tratamento de erros e questões relacionadas à política CORS.
- Desenvolvimento e manutenção de testes automatizados.
- Organização do código, refatoração e documentação técnica.
- Investigação de problemas de publicação e configuração do ambiente de produção.

Mais do que aprender tecnologias, o desenvolvimento me permitiu compreender melhor como diferentes partes de um sistema precisam trabalhar juntas.

Cada dificuldade representou uma oportunidade de pesquisar, testar possibilidades, rever decisões e evoluir tecnicamente.

## 📚 Documentação técnica

Cada módulo possui sua própria documentação, com instruções específicas de configuração, execução e testes.

- **[Backend — README](backend/memorizez/README.md):** configuração do ambiente, banco de dados, autenticação JWT, execução da API e testes.
- **[Frontend — README](frontend/memorizez/README.md):** tecnologias, dependências, execução da interface, integração com a API e testes automatizados.

## 📖 Referências sobre aprendizagem

- Carpenter, S. K.; Pan, S. C.; Butler, A. C. (2022). [The science of effective learning with spacing and retrieval practice](https://doi.org/10.1038/s44159-022-00089-1). _Nature Reviews Psychology_.
- McDermott, K. B. (2021). [Practicing Retrieval Facilitates Learning](https://doi.org/10.1146/annurev-psych-010419-051019). _Annual Review of Psychology_.

---

✨ Feito com carinho e dedicação.

**MEMORIZEZ** · Projeto de desenvolvimento de software

Desenvolvido por **Iara Tassi** · 2026
