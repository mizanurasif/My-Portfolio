FROM node:22-alpine

COPY package.json /my-app/
COPY app /my-app/app/
COPY lib /my-app/lib/
COPY next.config.ts /my-app/
COPY tsconfig.json /my-app/
COPY public /my-app/public/
COPY postcss.config.mjs /my-app/

WORKDIR /my-app

RUN npm install
RUN npm run build
# Inside the mongo-network, mongodb is reachable by container name.
ENV MONGODB_URI="mongodb://admin:password@mongodb:27017/?authSource=admin"
ENV MONGODB_DB="user-account"
#ENV MONGO_DB_USERNAME=admin MONGO_DB_PWD=password
EXPOSE 3000
CMD ["npm", "start"]
