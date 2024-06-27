import { crypto } from "k6/experimental/webcrypto";
global.crypto = { getRandomValues: crypto.getRandomValues };

import { group, check } from "k6";
import { scenario } from "k6/execution";
import http from "k6/http";
import sdk from "postman-collection";
import { faker } from "@faker-js/faker";
import _ from "lodash";
import { expect, should } from "chai";
should();

import g from "../globals.json";
import e from "../env.json";
import c from "../collection.json";

// postman libraries + require
import cryptojs from "crypto-js";
import moment from "moment";

function fakerequire(id) {
  switch (id) {
    case "crypto-js":
      return cryptojs;
    case "moment":
      return moment;
    default:
      throw new Error(
        `Can't load module '${id}', Node.js modules aren't supported in k6`,
      );
  }
}

function test(name, callback) {
  check(null, {
    [name]: () => {
      try {
        callback();
      } catch (e) {
        return false;
      }
      return true;
    },
  });
}

const newSeed = () =>
  Math.floor(Math.random() * (moment().unix() + scenario.iterationInTest))
    .toString(16)
    .toUpperCase();

export default function () {
  const collection = new sdk.Collection(c);
  const pm = {
    globals: new sdk.VariableScope(g),
    environment: new sdk.VariableScope(e),
    collectionVariables: collection.variables,
    expect,
    test,
  };
  runItem(collection, pm);
}

function runItem(item, pm) {
  group(item.name, function () {
    if (item.request) {
      const seed = newSeed();
      faker.seed(seed);

      pm.environment.set("seed", seed);
      pm.variables = new sdk.VariableScope();
      pm.request = item.request;

      executePreRequest(item, pm);
      executeRequest(item, pm);
      executeTests(item, pm);
    }
    if (item.items) item.items.each((i) => runItem(i, pm));
  });
}

function executePreRequest(item, pm) {
  item.getEvents("prerequest").forEach((event) => {
    const script = event.script.toSource();
    scopeEval(script, pm);
  });
}

function executeRequest(item, pm) {
  pm.variables.replaceIn(item);
  pm.environment.replaceIn(item);
  pm.globals.replaceIn(item);

  const headers = item.request.headers.reduce(
    (headers, h) => _.set(headers, h.key, h.value),
    {},
  );

  const response = http.request(
    item.request.method,
    item.request.url.toString(),
    getBody(item.request.body),
    { headers },
  );

  pm.response = {
    body: response.body,
    code: response.status,
    json: () => JSON.parse(response.body),
  };

  if (response.status >= 400) {
    console.error(
      `${item.name} => (${response.status_text}) : ${response.body}`,
    );
  }
}

function executeTests(item, pm) {
  item.getEvents("test").forEach((event) => {
    const script = event.script.toSource();
    scopeEval(script, pm);
  });
}

function scopeEval(script, pm) {
  return Function(
    `const pm = this.pm; const require = this.require; ${script}`,
  ).bind({ pm, require: fakerequire })();
}

function getBody(body) {
  if (!body) return;
  switch (body.mode) {
    case "raw":
      return body.raw;
  }
  throw new Error(`unsupported body mode: ${body.mode}`);
}

import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.2/index.js";
export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    "summary.html": htmlReport(data),
  };
}
