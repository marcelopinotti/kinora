# Backend Spring Boot. Multi-stage: o Maven e o JDK ficam no estágio de build,
# a imagem final leva só o JRE + o jar.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# pom antes do src: mudar código não invalida o cache das dependências.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
# O repo não tem suíte de testes (nem dependências *-test no pom), então não há
# fase de teste para pular aqui — -DskipTests fica como garantia de que um teste
# adicionado no futuro não tente subir contra um Postgres que não existe no build.
RUN mvn -B -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app

# curl entra só para o HEALTHCHECK abaixo ter como consultar o actuator.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/kinora-*.jar app.jar

# Sem isto o JVM roda como root dentro do container: qualquer execução de código
# arbitrária na aplicação já começaria com o usuário mais privilegiado da imagem.
RUN useradd --system --uid 10001 --shell /usr/sbin/nologin kinora \
    && chown kinora:kinora /app/app.jar
USER kinora

EXPOSE 8080

# /actuator/health é público na SecurityConfig, então não precisa de token.
# start-period cobre o boot do Spring + Flyway sem contar como falha.
HEALTHCHECK --interval=15s --timeout=3s --start-period=45s --retries=5 \
    CMD curl -fsS http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
