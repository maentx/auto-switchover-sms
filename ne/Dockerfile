FROM node
WORKDIR /app
COPY ./package.json /app/package.json
RUN npm install
COPY . .
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/node", "ne.js"]
