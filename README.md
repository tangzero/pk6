# pk6

convert Postman scripts to k6

## Necessary files

you need to provide 3 files (just export from Postman):

- env.json
- globals.json
- collection.json

## Generate K6 script

```sh
npm i
npm run bundle
```

## Running

```sh
k6 run dist/postman-test.js
```
