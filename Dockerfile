# Use node version v20.17.0
FROM node:20.17.0@sha256:db5dd2f30cb82a8bdbd16acd4a8f3f2789f5b24f6ce43f98aa041be848c82e45 AS dependencies

LABEL maintainer="Jivin Chugh <jivinchugh18@gmail.com>" \
      description="Fragments UI frontend"

# We default to use port 1234 in our service
ENV PORT=1234 \
# Reduce npm spam when installing within Docker
NPM_CONFIG_LOGLEVEL=warn \
# Disable colour when run inside Docker
NPM_CONFIG_COLOR=false \
NODE_ENV=production

# Use /app as our working directory
WORKDIR /app

# Copy the package.json and package-lock.json files into /app (the working directory).
COPY package* .

# Install node dependencies defined in package-lock.json
RUN npm ci --only=production

########################################################################################################################


FROM nginx:1.26.2-alpine@sha256:5b44a5ab8ab467854f2bf7b835a32f850f32eb414b749fbf7ed506b139cd8d6b AS deploy

WORKDIR /app

# Copy the rest of the application code to the working directory
COPY . .


# Define build arguments
ARG API_URL
ARG AWS_COGNITO_POOL_ID
ARG AWS_COGNITO_CLIENT_ID
ARG AWS_COGNITO_HOSTED_UI_DOMAIN
ARG OAUTH_SIGN_IN_REDIRECT_URL
ARG OAUTH_SIGN_OUT_REDIRECT_URL

# Set environment variables
ENV API_URL=$API_URL
ENV AWS_COGNITO_POOL_ID=$AWS_COGNITO_POOL_ID
ENV AWS_COGNITO_CLIENT_ID=$AWS_COGNITO_CLIENT_ID
ENV AWS_COGNITO_HOSTED_UI_DOMAIN=$AWS_COGNITO_HOSTED_UI_DOMAIN
ENV OAUTH_SIGN_IN_REDIRECT_URL=$OAUTH_SIGN_IN_REDIRECT_URL
ENV OAUTH_SIGN_OUT_REDIRECT_URL=$OAUTH_SIGN_OUT_REDIRECT_URL

EXPOSE 80