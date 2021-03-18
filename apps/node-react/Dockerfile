FROM node as react_build
WORKDIR /app
COPY . /app
RUN npm install
RUN npm install react-scripts -g
RUN npm run build
CMD ["node", "server.js"]

