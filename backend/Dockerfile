FROM rust:slim-bookworm

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends pkg-config libssl-dev ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN cargo install cargo-watch --locked

COPY Cargo.toml Cargo.lock* ./
COPY migrations ./migrations
COPY src ./src

RUN cargo build

CMD ["cargo", "watch", "-x", "run"]
