# Stage 1: Build environment
FROM node:latest as build-env
# Set the working directory
WORKDIR /app
# Copy the current directory into the container
COPY . .
# Install dependencies using yarn
RUN yarn install
# Build the project
RUN yarn run build
# Stage 2: Production environment
FROM nginx:alpine
# Copy the build output from the build-env stage to the nginx container
COPY --from=build-env /app/dist /usr/share/nginx/html
# Expose port 80
EXPOSE 80
# Command to start the nginx server
CMD ["nginx", "-g", "daemon off;"]
