FROM postgres:18.0

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    postgresql-server-dev-all \
    && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/pgpartman/pg_partman.git \
    && cd pg_partman \
    && make install \
    && cd .. \
    && rm -rf pg_partman

# Clone and install pgvector
RUN git clone --branch v0.8.2 https://github.com/pgvector/pgvector.git \
    && cd pgvector \
    && make \
    && make install \
    && cd .. \
    && rm -rf pgvector

RUN apt-get update && apt-get install -y postgresql-18-cron \
    || echo "pg_cron package not found, skipping (or build from source if needed)"
