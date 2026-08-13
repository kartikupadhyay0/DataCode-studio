FROM eclipse-temurin:21-jdk-alpine

RUN addgroup -S sandbox && adduser -S sandbox -G sandbox

WORKDIR /tmp
USER sandbox

CMD ["javac", "Main.java", "&&", "java", "Main"]