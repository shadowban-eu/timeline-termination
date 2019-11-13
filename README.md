# Twitter TimelineTerminationBan Test

API and testing logics for #TimelineTerminationBan

Based on https://github.com/danielfsousa/express-rest-es2017-boilerplate/

## Requirements

 - [Node v7.6+](https://nodejs.org/en/download/current/) or [Docker](https://www.docker.com/)

## Getting Started

#### Install dependencies:

```bash
npm i
```

#### Set environment variables:

```bash
cp .env.example .env
```

## Running Locally

```bash
npm run dev
```

## Running in Production

```bash
npm run start
```

## Lint

```bash
# lint code with ESLint
npm run lint

# try to fix ESLint errors
npm run lint:fix

# lint and watch for changes
npm run lint:watch
```

## Test

```bash
# run all tests with Mocha
npm run test

# run unit tests
npm run test:unit

# run integration tests
npm run test:integration

# run all tests and watch for changes
npm run test:watch

# open nyc test coverage reports
npm run coverage
```

## Validate - runs at pre-commit

```bash
# run lint and tests
npm run validate
```

## Logs

```bash
# show logs in production
pm2 logs
```

## Documentation

```bash
# generate and open api documentation
npm run docs
```

## Docker (might not work, yet)

```bash
# run container locally
npm run docker:dev

# run container in production
npm run docker:prod

# run tests
npm run docker:test
```
