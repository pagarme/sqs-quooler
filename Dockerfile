FROM node:latest

ADD . /code
WORKDIR /code

RUN npm install

CMD ["npm", "test"]

