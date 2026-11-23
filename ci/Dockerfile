# Image the Jenkinsfile runs the build and unit tests in: the same Node as the app's
# Dockerfile, plus Chromium for Karma (karma.conf.js launcher ChromeHeadlessCI)
FROM node:22.12
RUN apt-get update \
    && apt-get install -y --no-install-recommends chromium \
    && rm -rf /var/lib/apt/lists/*
ENV CHROME_BIN=/usr/bin/chromium
