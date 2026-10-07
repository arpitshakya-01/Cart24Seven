FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw
COPY src src
RUN ./mvnw -B -DskipTests package

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /workspace/target/easycart-backend-0.0.1-SNAPSHOT.jar app.jar
COPY uploads ./uploads
ENV FILE_UPLOAD_DIR=/app/uploads
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseSerialGC", "-XX:MaxRAMPercentage=65.0", "-jar", "/app/app.jar"]