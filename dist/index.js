"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/index.ts
var lib_exports = {};
__export(lib_exports, {
  AbstractSearch: () => AbstractSearch,
  ArrayHashInput: () => ArrayHashInput,
  Circle: () => Circle,
  Client: () => Client,
  EntityId: () => EntityId,
  EntityKeyName: () => EntityKeyName,
  Field: () => Field,
  FieldNotInSchema: () => FieldNotInSchema,
  InvalidHashInput: () => InvalidHashInput,
  InvalidHashValue: () => InvalidHashValue,
  InvalidInput: () => InvalidInput,
  InvalidJsonInput: () => InvalidJsonInput,
  InvalidJsonValue: () => InvalidJsonValue,
  InvalidSchema: () => InvalidSchema,
  InvalidValue: () => InvalidValue,
  NestedHashInput: () => NestedHashInput,
  NullJsonInput: () => NullJsonInput,
  NullJsonValue: () => NullJsonValue,
  PointOutOfRange: () => PointOutOfRange,
  RawSearch: () => RawSearch,
  RedisOmError: () => RedisOmError,
  Repository: () => Repository,
  Schema: () => Schema,
  Search: () => Search,
  SearchError: () => SearchError,
  SemanticSearchError: () => SemanticSearchError,
  Where: () => Where,
  WhereField: () => WhereField
});
module.exports = __toCommonJS(lib_exports);

// lib/client/client.ts
var import_redis2 = require("redis");

// lib/entity/entity.ts
var EntityId = Symbol("entityId");
var EntityKeyName = Symbol("entityKeyName");

// lib/indexer/index-builder.ts
var import_redis = require("redis");
var entryBuilders = { HASH: addHashEntry, JSON: addJsonEntry };
function buildRediSearchSchema(schema) {
  const addEntry = entryBuilders[schema.dataStructure];
  return schema.fields.reduce(addEntry, {});
}
function addHashEntry(schema, field) {
  const hashField = field.hashField;
  switch (field.type) {
    case "boolean":
      schema[hashField] = buildHashBoolean(field);
      break;
    case "date":
      schema[hashField] = buildDateNumber(field);
      break;
    case "number":
      schema[hashField] = buildDateNumber(field);
      break;
    case "point":
      schema[hashField] = buildPoint(field);
      break;
    case "string[]":
    case "string":
      schema[hashField] = buildHashString(field);
      break;
    case "text":
      schema[hashField] = buildText(field);
      break;
  }
  return schema;
}
function addJsonEntry(schema, field) {
  const jsonPath = field.jsonPath;
  switch (field.type) {
    case "boolean":
      schema[jsonPath] = buildJsonBoolean(field);
      break;
    case "date":
      schema[jsonPath] = buildDateNumber(field);
      break;
    case "number":
    case "number[]":
      schema[jsonPath] = buildDateNumber(field);
      break;
    case "point":
      schema[jsonPath] = buildPoint(field);
      break;
    case "string":
    case "string[]":
      schema[jsonPath] = buildJsonString(field);
      break;
    case "text":
      schema[jsonPath] = buildText(field);
      break;
  }
  return schema;
}
function buildHashBoolean(field) {
  const schemaField = { type: import_redis.SchemaFieldTypes.TAG, AS: field.name };
  addSortable(schemaField, field);
  addIndexed(schemaField, field);
  return schemaField;
}
function buildJsonBoolean(field) {
  if (field.sortable)
    console.warn(`You have marked a boolean field as sortable but RediSearch doesn't support the SORTABLE argument on a TAG for JSON. Ignored.`);
  const schemaField = { type: import_redis.SchemaFieldTypes.TAG, AS: field.name };
  addIndexed(schemaField, field);
  return schemaField;
}
function buildDateNumber(field) {
  const schemaField = { type: import_redis.SchemaFieldTypes.NUMERIC, AS: field.name };
  addSortable(schemaField, field);
  addIndexed(schemaField, field);
  return schemaField;
}
function buildPoint(field) {
  const schemaField = { type: import_redis.SchemaFieldTypes.GEO, AS: field.name };
  addIndexed(schemaField, field);
  return schemaField;
}
function buildHashString(field) {
  const schemaField = { type: import_redis.SchemaFieldTypes.TAG, AS: field.name };
  addCaseInsensitive(schemaField, field), addSeparable(schemaField, field), addSortable(schemaField, field);
  addIndexed(schemaField, field);
  return schemaField;
}
function buildJsonString(field) {
  if (field.sortable)
    console.warn(`You have marked a ${field.type} field as sortable but RediSearch doesn't support the SORTABLE argument on a TAG for JSON. Ignored.`);
  const schemaField = { type: import_redis.SchemaFieldTypes.TAG, AS: field.name };
  addCaseInsensitive(schemaField, field), addSeparable(schemaField, field), addIndexed(schemaField, field);
  return schemaField;
}
function buildText(field) {
  const schemaField = { type: import_redis.SchemaFieldTypes.TEXT, AS: field.name };
  addSortable(schemaField, field);
  addStemming(schemaField, field);
  addIndexed(schemaField, field);
  addPhonetic(schemaField, field);
  addWeight(schemaField, field);
  return schemaField;
}
function addCaseInsensitive(schemaField, field) {
  if (field.caseSensitive)
    schemaField.CASESENSITIVE = true;
}
function addIndexed(schemaField, field) {
  if (!field.indexed)
    schemaField.NOINDEX = true;
}
function addStemming(schemaField, field) {
  if (!field.stemming)
    schemaField.NOSTEM = true;
}
function addPhonetic(schemaField, field) {
  if (field.matcher)
    schemaField.PHONETIC = field.matcher;
}
function addSeparable(schemaField, field) {
  schemaField.SEPARATOR = field.separator;
}
function addSortable(schemaField, field) {
  if (field.normalized) {
    if (field.sortable)
      schemaField.SORTABLE = true;
  } else {
    schemaField.SORTABLE = "UNF";
  }
}
function addWeight(schemaField, field) {
  if (field.weight)
    schemaField.WEIGHT = field.weight;
}

// lib/error/redis-om-error.ts
var RedisOmError = class extends Error {
};

// lib/error/invalid-input.ts
var InvalidInput = class extends RedisOmError {
};
var NullJsonInput = class extends InvalidInput {
  #field;
  constructor(field) {
    const message = `Null or undefined found in field '${field.name}' of type '${field.type}' in JSON at '${field.jsonPath}'.`;
    super(message);
    this.#field = field;
  }
  get fieldName() {
    return this.#field.name;
  }
  get fieldType() {
    return this.#field.type;
  }
  get jsonPath() {
    return this.#field.jsonPath;
  }
};
var InvalidJsonInput = class extends InvalidInput {
  #field;
  constructor(field) {
    const message = `Unexpected value for field '${field.name}' of type '${field.type}' in JSON at '${field.jsonPath}'.`;
    super(message);
    this.#field = field;
  }
  get fieldName() {
    return this.#field.name;
  }
  get fieldType() {
    return this.#field.type;
  }
  get jsonPath() {
    return this.#field.jsonPath;
  }
};
var InvalidHashInput = class extends InvalidInput {
  #field;
  constructor(field) {
    const message = `Unexpected value for field '${field.name}' of type '${field.type}' in Hash.`;
    super(message);
    this.#field = field;
  }
  get fieldName() {
    return this.#field.name;
  }
  get fieldType() {
    return this.#field.type;
  }
};
var NestedHashInput = class extends InvalidInput {
  #property;
  constructor(property) {
    const message = `Unexpected object in Hash at property '${property}'. You can not store a nested object in a Redis Hash.`;
    super(message);
    this.#property = property;
  }
  get field() {
    return this.#property;
  }
};
var ArrayHashInput = class extends InvalidInput {
  #property;
  constructor(property) {
    const message = `Unexpected array in Hash at property '${property}'. You can not store an array in a Redis Hash without defining it in the Schema.`;
    super(message);
    this.#property = property;
  }
  get field() {
    return this.#property;
  }
};

// lib/error/invalid-schema.ts
var InvalidSchema = class extends RedisOmError {
};

// lib/error/invalid-value.ts
var InvalidValue = class extends RedisOmError {
};
var NullJsonValue = class extends InvalidValue {
  #field;
  constructor(field) {
    const message = `Null or undefined found in field '${field.name}' of type '${field.type}' from JSON path '${field.jsonPath}' in Redis.`;
    super(message);
    this.#field = field;
  }
  get fieldName() {
    return this.#field.name;
  }
  get fieldType() {
    return this.#field.type;
  }
  get jsonPath() {
    return this.#field.jsonPath;
  }
};
var InvalidJsonValue = class extends InvalidValue {
  #field;
  constructor(field) {
    const message = `Unexpected value for field '${field.name}' of type '${field.type}' from JSON path '${field.jsonPath}' in Redis.`;
    super(message);
    this.#field = field;
  }
  get fieldName() {
    return this.#field.name;
  }
  get fieldType() {
    return this.#field.type;
  }
  get jsonPath() {
    return this.#field.jsonPath;
  }
};
var InvalidHashValue = class extends InvalidValue {
  #field;
  constructor(field) {
    const message = `Unexpected value for field '${field.name}' of type '${field.type}' from Hash field '${field.hashField}' read from Redis.`;
    super(message);
    this.#field = field;
  }
  get fieldName() {
    return this.#field.name;
  }
  get fieldType() {
    return this.#field.type;
  }
  get hashField() {
    return this.#field.hashField;
  }
};

