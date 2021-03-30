# Komenci Load Testing

## Running the tests

Build the tool:

```bash
yarn build
```

Run the load test, environments are defined in [artillery.yml](./artillery.yml).


```bash
yarn load-testing -e alfajores -o reports/alfajores-test-2020-11-01.json
```

Currently, these environments are supported:

- alfajores

When the test is over, use the report json file to generate the HTML version and open it:

```bash
yarn report reports/alfajores-test-2020-11-01.json
```
