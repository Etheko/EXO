# Stage 1: Build the application using Maven
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
# Copy the pom.xml file to download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline
# Copy the rest of the source code
COPY src ./src
# Build the application, creating the JAR file
RUN mvn package -DskipTests

# Stage 2: Create the final, smaller runtime image
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
# Copy the JAR file from the build stage
COPY --from=build /app/target/*.jar app.jar
# The PORT environment variable is automatically set by Render.
# Spring Boot will automatically use it.
# Set the entrypoint to run the application
ENTRYPOINT ["java", "-jar", "app.jar"] 