// lib/error/point-out-of-range.ts
var PointOutOfRange = class extends RedisOmError {
  #latitude;
  #longitude;
  constructor(point) {
    super("Points must be between \xB185.05112878 latitude and \xB1180 longitude.");
    this.#longitude = point.longitude;
    this.#latitude = point.latitude;
  }
  get point() {
    return { longitude: this.#longitude, latitude: this.#latitude };
  }
};

// lib/error/search-error.ts
var SearchError = class extends RedisOmError {
};
var SemanticSearchError = class extends SearchError {
};
var FieldNotInSchema = class extends SearchError {
  #field;
  constructor(fieldName) {
    super(`The field '${fieldName}' is not part of the schema and thus cannot be used to search.`);
    this.#field = fieldName;
  }
  get field() {
    return this.#field;
  }
};

// lib/transformer/transformer-common.ts
var isNull = (value) => value === null;
var isDefined = (value) => value !== void 0;
var isUndefined = (value) => value === void 0;
var isNullish = (value) => value === void 0 || value === null;
var isNotNullish = (value) => value !== void 0 && value !== null;
var isBoolean = (value) => typeof value === "boolean";
var isNumber = (value) => typeof value === "number";
var isString = (value) => typeof value === "string";
var isDate = (value) => value instanceof Date;
var isDateString = (value) => isString(value) && !isNaN(new Date(value).getTime());
var isArray = (value) => Array.isArray(value);
var isObject = (value) => value !== null && typeof value === "object" && !isArray(value) && !isDate(value);
var isPoint = (value) => isObject(value) && Object.keys(value).length === 2 && typeof value.latitude === "number" && typeof value.longitude === "number";
var isNumberString = (value) => !isNaN(Number(value));
var isPointString = (value) => /^-?\d+(\.\d*)?,-?\d+(\.\d*)?$/.test(value);
var isValidPoint = (value) => Math.abs(value.latitude) <= 85.05112878 && Math.abs(value.longitude) <= 180;
var convertBooleanToString = (value) => value ? "1" : "0";
var convertNumberToString = (value) => value.toString();
var convertStringToNumber = (value) => Number.parseFloat(value);
var convertDateToEpoch = (value) => value.getTime() / 1e3;
var convertDateToString = (value) => convertDateToEpoch(value).toString();
var convertEpochDateToString = (value) => convertNumberToString(value);
var convertIsoDateToEpoch = (value) => convertDateToEpoch(new Date(value));
var convertIsoDateToString = (value) => convertDateToString(new Date(value));
var convertEpochStringToDate = (value) => new Date(convertEpochToDate(convertStringToNumber(value)));
var convertEpochToDate = (value) => new Date(value * 1e3);
var convertPointToString = (value) => {
  if (isValidPoint(value))
    return `${value.longitude},${value.latitude}`;
  throw new PointOutOfRange(value);
};
var convertStringToPoint = (value) => {
  const [longitude, latitude] = value.split(",").map(convertStringToNumber);
  return { longitude, latitude };
};

// lib/transformer/from-hash-transformer.ts
function fromRedisHash(schema, hashData) {
  const data = { ...hashData };
  schema.fields.forEach((field) => {
    if (field.hashField)
      delete data[field.hashField];
    const value = hashData[field.hashField];
    if (isNotNullish(value)) {
      data[field.name] = convertKnownValueFromString(field, value);
    } else if (isNullish(value) && field.type === "string[]") {
      data[field.name] = [];
    }
  });
  return data;
}
function convertKnownValueFromString(field, value) {
  switch (field.type) {
    case "boolean":
      if (value === "1")
        return true;
      if (value === "0")
        return false;
      throw new InvalidHashValue(field);
    case "number":
      if (isNumberString(value))
        return convertStringToNumber(value);
      throw new InvalidHashValue(field);
    case "date":
      if (isNumberString(value))
        return convertEpochStringToDate(value);
      throw new InvalidHashValue(field);
    case "point":
      if (isPointString(value))
        return convertStringToPoint(value);
      throw new InvalidHashValue(field);
    case "string":
    case "text":
      return value;
    case "string[]":
      return convertStringToStringArray(value, field.separator);
  }
}
var convertStringToStringArray = (value, separator) => value.split(separator);

// lib/transformer/from-json-transformer.ts
var import_jsonpath_plus = require("jsonpath-plus");
var import_just_clone = __toESM(require("just-clone"));
function fromRedisJson(schema, json) {
  const data = (0, import_just_clone.default)(json);
  convertFromRedisJsonKnown(schema, data);
  return data;
}
function convertFromRedisJsonKnown(schema, data) {
  schema.fields.forEach((field) => {
    const path = field.jsonPath;
    const results = (0, import_jsonpath_plus.JSONPath)({ resultType: "all", path, json: data });
    if (field.isArray) {
      convertKnownResultsFromJson(field, results);
      return;
    }
    if (results.length === 1) {
      convertKnownResultFromJson(field, results[0]);
      return;
    }
    if (results.length > 1)
      throw new InvalidJsonValue(field);
  });
}
function convertKnownResultFromJson(field, result) {
  const { value, parent, parentProperty } = result;
  parent[parentProperty] = convertKnownValueFromJson(field, value);
}
function convertKnownResultsFromJson(field, results) {
  results.forEach((result) => {
    const { value, parent, parentProperty } = result;
    parent[parentProperty] = convertKnownArrayValueFromJson(field, value);
  });
}
function convertKnownValueFromJson(field, value) {
  if (isNull(value))
    return value;
  switch (field.type) {
    case "boolean":
      if (isBoolean(value))
        return value;
      throw new InvalidJsonValue(field);
    case "number":
      if (isNumber(value))
        return value;
      throw new InvalidJsonValue(field);
    case "date":
      if (isNumber(value))
        return convertEpochToDate(value);
      throw new InvalidJsonValue(field);
    case "point":
      if (isPointString(value))
        return convertStringToPoint(value);
      throw new InvalidJsonValue(field);
    case "string":
    case "text":
      if (isBoolean(value))
        return value.toString();
      if (isNumber(value))
        return value.toString();
      if (isString(value))
        return value;
      throw new InvalidJsonValue(field);
  }
}
function convertKnownArrayValueFromJson(field, value) {
  if (isNull(value))
    throw new NullJsonValue(field);
  switch (field.type) {
    case "string[]":
      if (isBoolean(value))
        return value.toString();
      if (isNumber(value))
        return value.toString();
      if (isString(value))
        return value;
      throw new InvalidJsonValue(field);
    case "number[]":
      if (isNumber(value))
        return value;
      throw new InvalidJsonValue(field);
  }
}

// lib/transformer/to-hash-transformer.ts
function toRedisHash(schema, data) {
  const hashData = {};
  Object.entries(data).forEach(([key, value]) => {
    if (isNotNullish(value)) {
      const field = schema.fieldByName(key);
      const hashField = field ? field.hashField : key;
      if (field && field.type === "string[]" && isArray(value) && value.length === 0) {
      } else {
        hashData[hashField] = field ? convertKnownValueToString2(field, value) : convertUnknownValueToString(key, value);
      }
    }
  });
  return hashData;
}
function convertKnownValueToString2(field, value) {
  switch (field.type) {
    case "boolean":
      if (isBoolean(value))
        return convertBooleanToString(value);
      throw new InvalidHashInput(field);
    case "number":
      if (isNumber(value))
        return convertNumberToString(value);
      throw new InvalidHashInput(field);
    case "date":
      if (isNumber(value))
        return convertEpochDateToString(value);
      if (isDate(value))
        return convertDateToString(value);
      if (isDateString(value))
        return convertIsoDateToString(value);
      throw new InvalidHashInput(field);
    case "point":
      if (isPoint(value))
        return convertPointToString(value);
      throw new InvalidHashInput(field);
    case "string":
    case "text":
      if (isBoolean(value))
        return value.toString();
      if (isNumber(value))
        return value.toString();
      if (isString(value))
        return value;
      throw new InvalidHashInput(field);
    case "string[]":
      if (isArray(value))
        return convertStringArrayToString(value, field.separator);
      throw new InvalidHashInput(field);
    default:
      throw new RedisOmError(`Expected a valid field type but received: ${field.type}`);
  }
}
function convertUnknownValueToString(key, value) {
  if (isBoolean(value))
    return convertBooleanToString(value);
  if (isNumber(value))
    return convertNumberToString(value);
  if (isDate(value))
    return convertDateToString(value);
  if (isPoint(value))
    return convertPointToString(value);
  if (isArray(value))
    throw new ArrayHashInput(key);
  if (isObject(value))
    throw new NestedHashInput(key);
  return value.toString();
}
var convertStringArrayToString = (value, separator) => value.join(separator);

// lib/transformer/to-json-transformer.ts
var import_jsonpath_plus2 = require("jsonpath-plus");
var import_just_clone2 = __toESM(require("just-clone"));
function toRedisJson(schema, data) {
  let json = (0, import_just_clone2.default)(data);
  convertToRedisJsonKnown(schema, json);
  return convertToRedisJsonUnknown(json);
}
function convertToRedisJsonKnown(schema, json) {
  schema.fields.forEach((field) => {
    const results = (0, import_jsonpath_plus2.JSONPath)({ resultType: "all", path: field.jsonPath, json });
    if (field.isArray) {
      convertKnownResultsToJson(field, results);
      return;
    }
    if (results.length === 0)
      return;
    if (results.length === 1) {
      convertKnownResultToJson(field, results[0]);
      return;
    }
    throw new InvalidJsonInput(field);
  });
}
function convertToRedisJsonUnknown(json) {
  Object.entries(json).forEach(([key, value]) => {
    if (isUndefined(value)) {
      delete json[key];
    } else if (isObject(value)) {
      json[key] = convertToRedisJsonUnknown(value);
    } else {
      json[key] = convertUnknownValueToJson(value);
    }
  });
  return json;
}
function convertKnownResultToJson(field, result) {
  const { value, parent, parentProperty } = result;
  if (isDefined(value))
    parent[parentProperty] = convertKnownValueToJson(field, value);
}
function convertKnownResultsToJson(field, results) {
  results.forEach((result) => {
    const { value, parent, parentProperty } = result;
    if (isNull(value))
      throw new NullJsonInput(field);
    if (isUndefined(value) && isArray(parent))
      throw new NullJsonInput(field);
    if (isDefined(value))
      parent[parentProperty] = convertKnownArrayValueToJson(field, value);
  });
}
function convertKnownValueToJson(field, value) {
  if (isNull(value))
    return value;
  switch (field.type) {
    case "boolean":
      if (isBoolean(value))
        return value;
      throw new InvalidJsonInput(field);
    case "number":
      if (isNumber(value))
        return value;
      throw new InvalidJsonInput(field);
    case "date":
      if (isNumber(value))
        return value;
      if (isDate(value))
        return convertDateToEpoch(value);
      if (isDateString(value))
        return convertIsoDateToEpoch(value);
      throw new InvalidJsonInput(field);
    case "point":
      if (isPoint(value))
        return convertPointToString(value);
      throw new InvalidJsonInput(field);
    case "string":
    case "text":
      if (isBoolean(value))
        return value.toString();
      if (isNumber(value))
        return value.toString();
      if (isString(value))
        return value;
      throw new InvalidJsonInput(field);
  }
}
function convertKnownArrayValueToJson(field, value) {
  switch (field.type) {
    case "string[]":
      if (isBoolean(value))
        return value.toString();
      if (isNumber(value))
        return value.toString();
      if (isString(value))
        return value;
      throw new InvalidJsonInput(field);
    case "number[]":
      if (isNumber(value))
        return value;
      throw new InvalidJsonInput(field);
  }
}
function convertUnknownValueToJson(value) {
  if (isDate(value))
    return convertDateToEpoch(value);
  return value;
}

// lib/search/results-converter.ts
function extractCountFromSearchResults(results) {
  return results.total;
}
function extractKeyNamesFromSearchResults(results) {
  return results.documents.map((document) => document.id);
}
function extractEntityIdsFromSearchResults(schema, results) {
  const keyNames = extractKeyNamesFromSearchResults(results);
  return keyNamesToEntityIds(schema.schemaName, keyNames);
}
function extractEntitiesFromSearchResults(schema, results) {
  if (schema.dataStructure === "HASH") {
    return results.documents.map((document) => hashDocumentToEntity(schema, document));
  } else {
    return results.documents.map((document) => jsonDocumentToEntity(schema, document));
  }
}
function hashDocumentToEntity(schema, document) {
  const keyName = document.id;
  const hashData = document.value;
  const entityData = fromRedisHash(schema, hashData);
  return enrichEntityData(schema.schemaName, keyName, entityData);
}
function jsonDocumentToEntity(schema, document) {
  const keyName = document.id;
  const jsonData = document.value["$"] ?? false ? JSON.parse(document.value["$"]) : document.value;
  const entityData = fromRedisJson(schema, jsonData);
  return enrichEntityData(schema.schemaName, keyName, entityData);
}
function enrichEntityData(keyPrefix, keyName, entityData) {
  const entityId = keyNameToEntityId(keyPrefix, keyName);
  return { ...entityData, [EntityId]: entityId, [EntityKeyName]: keyName };
}
function keyNamesToEntityIds(keyPrefix, keyNames) {
  return keyNames.map((keyName) => keyNameToEntityId(keyPrefix, keyName));
}
function keyNameToEntityId(keyPrefix, keyName) {
  const escapedPrefix = keyPrefix.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
  const regex = new RegExp(`^${escapedPrefix}:`);
  return keyName.replace(regex, "");
}

// lib/search/where.ts
var Where = class {
};

// lib/search/where-and.ts
var WhereAnd = class extends Where {
  left;
  right;
  constructor(left, right) {
    super();
    this.left = left;
    this.right = right;
  }
  toString() {
    return `( ${this.left.toString()} ${this.right.toString()} )`;
  }
};

// lib/search/where-or.ts
var WhereOr = class extends Where {
  left;
  right;
  constructor(left, right) {
    super();
    this.left = left;
    this.right = right;
  }
  toString() {
    return `( ${this.left.toString()} | ${this.right.toString()} )`;
  }
};

// lib/search/where-field.ts
var WhereField = class {
  negated = false;
  /** @internal */
  search;
  /** @internal */
  field;
  /** @internal */
  constructor(search, field) {
    this.search = search;
    this.field = field;
  }
  /**
   * Returns the current instance. Syntactic sugar to make your code more fluent.
   * @returns this
   */
  get is() {
    return this;
  }
  /**
   * Returns the current instance. Syntactic sugar to make your code more fluent.
   * @returns this
   */
  get does() {
    return this;
  }
  /**
   * Negates the query on the field, cause it to match when the condition is
   * *not* met. Calling this multiple times will negate the negation.
   * @returns this
   */
  get not() {
    this.negate();
    return this;
  }
  /** @internal */
  negate() {
    this.negated = !this.negated;
  }
  /** @internal */
  buildQuery(valuePortion) {
    const negationPortion = this.negated ? "-" : "";
    const fieldPortion = this.escapePunctuationAndSpaces(this.field.name);
    return `(${negationPortion}@${fieldPortion}:${valuePortion})`;
  }
  /** @internal */
  escapePunctuation(value) {
    const matchPunctuation = /[,.?<>{}[\]"':;!@#$%^&()\-+=~|/\\]/g;
    return value.replace(matchPunctuation, "\\$&");
  }
  /** @internal */
  escapePunctuationAndSpaces(value) {
    const matchPunctuation = /[,.?<>{}[\]"':;!@#$%^&()\-+=~|/\\ ]/g;
    return value.replace(matchPunctuation, "\\$&");
  }
};

// lib/search/where-string-array.ts
var WhereStringArray = class extends WhereField {
  value;
  contain(value) {
    this.value = [value];
    return this.search;
  }
  contains(value) {
    return this.contain(value);
  }
  containsOneOf(...value) {
    this.value = value;
    return this.search;
  }
  containOneOf(...value) {
    return this.containsOneOf(...value);
  }
  toString() {
    const escapedValue = this.value.map((s) => this.escapePunctuationAndSpaces(s)).join("|");
    return this.buildQuery(`{${escapedValue}}`);
  }
};

// lib/search/where-boolean.ts
var WhereBoolean = class extends WhereField {
  value;
  eq(value) {
    this.value = value;
    return this.search;
  }
  equal(value) {
    return this.eq(value);
  }
  equals(value) {
    return this.eq(value);
  }
  equalTo(value) {
    return this.eq(value);
  }
  true() {
    return this.eq(true);
  }
  false() {
    return this.eq(false);
  }
};
var WhereHashBoolean = class extends WhereBoolean {
  toString() {
    return this.buildQuery(`{${this.value ? "1" : "0"}}`);
  }
};
var WhereJsonBoolean = class extends WhereBoolean {
  toString() {
    return this.buildQuery(`{${this.value}}`);
  }
};

// lib/search/where-number.ts
var WhereNumber = class extends WhereField {
  lower = Number.NEGATIVE_INFINITY;
  upper = Number.POSITIVE_INFINITY;
  lowerExclusive = false;
  upperExclusive = false;
  eq(value) {
    this.lower = value;
    this.upper = value;
    return this.search;
  }
  gt(value) {
    this.lower = value;
    this.lowerExclusive = true;
    return this.search;
  }
  gte(value) {
    this.lower = value;
    return this.search;
  }
  lt(value) {
    this.upper = value;
    this.upperExclusive = true;
    return this.search;
  }
  lte(value) {
    this.upper = value;
    return this.search;
  }
  between(lower, upper) {
    this.lower = lower;
    this.upper = upper;
    return this.search;
  }
  equal(value) {
    return this.eq(value);
  }
  equals(value) {
    return this.eq(value);
  }
  equalTo(value) {
    return this.eq(value);
  }
  greaterThan(value) {
    return this.gt(value);
  }
  greaterThanOrEqualTo(value) {
    return this.gte(value);
  }
  lessThan(value) {
    return this.lt(value);
  }
  lessThanOrEqualTo(value) {
    return this.lte(value);
  }
  toString() {
    const lower = this.makeLowerString();
    const upper = this.makeUpperString();
    return this.buildQuery(`[${lower} ${upper}]`);
  }
  makeLowerString() {
    if (this.lower === Number.NEGATIVE_INFINITY)
      return "-inf";
    if (this.lowerExclusive)
      return `(${this.lower}`;
    return this.lower.toString();
  }
  makeUpperString() {
    if (this.upper === Number.POSITIVE_INFINITY)
      return "+inf";
    if (this.upperExclusive)
      return `(${this.upper}`;
    return this.upper.toString();
  }
};

// lib/search/where-point.ts
var Circle = class {
  /** @internal */
  longitudeOfOrigin = 0;
  /** @internal */
  latitudeOfOrigin = 0;
  /** @internal */
  size = 1;
  /** @internal */
  units = "m";
  /**
   * Sets the longitude. If not set, defaults to 0.0.
   *
   * @param value The longitude.
   * @returns This instance.
   */
  longitude(value) {
    this.longitudeOfOrigin = value;
    return this;
  }
  /**
   * Sets the latitude. If not set, defaults to 0.0.
   *
   * @param value The latitude.
   * @returns This instance.
   */
  latitude(value) {
    this.latitudeOfOrigin = value;
    return this;
  }
  /** @internal */
  origin(pointOrLongitude, latitude) {
    if (typeof pointOrLongitude === "number" && latitude !== void 0) {
      this.longitudeOfOrigin = pointOrLongitude;
      this.latitudeOfOrigin = latitude;
    } else {
      const point = pointOrLongitude;
      this.longitudeOfOrigin = point.longitude;
      this.latitudeOfOrigin = point.latitude;
    }
    return this;
  }
  /**
   * Sets the radius of the {@link Circle}. Defaults to 1. If units are
   * not specified, defaults to meters.
   *
   * @param size The radius of the circle.
   * @returns This instance.
   */
  radius(size) {
    this.size = size;
    return this;
  }
  /**
   * Sets the units to meters.
   * @returns This instance.
   */
  get m() {
    return this.meters;
  }
  /**
   * Sets the units to meters.
   * @returns This instance.
   */
  get meter() {
    return this.meters;
  }
  /**
   * Sets the units to meters.
   * @returns This instance.
   */
  get meters() {
    this.units = "m";
    return this;
  }
  /**
   * Sets the units to kilometers.
   * @returns This instance.
   */
  get km() {
    return this.kilometers;
  }
  /**
   * Sets the units to kilometers.
   * @returns This instance.
   */
  get kilometer() {
    return this.kilometers;
  }
  /**
   * Sets the units to kilometers.
   * @returns This instance.
   */
  get kilometers() {
    this.units = "km";
    return this;
  }
  /**
   * Sets the units to feet.
   * @returns This instance.
   */
  get ft() {
    return this.feet;
  }
  /**
   * Sets the units to feet.
   * @returns This instance.
   */
  get foot() {
    return this.feet;
  }
  /**
   * Sets the units to feet.
   * @returns This instance.
   */
  get feet() {
    this.units = "ft";
    return this;
  }
  /**
   * Sets the units to miles.
   * @returns This instance.
   */
  get mi() {
    return this.miles;
  }
  /**
   * Sets the units to miles.
   * @returns This instance.
   */
  get mile() {
    return this.miles;
  }
  /**
   * Sets the units to miles.
   * @returns This instance.
   */
  get miles() {
    this.units = "mi";
    return this;
  }
};
var WherePoint = class extends WhereField {
  circle = new Circle();
  inRadius(circleFn) {
    return this.inCircle(circleFn);
  }
  inCircle(circleFn) {
    this.circle = circleFn(this.circle);
    return this.search;
  }
  toString() {
    const { longitudeOfOrigin, latitudeOfOrigin, size, units } = this.circle;
    return this.buildQuery(`[${longitudeOfOrigin} ${latitudeOfOrigin} ${size} ${units}]`);
  }
};

// lib/search/where-string.ts
var WhereString = class extends WhereField {
  value;
  eq(value) {
    this.value = value.toString();
    return this.search;
  }
  equal(value) {
    return this.eq(value);
  }
  equals(value) {
    return this.eq(value);
  }
  equalTo(value) {
    return this.eq(value);
  }
  match(_) {
    return this.throwMatchExcpetion();
  }
  matches(_) {
    return this.throwMatchExcpetion();
  }
  matchExact(_) {
    return this.throwMatchExcpetion();
  }
  matchExactly(_) {
    return this.throwMatchExcpetion();
  }
  matchesExactly(_) {
    return this.throwMatchExcpetion();
  }
  get exact() {
    return this.throwMatchExcpetionReturningThis();
  }
  get exactly() {
    return this.throwMatchExcpetionReturningThis();
  }
  toString() {
    const escapedValue = this.escapePunctuationAndSpaces(this.value);
    return this.buildQuery(`{${escapedValue}}`);
  }
  throwMatchExcpetion() {
    throw new SemanticSearchError("Cannot perform full-text search operations like .match on field of type 'string'. If full-text search is needed on this field, change the type to 'text' in the Schema.");
  }
  throwMatchExcpetionReturningThis() {
    throw new SemanticSearchError("Cannot perform full-text search operations like .match on field of type 'string'. If full-text search is needed on this field, change the type to 'text' in the Schema.");
  }
};

// lib/search/where-text.ts
var WhereText = class extends WhereField {
  value;
  exactValue = false;
  fuzzyMatching;
  levenshteinDistance;
  match(value, options = {
    fuzzyMatching: false,
    levenshteinDistance: 1
  }) {
    this.value = value.toString();
    this.fuzzyMatching = options.fuzzyMatching ?? false;
    this.levenshteinDistance = options.levenshteinDistance ?? 1;
    return this.search;
  }
  matchExact(value) {
    this.exact.value = value.toString();
    return this.search;
  }
  matches(value, options = {
    fuzzyMatching: false,
    levenshteinDistance: 1
  }) {
    return this.match(value, options);
  }
  matchExactly(value) {
    return this.matchExact(value);
  }
  matchesExactly(value) {
    return this.matchExact(value);
  }
  get exact() {
    this.exactValue = true;
    return this;
  }
  get exactly() {
    return this.exact;
  }
  eq(_) {
    return this.throwEqualsExcpetion();
  }
  equal(_) {
    return this.throwEqualsExcpetion();
  }
  equals(_) {
    return this.throwEqualsExcpetion();
  }
  equalTo(_) {
    return this.throwEqualsExcpetion();
  }
  toString() {
    const escapedValue = this.escapePunctuation(this.value);
    if (this.exactValue) {
      return this.buildQuery(`"${escapedValue}"`);
    } else if (this.fuzzyMatching) {
      return this.buildQuery(`${"%".repeat(this.levenshteinDistance)}${escapedValue}${"%".repeat(this.levenshteinDistance)}`);
    } else {
      return this.buildQuery(`'${escapedValue}'`);
    }
  }
  throwEqualsExcpetion() {
    throw new SemanticSearchError("Cannot call .equals on a field of type 'text', either use .match to perform full-text search or change the type to 'string' in the Schema.");
  }
};

// lib/search/where-date.ts
var WhereDate = class extends WhereField {
  lower = Number.NEGATIVE_INFINITY;
  upper = Number.POSITIVE_INFINITY;
  lowerExclusive = false;
  upperExclusive = false;
  eq(value) {
    const epoch = this.coerceDateToEpoch(value);
    this.lower = epoch;
    this.upper = epoch;
    return this.search;
  }
  gt(value) {
    const epoch = this.coerceDateToEpoch(value);
    this.lower = epoch;
    this.lowerExclusive = true;
    return this.search;
  }
  gte(value) {
    this.lower = this.coerceDateToEpoch(value);
    return this.search;
  }
  lt(value) {
    this.upper = this.coerceDateToEpoch(value);
    this.upperExclusive = true;
    return this.search;
  }
  lte(value) {
    this.upper = this.coerceDateToEpoch(value);
    return this.search;
  }
  between(lower, upper) {
    this.lower = this.coerceDateToEpoch(lower);
    this.upper = this.coerceDateToEpoch(upper);
    return this.search;
  }
  equal(value) {
    return this.eq(value);
  }
  equals(value) {
    return this.eq(value);
  }
  equalTo(value) {
    return this.eq(value);
  }
  greaterThan(value) {
    return this.gt(value);
  }
  greaterThanOrEqualTo(value) {
    return this.gte(value);
  }
  lessThan(value) {
    return this.lt(value);
  }
  lessThanOrEqualTo(value) {
    return this.lte(value);
  }
  on(value) {
    return this.eq(value);
  }
  after(value) {
    return this.gt(value);
  }
  before(value) {
    return this.lt(value);
  }
  onOrAfter(value) {
    return this.gte(value);
  }
  onOrBefore(value) {
    return this.lte(value);
  }
  toString() {
    const lower = this.makeLowerString();
    const upper = this.makeUpperString();
    return this.buildQuery(`[${lower} ${upper}]`);
  }
  makeLowerString() {
    if (this.lower === Number.NEGATIVE_INFINITY)
      return "-inf";
    if (this.lowerExclusive)
      return `(${this.lower}`;
    return this.lower.toString();
  }
  makeUpperString() {
    if (this.upper === Number.POSITIVE_INFINITY)
      return "+inf";
    if (this.upperExclusive)
      return `(${this.upper}`;
    return this.upper.toString();
  }
  coerceDateToEpoch(value) {
    if (value instanceof Date)
      return value.getTime() / 1e3;
    if (typeof value === "string")
      return new Date(value).getTime() / 1e3;
    return value;
  }
};

// lib/search/search.ts
var AbstractSearch = class {
  /** @internal */
  schema;
  /** @internal */
  client;
  /** @internal */
  sortOptions;
  /** @internal */
  constructor(schema, client) {
    this.schema = schema;
    this.client = client;
  }
  /**
   * Applies an ascending sort to the query.
   * @param field The field to sort by.
   * @returns this
   */
  sortAscending(field) {
    return this.sortBy(field, "ASC");
  }
  /**
   * Alias for {@link Search.sortDescending}.
   */
  sortDesc(field) {
    return this.sortDescending(field);
  }
  /**
   * Applies a descending sort to the query.
   * @param field The field to sort by.
   * @returns this
   */
  sortDescending(field) {
    return this.sortBy(field, "DESC");
  }
  /**
   * Alias for {@link Search.sortAscending}.
   */
  sortAsc(field) {
    return this.sortAscending(field);
  }
  /**
   * Applies sorting for the query.
   * @param fieldName The field to sort by.
   * @param order The order of returned {@link Entity | Entities} Defaults to `ASC` (ascending) if not specified
   * @returns this
   */
  sortBy(fieldName, order = "ASC") {
    const field = this.schema.fieldByName(fieldName);
    const dataStructure = this.schema.dataStructure;
    if (!field) {
      const message = `'sortBy' was called on field '${String(fieldName)}' which is not defined in the Schema.`;
      console.error(message);
      throw new RedisOmError(message);
    }
    const type = field.type;
    const markedSortable = field.sortable;
    const UNSORTABLE = ["point", "string[]"];
    const JSON_SORTABLE = ["number", "text", "date"];
    const HASH_SORTABLE = ["string", "boolean", "number", "text", "date"];
    if (UNSORTABLE.includes(type)) {
      const message = `'sortBy' was called on '${field.type}' field '${field.name}' which cannot be sorted.`;
      console.error(message);
      throw new RedisOmError(message);
    }
    if (dataStructure === "JSON" && JSON_SORTABLE.includes(type) && !markedSortable)
      console.warn(
        `'sortBy' was called on field '${field.name}' which is not marked as sortable in the Schema. This may result is slower searches. If possible, mark the field as sortable in the Schema.`
      );
    if (dataStructure === "HASH" && HASH_SORTABLE.includes(type) && !markedSortable)
      console.warn(
        `'sortBy' was called on field '${field.name}' which is not marked as sortable in the Schema. This may result is slower searches. If possible, mark the field as sortable in the Schema.`
      );
    this.sortOptions = { BY: field.name, DIRECTION: order };
    return this;
  }
  /**
   * Finds the {@link Entity} with the minimal value for a field.
   * @param field The field with the minimal value.
   * @returns The {@link Entity} with the minimal value
   */
  async min(field) {
    return await this.sortBy(field, "ASC").first();
  }
  /**
   * Finds the entity ID with the minimal value for a field.
   * @param field The field with the minimal value.
   * @returns The entity ID with the minimal value
   */
  async minId(field) {
    return await this.sortBy(field, "ASC").firstId();
  }
  /**
   * Finds the key name in Redis with the minimal value for a field.
   * @param field The field with the minimal value.
   * @returns The key name with the minimal value
   */
  async minKey(field) {
    return await this.sortBy(field, "ASC").firstKey();
  }
  /**
   * Finds the {@link Entity} with the maximal value for a field.
   * @param field The field with the maximal value.
   * @returns The entity ID {@link Entity} with the maximal value
   */
  async max(field) {
    return await this.sortBy(field, "DESC").first();
  }
  /**
   * Finds the entity ID with the maximal value for a field.
   * @param field The field with the maximal value.
   * @returns The entity ID with the maximal value
   */
  async maxId(field) {
    return await this.sortBy(field, "DESC").firstId();
  }
  /**
   * Finds the key name in Redis with the maximal value for a field.
   * @param field The field with the maximal value.
   * @returns The key name with the maximal value
   */
  async maxKey(field) {
    return await this.sortBy(field, "DESC").firstKey();
  }
  /**
   * Returns the number of {@link Entity | Entities} that match this query.
   * @returns
   */
  async count() {
    const searchResults = await this.callSearch();
    return extractCountFromSearchResults(searchResults);
  }
  /**
   * Returns a page of {@link Entity | Entities} that match this query.
   * @param offset The offset for where to start returning {@link Entity | Entities}.
   * @param count The number of {@link Entity | Entities} to return.
   * @returns An array of {@link Entity | Entities} matching the query.
   */
  async page(offset, count) {
    const searchResults = await this.callSearch(offset, count);
    return extractEntitiesFromSearchResults(this.schema, searchResults);
  }
  /**
   * Returns a page of entity IDs that match this query.
   * @param offset The offset for where to start returning entity IDs.
   * @param count The number of entity IDs to return.
   * @returns An array of strings matching the query.
   */
  async pageOfIds(offset, count) {
    const searchResults = await this.callSearch(offset, count, true);
    return extractEntityIdsFromSearchResults(this.schema, searchResults);
  }
  /**
   * Returns a page of key names in Redis that match this query.
   * @param offset The offset for where to start returning key names.
   * @param count The number of key names to return.
   * @returns An array of strings matching the query.
   */
  async pageOfKeys(offset, count) {
    const searchResults = await this.callSearch(offset, count, true);
    return extractKeyNamesFromSearchResults(searchResults);
  }
  /**
   * Returns the first {@link Entity} that matches this query.
   */
  async first() {
    const foundEntity = await this.page(0, 1);
    return foundEntity[0] ?? null;
  }
  /**
   * Returns the first entity ID that matches this query.
   */
  async firstId() {
    const foundIds = await this.pageOfIds(0, 1);
    return foundIds[0] ?? null;
  }
  /**
   * Returns the first key name that matches this query.
   */
  async firstKey() {
    const foundKeys = await this.pageOfKeys(0, 1);
    return foundKeys[0] ?? null;
  }
  /**
   * Returns all the {@link Entity | Entities} that match this query. This method
   * makes multiple calls to Redis until all the {@link Entity | Entities} are returned.
   * You can specify the batch size by setting the `pageSize` property on the
   * options:
   *
   * ```typescript
   * const entities = await repository.search().returnAll({ pageSize: 100 })
   * ```
   *
   * @param options Options for the call.
   * @param options.pageSize Number of {@link Entity | Entities} returned per batch.
   * @returns An array of {@link Entity | Entities} matching the query.
   */
  async all(options = { pageSize: 10 }) {
    return this.allThings(this.page, options);
  }
  /**
   * Returns all the entity IDs that match this query. This method
   * makes multiple calls to Redis until all the entity IDs are returned.
   * You can specify the batch size by setting the `pageSize` property on the
   * options:
   *
   * ```typescript
   * const keys = await repository.search().returnAllIds({ pageSize: 100 })
   * ```
   *
   * @param options Options for the call.
   * @param options.pageSize Number of entity IDs returned per batch.
   * @returns An array of entity IDs matching the query.
   */
  async allIds(options = { pageSize: 10 }) {
    return this.allThings(this.pageOfIds, options);
  }
  /**
   * Returns all the key names in Redis that match this query. This method
   * makes multiple calls to Redis until all the key names are returned.
   * You can specify the batch size by setting the `pageSize` property on the
   * options:
   *
   * ```typescript
   * const keys = await repository.search().returnAllKeys({ pageSize: 100 })
   * ```
   *
   * @param options Options for the call.
   * @param options.pageSize Number of key names returned per batch.
   * @returns An array of key names matching the query.
   */
  async allKeys(options = { pageSize: 10 }) {
    return this.allThings(this.pageOfKeys, options);
  }
  /**
   * Returns the current instance. Syntactic sugar to make your code more fluent.
   * @returns this
   */
  get return() {
    return this;
  }
  /**
   * Alias for {@link Search.min}.
   */
  async returnMin(field) {
    return await this.min(field);
  }
  /**
   * Alias for {@link Search.minId}.
   */
  async returnMinId(field) {
    return await this.minId(field);
  }
  /**
   * Alias for {@link Search.minKey}.
   */
  async returnMinKey(field) {
    return await this.minKey(field);
  }
  /**
   * Alias for {@link Search.max}.
   */
  async returnMax(field) {
    return await this.max(field);
  }
  /**
   * Alias for {@link Search.maxId}.
   */
  async returnMaxId(field) {
    return await this.maxId(field);
  }
  /**
   * Alias for {@link Search.maxKey}.
   */
  async returnMaxKey(field) {
    return await this.maxKey(field);
  }
  /**
   * Alias for {@link Search.count}.
   */
  async returnCount() {
    return await this.count();
  }
  /**
   * Alias for {@link Search.page}.
   */
  async returnPage(offset, count) {
    return await this.page(offset, count);
  }
  /**
   * Alias for {@link Search.pageOfIds}.
   */
  async returnPageOfIds(offset, count) {
    return await this.pageOfIds(offset, count);
  }
  /**
   * Alias for {@link Search.pageOfKeys}.
   */
  async returnPageOfKeys(offset, count) {
    return await this.pageOfKeys(offset, count);
  }
  /**
   * Alias for {@link Search.first}.
   */
  async returnFirst() {
    return await this.first();
  }
  /**
   * Alias for {@link Search.firstId}.
   */
  async returnFirstId() {
    return await this.firstId();
  }
  /**
   * Alias for {@link Search.firstKey}.
   */
  async returnFirstKey() {
    return await this.firstKey();
  }
  /**
   * Alias for {@link Search.all}.
   */
  async returnAll(options = { pageSize: 10 }) {
    return await this.all(options);
  }
  /**
   * Alias for {@link Search.allIds}.
   */
  async returnAllIds(options = { pageSize: 10 }) {
    return await this.allIds(options);
  }
  /**
   * Alias for {@link Search.allKeys}.
   */
  async returnAllKeys(options = { pageSize: 10 }) {
    return await this.allKeys(options);
  }
  async allThings(pageFn, options = { pageSize: 10 }) {
    let things = [];
    let offset = 0;
    const pageSize = options.pageSize;
    while (true) {
      const foundThings = await pageFn.call(this, offset, pageSize);
      things.push(...foundThings);
      if (foundThings.length < pageSize)
        break;
      offset += pageSize;
    }
    return things;
  }
  async callSearch(offset = 0, count = 0, keysOnly = false) {
    const dataStructure = this.schema.dataStructure;
    const indexName = this.schema.indexName;
    const query = this.query;
    const options = {
      LIMIT: { from: offset, size: count }
    };
    if (this.sortOptions !== void 0)
      options.SORTBY = this.sortOptions;
    if (keysOnly) {
      options.RETURN = [];
    } else if (dataStructure === "JSON") {
      options.RETURN = "$";
    }
    let searchResults;
    try {
      searchResults = await this.client.search(indexName, query, options);
    } catch (error) {
      const message = error.message;
      if (message.startsWith("Syntax error")) {
        throw new SearchError(
          `The query to RediSearch had a syntax error: "${message}".
This is often the result of using a stop word in the query. Either change the query to not use a stop word or change the stop words in the schema definition. You can check the RediSearch source for the default stop words at: https://github.com/RediSearch/RediSearch/blob/master/src/stopwords.h.`
        );
      }
      throw error;
    }
    return searchResults;
  }
};
var RawSearch = class extends AbstractSearch {
  rawQuery;
  /** @internal */
  constructor(schema, client, query = "*") {
    super(schema, client);
    this.rawQuery = query;
  }
  /** @internal */
  get query() {
    return this.rawQuery;
  }
};
var Search = class extends AbstractSearch {
  rootWhere;
  /** @internal */
  get query() {
    if (this.rootWhere === void 0)
      return "*";
    return `${this.rootWhere.toString()}`;
  }
  where(fieldOrFn) {
    return this.anyWhere(WhereAnd, fieldOrFn);
  }
  and(fieldOrFn) {
    return this.anyWhere(WhereAnd, fieldOrFn);
  }
  or(fieldOrFn) {
    return this.anyWhere(WhereOr, fieldOrFn);
  }
  anyWhere(ctor, fieldOrFn) {
    if (typeof fieldOrFn === "function") {
      return this.anyWhereForFunction(ctor, fieldOrFn);
    } else {
      return this.anyWhereForField(ctor, fieldOrFn);
    }
  }
  anyWhereForField(ctor, field) {
    const where = this.createWhere(field);
    if (this.rootWhere === void 0) {
      this.rootWhere = where;
    } else {
      this.rootWhere = new ctor(this.rootWhere, where);
    }
    return where;
  }
  anyWhereForFunction(ctor, subSearchFn) {
    const search = new Search(this.schema, this.client);
    const subSearch = subSearchFn(search);
    if (subSearch.rootWhere === void 0) {
      throw new SearchError(
        "Sub-search without a root where was somehow defined."
      );
    } else {
      if (this.rootWhere === void 0) {
        this.rootWhere = subSearch.rootWhere;
      } else {
        this.rootWhere = new ctor(this.rootWhere, subSearch.rootWhere);
      }
    }
    return this;
  }
  createWhere(fieldName) {
    const field = this.schema.fieldByName(fieldName);
    if (field === null)
      throw new FieldNotInSchema(String(fieldName));
    if (field.type === "boolean" && this.schema.dataStructure === "HASH")
      return new WhereHashBoolean(this, field);
    if (field.type === "boolean" && this.schema.dataStructure === "JSON")
      return new WhereJsonBoolean(this, field);
    if (field.type === "date")
      return new WhereDate(this, field);
    if (field.type === "number")
      return new WhereNumber(this, field);
    if (field.type === "number[]")
      return new WhereNumber(this, field);
    if (field.type === "point")
      return new WherePoint(this, field);
    if (field.type === "text")
      return new WhereText(this, field);
    if (field.type === "string")
      return new WhereString(this, field);
    if (field.type === "string[]")
      return new WhereStringArray(this, field);
    throw new RedisOmError(
      // @ts-ignore: This is a trap for JavaScript
      `The field type of '${fieldDef.type}' is not a valid field type. Valid types include 'boolean', 'date', 'number', 'point', 'string', and 'string[]'.`
    );
  }
};

// lib/repository/repository.ts
var Repository = class {
  // NOTE: Not using "#" private as the spec needs to check calls on this class. Will be resolved when Client class is removed.
  client;
  #schema;
  /**
   * Creates a new {@link Repository}.
   *
   * @param schema The schema defining that data in the repository.
   * @param clientOrConnection A client to talk to Redis.
   */
  constructor(schema, clientOrConnection) {
    this.#schema = schema;
    if (clientOrConnection instanceof Client) {
      this.client = clientOrConnection;
    } else {
      this.client = new Client();
      this.client.useNoClose(clientOrConnection);
    }
  }
  /**
   * Creates an index in Redis for use by the {@link Repository#search} method.
   * Does not create a new index if the index hasn't changed. Requires that
   * RediSearch and RedisJSON are installed on your instance of Redis.
   */
  async createIndex() {
    const currentIndexHash = await this.client.get(this.#schema.indexHashName);
    const incomingIndexHash = this.#schema.indexHash;
    if (currentIndexHash !== incomingIndexHash) {
      await this.dropIndex();
      const {
        indexName,
        indexHashName,
        dataStructure,
        schemaName: prefix,
        useStopWords,
        stopWords
      } = this.#schema;
      const schema = buildRediSearchSchema(this.#schema);
      const options = {
        ON: dataStructure,
        PREFIX: `${prefix}:`
      };
      if (useStopWords === "OFF") {
        options.STOPWORDS = [];
      } else if (useStopWords === "CUSTOM") {
        options.STOPWORDS = stopWords;
      }
      await Promise.all([
        this.client.createIndex(indexName, schema, options),
        this.client.set(indexHashName, incomingIndexHash)
      ]);
    }
  }
  /**
   * Removes an existing index from Redis. Use this method if you want to swap out your index
   * because your {@link Entity} has changed. Requires that RediSearch and RedisJSON are installed
   * on your instance of Redis.
   */
  async dropIndex() {
    try {
      await Promise.all([
        this.client.unlink(this.#schema.indexHashName),
        this.client.dropIndex(this.#schema.indexName)
      ]);
    } catch (e) {
      if (e instanceof Error && (e.message.includes("Unknown Index name") || e.message.includes("Unknown index name") || e.message.includes("no such index"))) {
      } else {
        throw e;
      }
    }
  }
  async save(entityOrId, maybeEntity) {
    let entity;
    let entityId;
    if (typeof entityOrId !== "string") {
      entity = entityOrId;
      entityId = entity[EntityId] ?? await this.#schema.generateId();
    } else {
      entity = maybeEntity;
      entityId = entityOrId;
    }
    const keyName = `${this.#schema.schemaName}:${entityId}`;
    const clonedEntity = { ...entity, [EntityId]: entityId, [EntityKeyName]: keyName };
    await this.writeEntity(clonedEntity);
    return clonedEntity;
  }
  async fetch(ids) {
    if (arguments.length > 1)
      return this.readEntities([...arguments]);
    if (Array.isArray(ids))
      return this.readEntities(ids);
    const [entity] = await this.readEntities([ids]);
    return entity;
  }
  async remove(ids) {
    const keys = arguments.length > 1 ? this.makeKeys([...arguments]) : Array.isArray(ids) ? this.makeKeys(ids) : ids ? this.makeKeys([ids]) : [];
    if (keys.length === 0)
      return;
    await this.client.unlink(...keys);
  }
  async expire(idOrIds, ttlInSeconds) {
    const ids = typeof idOrIds === "string" ? [idOrIds] : idOrIds;
    await Promise.all(
      ids.map((id) => {
        const key = this.makeKey(id);
        return this.client.expire(key, ttlInSeconds);
      })
    );
  }
  async expireAt(idOrIds, expirationDate) {
    const ids = typeof idOrIds === "string" ? [idOrIds] : idOrIds;
    if (Date.now() >= expirationDate.getTime()) {
      throw new Error(
        `${expirationDate.toString()} is invalid. Expiration date must be in the future.`
      );
    }
    await Promise.all(
      ids.map((id) => {
        const key = this.makeKey(id);
        return this.client.expireAt(key, expirationDate);
      })
    );
  }
  /**
   * Kicks off the process of building a query. Requires that RediSearch (and optionally
   * RedisJSON) be installed on your instance of Redis.
   *
   * @returns A {@link Search} object.
   */
  search() {
    return new Search(this.#schema, this.client);
  }
  /**
   * Creates a search that bypasses Redis OM and instead allows you to execute a raw
   * RediSearch query. Requires that RediSearch (and optionally RedisJSON) be installed
   * on your instance of Redis.
   *
   * Refer to https://redis.io/docs/stack/search/reference/query_syntax/ for details on
   * RediSearch query syntax.
   *
   * @query The raw RediSearch query you want to rune.
   * @returns A {@link RawSearch} object.
   */
  searchRaw(query) {
    return new RawSearch(this.#schema, this.client, query);
  }
  async writeEntity(entity) {
    return this.#schema.dataStructure === "HASH" ? this.#writeEntityToHash(entity) : this.writeEntityToJson(entity);
  }
  async readEntities(ids) {
    return this.#schema.dataStructure === "HASH" ? this.readEntitiesFromHash(ids) : this.readEntitiesFromJson(ids);
  }
  async #writeEntityToHash(entity) {
    const keyName = entity[EntityKeyName];
    const hashData = toRedisHash(this.#schema, entity);
    if (Object.keys(hashData).length === 0) {
      await this.client.unlink(keyName);
    } else {
      await this.client.hsetall(keyName, hashData);
    }
  }
  async readEntitiesFromHash(ids) {
    return Promise.all(
      ids.map(async (entityId) => {
        const keyName = this.makeKey(entityId);
        const hashData = await this.client.hgetall(keyName);
        const entityData = fromRedisHash(this.#schema, hashData);
        return { ...entityData, [EntityId]: entityId, [EntityKeyName]: keyName };
      })
    );
  }
  async writeEntityToJson(entity) {
    const keyName = entity[EntityKeyName];
    const jsonData = toRedisJson(this.#schema, entity);
    await this.client.jsonset(keyName, jsonData);
  }
  async readEntitiesFromJson(ids) {
    return Promise.all(
      ids.map(async (entityId) => {
        const keyName = this.makeKey(entityId);
        const jsonData = await this.client.jsonget(keyName) ?? {};
        const entityData = fromRedisJson(this.#schema, jsonData);
        return { ...entityData, [EntityId]: entityId, [EntityKeyName]: keyName };
      })
    );
  }
  makeKeys(ids) {
    return ids.map((id) => this.makeKey(id));
  }
  makeKey(id) {
    return `${this.#schema.schemaName}:${id}`;
  }
};

// lib/client/client.ts
var Client = class {
  /** @internal */
  #redis;
  /** Returns the underlying Node Redis connection being used. */
  get redis() {
    return this.#redis;
  }
  /**
   * Attaches an existing Node Redis connection to this Redis OM client. Closes
   * any existing connection.
   *
   * @param connection An existing Node Redis client.
   * @returns This {@link Client} instance.
   */
  async use(connection) {
    await this.close();
    return this.useNoClose(connection);
  }
  /**
   * Attaches an existing Node Redis connection to this Redis OM client. Does
   * not close any existing connection.
   *
   * @param connection An existing Node Redis client.
   * @returns This {@link Client} instance.
   */
  useNoClose(connection) {
    this.#redis = connection;
    return this;
  }
  /**
   * Open a connection to Redis at the provided URL.
   *
   * @param url A URL to Redis as defined with the [IANA](https://www.iana.org/assignments/uri-schemes/prov/redis).
   * @returns This {@link Client} instance.
   */
  async open(url = "redis://localhost:6379") {
    if (!this.isOpen()) {
      const redis = (0, import_redis2.createClient)({ url });
      await redis.connect();
      this.#redis = redis;
    }
    return this;
  }
  /**
   * Creates a repository for the given schema.
   *
   * @param schema The schema.
   * @returns A repository for the provided schema.
   */
  fetchRepository(schema) {
    this.#validateRedisOpen();
    return new Repository(schema, this);
  }
  /**
   * Close the connection to Redis.
   */
  async close() {
    if (this.#redis)
      await this.#redis.quit();
    this.#redis = void 0;
  }
  /** @internal */
  async createIndex(indexName, schema, options) {
    this.#validateRedisOpen();
    await this.redis.ft.create(indexName, schema, options);
  }
  /** @internal */
  async dropIndex(indexName) {
    this.#validateRedisOpen();
    await this.redis.ft.dropIndex(indexName);
  }
  /** @internal */
  async search(indexName, query, options) {
    this.#validateRedisOpen();
    if (options)
      return await this.redis.ft.search(indexName, query, options);
    return await this.redis.ft.search(indexName, query);
  }
  /** @internal */
  async unlink(...keys) {
    this.#validateRedisOpen();
    if (keys.length > 0)
      await this.redis.unlink(keys);
  }
  /** @internal */
  async expire(key, ttl) {
    this.#validateRedisOpen();
    await this.redis.expire(key, ttl);
  }
  /** @internal */
  async expireAt(key, timestamp) {
    this.#validateRedisOpen();
    await this.redis.expireAt(key, timestamp);
  }
  /** @internal */
  async get(key) {
    this.#validateRedisOpen();
    return this.redis.get(key);
  }
  /** @internal */
  async set(key, value) {
    this.#validateRedisOpen();
    await this.redis.set(key, value);
  }
  /** @internal */
  async hgetall(key) {
    this.#validateRedisOpen();
    return this.redis.hGetAll(key);
  }
  /** @internal */
  async hsetall(key, data) {
    this.#validateRedisOpen();
    await this.redis.multi().unlink(key).hSet(key, data).exec();
  }
  /** @internal */
  async jsonget(key) {
    this.#validateRedisOpen();
    const json = await this.redis.json.get(key, { path: "$" });
    return json === null ? null : json[0];
  }
  /** @internal */
  async jsonset(key, data) {
    this.#validateRedisOpen();
    await this.redis.json.set(key, "$", data);
  }
  /**
   * @returns Whether a connection is already open.
   */
  isOpen() {
    return !!this.#redis;
  }
  #validateRedisOpen() {
    if (!this.redis)
      throw new RedisOmError("Redis connection needs to be open.");
  }
};

// lib/schema/field.ts
var Field = class {
  #name;
  #definition;
  /**
   * Creates a Field.
   *
   * @param name The name of the Field.
   * @param definition The underlying {@link FieldDefinition}.
   */
  constructor(name, definition) {
    this.#name = name;
    this.#definition = definition;
  }
  /** The name of the field. */
  get name() {
    return this.#name;
  }
  /** The {@link FieldType | type} of the field. */
  get type() {
    return this.#definition.type;
  }
  /** The field name used to store this {@link Field} in a Hash. */
  get hashField() {
    return this.#definition.field ?? this.#definition.alias ?? this.name;
  }
  /** The JSONPath used to store this {@link Field} in a JSON document. */
  get jsonPath() {
    if (this.#definition.path)
      return this.#definition.path;
    const alias = (this.#definition.alias ?? this.name).replace(/"/g, '\\"');
    return this.isArray ? `$["${alias}"][*]` : `$["${alias}"]`;
  }
  /** The separator for string[] fields when stored in Hashes. */
  get separator() {
    return this.#definition.separator ?? "|";
  }
  /** Indicates that the field as sortable. */
  get sortable() {
    return this.#definition.sortable ?? false;
  }
  /** The case-sensitivity of the field. */
  get caseSensitive() {
    return this.#definition.caseSensitive ?? false;
  }
  /** Indicates the field as being indexed—and thus queryable—by RediSearch. */
  get indexed() {
    return this.#definition.indexed ?? true;
  }
  /** Indicates that the field as indexed with stemming support. */
  get stemming() {
    return this.#definition.stemming ?? true;
  }
  /** Indicates that the field is normalized. Ignored if sortable is false. */
  get normalized() {
    return this.#definition.normalized ?? true;
  }
  /** The search weight of the field. */
  get weight() {
    return this.#definition.weight ?? null;
  }
  /** The phonetic matcher for the field. */
  get matcher() {
    return this.#definition.matcher ?? null;
  }
  /** Is this type an array or not. */
  get isArray() {
    return this.type.endsWith("[]");
  }
};

// lib/schema/schema.ts
var import_crypto = require("crypto");

// node_modules/.pnpm/ulid@2.4.0/node_modules/ulid/dist/index.esm.js
function createError(message) {
  const err = new Error(message);
  err.source = "ulid";
  return err;
}
var ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
var ENCODING_LEN = ENCODING.length;
var TIME_MAX = Math.pow(2, 48) - 1;
var TIME_LEN = 10;
var RANDOM_LEN = 16;
function randomChar(prng) {
  let rand = Math.floor(prng() * ENCODING_LEN);
  if (rand === ENCODING_LEN) {
    rand = ENCODING_LEN - 1;
  }
  return ENCODING.charAt(rand);
}
function encodeTime(now, len) {
  if (isNaN(now)) {
    throw new Error(now + " must be a number");
  }
  if (now > TIME_MAX) {
    throw createError("cannot encode time greater than " + TIME_MAX);
  }
  if (now < 0) {
    throw createError("time must be positive");
  }
  if (Number.isInteger(Number(now)) === false) {
    throw createError("time must be an integer");
  }
  let mod;
  let str = "";
  for (; len > 0; len--) {
    mod = now % ENCODING_LEN;
    str = ENCODING.charAt(mod) + str;
    now = (now - mod) / ENCODING_LEN;
  }
  return str;
}
function encodeRandom(len, prng) {
  let str = "";
  for (; len > 0; len--) {
    str = randomChar(prng) + str;
  }
  return str;
}
function detectPrng(allowInsecure = false, root) {
  if (!root) {
    root = typeof window !== "undefined" ? window : null;
  }
  const browserCrypto = root && (root.crypto || root.msCrypto);
  if (browserCrypto) {
    return () => {
      const buffer = new Uint8Array(1);
      browserCrypto.getRandomValues(buffer);
      return buffer[0] / 255;
    };
  } else {
    try {
      const nodeCrypto = require("crypto");
      return () => nodeCrypto.randomBytes(1).readUInt8() / 255;
    } catch (e) {
    }
  }
  if (allowInsecure) {
    try {
      console.error("secure crypto unusable, falling back to insecure Math.random()!");
    } catch (e) {
    }
    return () => Math.random();
  }
  throw createError("secure crypto unusable, insecure Math.random not allowed");
}
function factory(currPrng) {
  if (!currPrng) {
    currPrng = detectPrng();
  }
  return function ulid2(seedTime) {
    if (isNaN(seedTime)) {
      seedTime = Date.now();
    }
    return encodeTime(seedTime, TIME_LEN) + encodeRandom(RANDOM_LEN, currPrng);
  };
}
var ulid = factory();

// lib/schema/schema.ts
var Schema = class {
  #schemaName;
  #fieldsByName = {};
  #definition;
  #options;
  /**
   * Constructs a Schema.
   *
   * @param schemaName The name of the schema. Prefixes the ID when creating Redis keys.
   * @param schemaDef Defines all of the fields for the Schema and how they are mapped to Redis.
   * @param options Additional options for this Schema.
   */
  constructor(schemaName, schemaDef, options) {
    this.#schemaName = schemaName;
    this.#definition = schemaDef;
    this.#options = options;
    this.#validateOptions();
    this.#createFields();
  }
  /**
   * The name of the schema. Prefixes the ID when creating Redis keys. Combined
   * with the results of idStrategy to generate a key. If name is `foo` and
   * idStrategy returns `12345` then the generated key would be `foo:12345`.
   */
  get schemaName() {
    return this.#schemaName;
  }
  /** The {@link Field | Fields} defined by this Schema. */
  get fields() {
    return Object.entries(this.#fieldsByName).map(([_name, field]) => field);
  }
  /**
   * Gets a single {@link Field} defined by this Schema.
   *
   * @param name The name of the {@link Field} in this Schema.
   * @returns The {@link Field}, or null of not found.
   */
  fieldByName(name) {
    return this.#fieldsByName[name] ?? null;
  }
  /** The configured name for the RediSearch index for this Schema. */
  get indexName() {
    return this.#options?.indexName ?? `${this.schemaName}:index`;
  }
  /** The configured name for the RediSearch index hash for this Schema. */
  get indexHashName() {
    return this.#options?.indexHashName ?? `${this.schemaName}:index:hash`;
  }
  /**
   * The configured data structure, a string with the value of either `HASH` or `JSON`,
   * that this Schema uses to store {@link Entity | Entities} in Redis.
   */
  get dataStructure() {
    return this.#options?.dataStructure ?? "JSON";
  }
  /**
   * The configured usage of stop words, a string with the value of either `OFF`, `DEFAULT`,
   * or `CUSTOM`. See {@link SchemaOptions} for more details.
   */
  get useStopWords() {
    return this.#options?.useStopWords ?? "DEFAULT";
  }
  /**
   * The configured stop words. Ignored if {@link Schema.useStopWords} is anything other
   * than `CUSTOM`.
   */
  get stopWords() {
    return this.#options?.stopWords ?? [];
  }
  /**
   * Generates a unique string using the configured {@link IdStrategy}.
   *
   * @returns The generated id.
   */
  async generateId() {
    const ulidStrategy = () => ulid();
    return await (this.#options?.idStrategy ?? ulidStrategy)();
  }
  /**
   * A hash for this Schema that is used to determine if the Schema has been
   * changed when calling {@link Repository#createIndex}.
   */
  get indexHash() {
    const data = JSON.stringify({
      definition: this.#definition,
      prefix: this.schemaName,
      indexName: this.indexName,
      indexHashName: this.indexHashName,
      dataStructure: this.dataStructure,
      useStopWords: this.useStopWords,
      stopWords: this.stopWords
    });
    return (0, import_crypto.createHash)("sha1").update(data).digest("base64");
  }
  #createFields() {
    const entries = Object.entries(this.#definition);
    return entries.forEach(([fieldName, fieldDef2]) => {
      const field = new Field(String(fieldName), fieldDef2);
      this.#validateField(field);
      this.#fieldsByName[fieldName] = field;
    });
  }
  #validateOptions() {
    const { dataStructure, useStopWords } = this;
    if (dataStructure !== "HASH" && dataStructure !== "JSON")
      throw new InvalidSchema(`'${dataStructure}' in an invalid data structure. Valid data structures are 'HASH' and 'JSON'.`);
    if (useStopWords !== "OFF" && useStopWords !== "DEFAULT" && useStopWords !== "CUSTOM")
      throw new InvalidSchema(`'${useStopWords}' in an invalid value for stop words. Valid values are 'OFF', 'DEFAULT', and 'CUSTOM'.`);
    if (this.#options?.idStrategy && typeof this.#options.idStrategy !== "function")
      throw new InvalidSchema("ID strategy must be a function that takes no arguments and returns a string.");
    if (this.schemaName === "")
      throw new InvalidSchema(`Schema name must be a non-empty string.`);
    if (this.indexName === "")
      throw new InvalidSchema(`Index name must be a non-empty string.`);
  }
  #validateField(field) {
    const { type } = field;
    if (type !== "boolean" && type !== "date" && type !== "number" && type !== "number[]" && type !== "point" && type !== "string" && type !== "string[]" && type !== "text")
      throw new InvalidSchema(`The field '${field.name}' is configured with a type of '${field.type}'. Valid types include 'boolean', 'date', 'number', 'number[]', 'point', 'string', 'string[]', and 'text'.`);
    if (type === "number[]" && this.dataStructure === "HASH")
      throw new InvalidSchema(`The field '${field.name}' is configured with a type of '${field.type}'. This type is only valid with a data structure of 'JSON'.`);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AbstractSearch,
  ArrayHashInput,
  Circle,
  Client,
  EntityId,
  EntityKeyName,
  Field,
  FieldNotInSchema,
  InvalidHashInput,
  InvalidHashValue,
  InvalidInput,
  InvalidJsonInput,
  InvalidJsonValue,
  InvalidSchema,
  InvalidValue,
  NestedHashInput,
  NullJsonInput,
  NullJsonValue,
  PointOutOfRange,
  RawSearch,
  RedisOmError,
  Repository,
  Schema,
  Search,
  SearchError,
  SemanticSearchError,
  Where,
  WhereField
});
