FROM mariadb:12.3
RUN apt-get update && apt-get install -y --no-install-recommends unzip tzdata && rm -rf /var/lib/apt/lists/*
COPY backup.sh restore.sh /usr/local/bin/
ENTRYPOINT ["sh", "/usr/local/bin/backup.sh"]
