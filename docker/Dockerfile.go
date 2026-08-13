FROM golang:1.22-alpine

RUN addgroup -S sandbox && adduser -S sandbox -G sandbox

WORKDIR /tmp
USER sandbox

CMD ["go", "run", "main.go"]