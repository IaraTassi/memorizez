
# Etapa de compilação
FROM eclipse-temurin:21-jdk AS build

WORKDIR /app

# Arquivos do Maven Wrapper e configuração do backend
COPY backend/memorizez/.mvn/ backend/memorizez/.mvn/
COPY backend/memorizez/mvnw backend/memorizez/pom.xml backend/memorizez/

WORKDIR /app/backend/memorizez

RUN chmod +x mvnw
RUN ./mvnw -B dependency:go-offline

# Código-fonte do backend
COPY backend/memorizez/src/ src/

# Frontend original
COPY frontend/memorizez/ /app/frontend/memorizez/

# Compilação e empacotamento
RUN ./mvnw -B clean package -DskipTests

# Etapa de execução
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/backend/memorizez/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
