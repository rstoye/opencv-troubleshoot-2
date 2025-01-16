FROM urielch/opencv-nodejs:6.2.5-alpine  AS base

RUN apk update && \
    apk upgrade && \
    apk add --no-cache tini alpine-sdk cmake linux-headers

FROM base AS builder

WORKDIR /usr/src/app

COPY package.json ./
COPY . .

ENV NODE_ENV=development

RUN sed -i -r "s/\"@u4\/opencv4nodejs\": \".+\",//g" package.json
RUN npm install && npm cache clean --force
RUN npm link @u4/opencv4nodejs

RUN npm run build && npm prune --prod

FROM base AS runner

WORKDIR /usr/src/app

# Copy only necessary artifacts from the builder stage
# Use COPY, prevent usage of ADD
COPY --from=builder /usr/src/app/dist ./
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Re-iterating environment variables as required
# Define useful defaults for production usage
ENV NODE_ENV=production

# adding globally installed modules to the node path
ENV NODE_PATH=/usr/local/lib/node_modules/

# Use Array Syntax for shell commands
# Use tini as the entrypoint to handle PID 1 responsibilities
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "main.js"]
