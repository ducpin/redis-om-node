import { createClient, createCluster, RediSearchSchema, SearchOptions } from 'redis';

/** The Symbol used to access the entity ID of an {@link Entity}. */
declare const EntityId: unique symbol;
/** The Symbol used to access the keyname of an {@link Entity}. */
declare const EntityKeyName: unique symbol;
type EntityInternal = {
    /** The unique ID of the {@link Entity}. Access using the {@link EntityId} Symbol. */
    [EntityId]?: string;
    /** The key the {@link Entity} is stored under inside of Redis. Access using the {@link EntityKeyName} Symbol. */
    [EntityKeyName]?: string;
};
/** Defines the objects returned from calls to {@link Repository | repositories }. */
type Entity = EntityData & EntityInternal;
type EntityKeys<T extends Entity> = Exclude<keyof T, keyof EntityInternal>;
/** The free-form data associated with an {@link Entity}. */
type EntityData = {
    [key: string]: EntityDataValue | EntityData | Array<EntityDataValue | EntityData>;
};
/** Valid types for values in an {@link Entity}. */
type EntityDataValue = string | number | boolean | Date | Point | null | undefined | Array<EntityDataValue | EntityData>;
/** Defines a point on the globe using longitude and latitude. */
type Point = {
    /** The longitude of the point. */
    longitude: number;
    /** The latitude of the point. */
    latitude: number;
};

/** Valid field types for a {@link FieldDefinition}. */
type FieldType = 'boolean' | 'date' | 'number' | 'number[]' | 'point' | 'string' | 'string[]' | 'text';
/** All configuration properties that any field might have, regardless of type. */
type AllFieldDefinition = {
    /** The type of the field (i.e. string, number, boolean, etc.) */
    type: FieldType;
    /**
     * The default field name in Redis is the property name defined in the
     * {@link SchemaDefinition}. Overrides the field name for a Hash to this
     * value or in the case of JSON documents, sets the JSONPath to this
     * value preceded by `$.`. Overridden by {@link field} and/or {@link path}
     * settings.
     * @deprecated
     */
    alias?: string;
    /**
     * Is this field indexed and thus searchable with Redis OM. Defaults
     * to true.
     */
    indexed?: boolean;
    /**
     * The field name used to store this in a Redis Hash. Defaults to the
     * name used in the {@link SchemaDefinition} or the {@link alias}
     * property.
     */
    field?: string;
    /**
     * The JSONPath expression this field references. Used only by search
     * and only for JSON documents. Defaults to the name used in the
     * {@link SchemaDefinition} or the {@link alias} property prefixed
     * with `$.` .
     */
    path?: string;
    /** Enables sorting by this field. */
    sortable?: boolean;
    /** Is the original case of this field indexed with Redis OM. Defaults to false. */
    caseSensitive?: boolean;
    /** Is this (sortable) field normalized when indexed. Defaults to true. */
    normalized?: boolean;
    /**
     * Due to how RediSearch works, strings and arrays are sometimes stored the same in Redis, as a
     * simple string. This is the separator used to split those strings when it is an array. If your
     * StringField contains this separator, this can cause problems. You can change it here to avoid
     * those problems. Defaults to `|`.
     */
    separator?: string;
    /**
     * Enables setting the phonetic matcher to use, supported matchers are:
     * dm:en - Double Metaphone for English
     * dm:fr - Double Metaphone for French
     * dm:pt - Double Metaphone for Portuguese
     * dm:es - Double Metaphone for Spanish
     */
    matcher?: 'dm:en' | 'dm:fr' | 'dm:pt' | 'dm:es';
    /** Is word stemming applied to this field with Redis OM. Defaults to true. */
    stemming?: boolean;
    /** Enables setting the weight to apply to a text field */
    weight?: number;
};
/** The configuration properties that all fields have in common. */
type CommonFieldDefinition = Pick<AllFieldDefinition, "type" | "alias" | "indexed" | "field" | "path">;
/** A field representing a boolean. */
type BooleanFieldDefinition = {
    type: 'boolean';
} & CommonFieldDefinition & Pick<AllFieldDefinition, "sortable">;
/** A field representing a date/time. */
type DateFieldDefinition = {
    type: 'date';
} & CommonFieldDefinition & Pick<AllFieldDefinition, "sortable">;
/** A field representing a number. */
type NumberFieldDefinition = {
    type: 'number';
} & CommonFieldDefinition & Pick<AllFieldDefinition, "sortable">;
/** A field representing an array of numbers. */
type NumberArrayFieldDefinition = {
    type: 'number[]';
} & CommonFieldDefinition & Pick<AllFieldDefinition, "sortable">;
/** A field representing a point on the globe. */
type PointFieldDefinition = {
    type: 'point';
} & CommonFieldDefinition;
/** A field representing a whole string. */
type StringFieldDefinition = {
    type: 'string';
} & CommonFieldDefinition & Pick<AllFieldDefinition, "sortable" | "caseSensitive" | "normalized" | "separator">;
/** A field representing an array of strings. */
type StringArrayFieldDefinition = {
    type: 'string[]';
} & CommonFieldDefinition & Pick<AllFieldDefinition, "sortable" | "caseSensitive" | "normalized" | "separator">;
/** A field representing searchable text. */
type TextFieldDefinition = {
    type: 'text';
} & CommonFieldDefinition & Pick<AllFieldDefinition, "sortable" | "normalized" | "matcher" | "stemming" | "weight">;
/** Contains instructions telling how to map a property on an {@link Entity} to Redis. */
type FieldDefinition = BooleanFieldDefinition | DateFieldDefinition | NumberFieldDefinition | NumberArrayFieldDefinition | PointFieldDefinition | StringFieldDefinition | StringArrayFieldDefinition | TextFieldDefinition;
/** Group of {@link FieldDefinition}s that define the schema for an {@link Entity}. */
type SchemaDefinition<T extends Entity = Record<string, any>> = Record<EntityKeys<T>, FieldDefinition>;

/**
 * Describes a field in a {@link Schema}.
 */
declare class Field {
    #private;
    /**
     * Creates a Field.
     *
     * @param name The name of the Field.
     * @param definition The underlying {@link FieldDefinition}.
     */
    constructor(name: string, definition: FieldDefinition);
    /** The name of the field. */
    get name(): string;
    /** The {@link FieldType | type} of the field. */
    get type(): FieldType;
    /** The field name used to store this {@link Field} in a Hash. */
    get hashField(): string;
    /** The JSONPath used to store this {@link Field} in a JSON document. */
    get jsonPath(): string;
    /** The separator for string[] fields when stored in Hashes. */
    get separator(): string;
    /** Indicates that the field as sortable. */
    get sortable(): boolean;
    /** The case-sensitivity of the field. */
    get caseSensitive(): boolean;
    /** Indicates the field as being indexed—and thus queryable—by RediSearch. */
    get indexed(): boolean;
    /** Indicates that the field as indexed with stemming support. */
    get stemming(): boolean;
    /** Indicates that the field is normalized. Ignored if sortable is false. */
    get normalized(): boolean;
    /** The search weight of the field. */
    get weight(): number | null;
    /** The phonetic matcher for the field. */
    get matcher(): string | null;
    /** Is this type an array or not. */
    get isArray(): boolean;
}

/** The type of data structure in Redis to map objects to. */
type DataStructure = 'HASH' | 'JSON';
/** A function that generates random entityIds. */
type IdStrategy = () => Promise<string>;
/** Valid values for how to use stop words for a given {@link Schema}. */
type StopWordOptions = 'OFF' | 'DEFAULT' | 'CUSTOM';
/** Configuration options for a {@link Schema}. */
type SchemaOptions = {
    /**
     * The name used by RediSearch to store the index for this {@link Schema}. Defaults
     * to prefix followed by `:index`. So, for a prefix of `Foo`, it would use `Foo:index`.
     */
    indexName?: string;
    /**
     * The name used by Redis OM to store the hash of the index for this {@link Schema}.
     * Defaults to prefix followed by `:index:hash`. So, for a prefix of `Foo`, it would
     * use `Foo:index:hash`.
     */
    indexHashName?: string;
    /** The data structure used to store the {@link Entity} in Redis. Can be set
     * to either `JSON` or `HASH`. Defaults to JSON.
     */
    dataStructure?: DataStructure;
    /**
     * A function that generates a random entityId. Defaults to a function that generates
     * [ULIDs](https://github.com/ulid/spec). Combined with prefix to generate a Redis key.
     * If prefix is `Foo` and idStratgey returns `12345` then the generated key would be
     * `Foo:12345`.
     */
    idStrategy?: IdStrategy;
    /**
     * Configures the usage of stop words. Valid values are `OFF`, `DEFAULT`, and `CUSTOM`.
     * Setting this to `OFF` disables all stop words. Setting this to `DEFAULT` uses the
     * stop words intrinsic to RediSearch. Setting this to `CUSTOM` tells RediSearch to
     * use the stop words in `stopWords`.
     */
    useStopWords?: StopWordOptions;
    /**
     * Stop words to be used by this schema. If `useStopWords` is
     * anything other than `CUSTOM`, this option is ignored.
     */
    stopWords?: Array<string>;
};

/**
 * Defines a schema that determines how an {@link Entity} is mapped
 * to Redis data structures. Construct by passing in a schema name,
 * a {@link SchemaDefinition}, and optionally {@link SchemaOptions}:
 *
 * ```typescript
 * interface Foo extends Entity {
 *   aString: string,
 *   aNumber: number,
 *   aBoolean: boolean,
 *   someText: string,
 *   aPoint: Point,
 *   aDate: Date,
 *   someStrings: string[],
 * }
 *
 * const schema = new Schema<Foo>('foo', {
 *   aString: { type: 'string' },
 *   aNumber: { type: 'number' },
 *   aBoolean: { type: 'boolean' },
 *   someText: { type: 'text' },
 *   aPoint: { type: 'point' },
 *   aDate: { type: 'date' },
 *   someStrings: { type: 'string[]' }
 * }, {
 *   dataStructure: 'HASH'
 * })
 * ```
 *
 * A Schema is primarily used by a {@link Repository} which requires a Schema in
 * its constructor.
 */
declare class Schema<T extends Entity = Record<string, any>> {
    #private;
    /**
     * Constructs a Schema.
     *
     * @param schemaName The name of the schema. Prefixes the ID when creating Redis keys.
     * @param schemaDef Defines all of the fields for the Schema and how they are mapped to Redis.
     * @param options Additional options for this Schema.
     */
    constructor(schemaName: string, schemaDef: SchemaDefinition<T>, options?: SchemaOptions);
    /**
     * The name of the schema. Prefixes the ID when creating Redis keys. Combined
     * with the results of idStrategy to generate a key. If name is `foo` and
     * idStrategy returns `12345` then the generated key would be `foo:12345`.
     */
    get schemaName(): string;
    /** The {@link Field | Fields} defined by this Schema. */
    get fields(): Field[];
    /**
     * Gets a single {@link Field} defined by this Schema.
     *
     * @param name The name of the {@link Field} in this Schema.
     * @returns The {@link Field}, or null of not found.
     */
    fieldByName(name: EntityKeys<T>): Field | null;
    /** The configured name for the RediSearch index for this Schema. */
    get indexName(): string;
    /** The configured name for the RediSearch index hash for this Schema. */
    get indexHashName(): string;
    /**
     * The configured data structure, a string with the value of either `HASH` or `JSON`,
     * that this Schema uses to store {@link Entity | Entities} in Redis.
     */
    get dataStructure(): DataStructure;
    /**
     * The configured usage of stop words, a string with the value of either `OFF`, `DEFAULT`,
     * or `CUSTOM`. See {@link SchemaOptions} for more details.
     */
    get useStopWords(): StopWordOptions;
    /**
     * The configured stop words. Ignored if {@link Schema.useStopWords} is anything other
     * than `CUSTOM`.
     */
    get stopWords(): Array<string>;
    /**
     * Generates a unique string using the configured {@link IdStrategy}.
     *
     * @returns The generated id.
     */
    generateId(): Promise<string>;
    /**
     * A hash for this Schema that is used to determine if the Schema has been
     * changed when calling {@link Repository#createIndex}.
     */
    get indexHash(): string;
}
type InferSchema<T> = T extends Schema<infer R> ? R : never;

/**
 * Abstract base class used extensively with {@link Search}.
 */
declare abstract class Where {
    /**
     * Converts this {@link Where} into a portion of a RediSearch query.
     */
    abstract toString(): string;
}

type Units = 'm' | 'km' | 'ft' | 'mi';
/** A function that defines a circle for `.inCircle` searches. */
type CircleFunction = (circle: Circle) => Circle;
/** A builder that defines a circle. */
declare class Circle {
    /** @internal */
    longitudeOfOrigin: number;
    /** @internal */
    latitudeOfOrigin: number;
    /** @internal */
    size: number;
    /** @internal */
    units: Units;
    /**
     * Sets the longitude. If not set, defaults to 0.0.
     *
     * @param value The longitude.
     * @returns This instance.
     */
    longitude(value: number): this;
    /**
     * Sets the latitude. If not set, defaults to 0.0.
     *
     * @param value The latitude.
     * @returns This instance.
     */
    latitude(value: number): this;
    /**
     * Sets the origin of the circle using a {@link Point}. If not
     * set, defaults to [Null Island](https://en.wikipedia.org/wiki/Null_Island).
     *
     * @param point A {@link Point} containing the longitude and latitude of the origin.
     * @returns This instance.
     */
    origin(point: Point): Circle;
    /**
     * Sets the origin of the circle. If not set, defaults to
     * [Null Island](https://en.wikipedia.org/wiki/Null_Island).
     *
     * @param longitude The longitude.
     * @param latitude The latitude.
     * @returns This instance.
     */
    origin(longitude: number, latitude: number): Circle;
    /**
     * Sets the radius of the {@link Circle}. Defaults to 1. If units are
     * not specified, defaults to meters.
     *
     * @param size The radius of the circle.
     * @returns This instance.
     */
    radius(size: number): this;
    /**
     * Sets the units to meters.
     * @returns This instance.
     */
    get m(): this;
    /**
     * Sets the units to meters.
     * @returns This instance.
     */
    get meter(): this;
    /**
     * Sets the units to meters.
     * @returns This instance.
     */
    get meters(): this;
    /**
     * Sets the units to kilometers.
     * @returns This instance.
     */
    get km(): this;
    /**
     * Sets the units to kilometers.
     * @returns This instance.
     */
    get kilometer(): this;
    /**
     * Sets the units to kilometers.
     * @returns This instance.
     */
    get kilometers(): this;
    /**
     * Sets the units to feet.
     * @returns This instance.
     */
    get ft(): this;
    /**
     * Sets the units to feet.
     * @returns This instance.
     */
    get foot(): this;
    /**
     * Sets the units to feet.
     * @returns This instance.
     */
    get feet(): this;
    /**
     * Sets the units to miles.
     * @returns This instance.
     */
    get mi(): this;
    /**
     * Sets the units to miles.
     * @returns This instance.
     */
    get mile(): this;
    /**
     * Sets the units to miles.
     * @returns This instance.
     */
    get miles(): this;
}

/**
 * Interface with all the methods from all the concrete
 * classes under {@link WhereField}.
 */
interface WhereField<T extends Entity = Record<string, any>> extends Where {
    /**
     * Adds an equals comparison to the query.
     *
     * NOTE: this function is not available for strings where full-text
     * search is enabled. In that scenario, use `.match`.
     * @param value The value to be compared
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    eq(value: string | number | boolean | Date): Search<T>;
    /**
     * Adds an equals comparison to the query.
     *
     * NOTE: this function is not available for strings where full-text
     * search is enabled. In that scenario, use `.match`.
     * @param value The value to be compared
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    equal(value: string | number | boolean | Date): Search<T>;
    /**
     * Adds an equals comparison to the query.
     *
     * NOTE: this function is not available for strings where full-text
     * search is enabled. In that scenario, use `.match`.
     * @param value The value to be compared
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    equals(value: string | number | boolean | Date): Search<T>;
    /**
     * Adds an equals comparison to the query.
     *
     * NOTE: this function is not available for strings where full-text
     * search is enabled. In that scenario, use `.match`.
     * @param value The value to be compared
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    equalTo(value: string | number | boolean | Date): Search<T>;
    /**
     * Adds a full-text search comparison to the query.
     * @param value The word or phrase sought.
     * @param options
     * @param options.fuzzyMatching Whether to use fuzzy matching to find the sought word or phrase. Defaults to `false`.
     * @param options.levenshteinDistance The levenshtein distance to use for fuzzy matching. Supported values are `1`, `2`, and `3`. Defaults to `1`.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    match(value: string | number | boolean, options?: {
        fuzzyMatching?: boolean;
        levenshteinDistance?: 1 | 2 | 3;
    }): Search<T>;
    /**
     * Adds a full-text search comparison to the query.
     * @param value The word or phrase sought.
     * @param options
     * @param options.fuzzyMatching Whether to use fuzzy matching to find the sought word or phrase. Defaults to `false`.
     * @param options.levenshteinDistance The levenshtein distance to use for fuzzy matching. Supported values are `1`, `2`, and `3`. Defaults to `1`.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    matches(value: string | number | boolean, options?: {
        fuzzyMatching?: boolean;
        levenshteinDistance?: 1 | 2 | 3;
    }): Search<T>;
    /**
     * Adds a full-text search comparison to the query that matches an exact word or phrase.
     * @param value The word or phrase sought.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    matchExact(value: string | number | boolean): Search<T>;
    /**
     * Adds a full-text search comparison to the query that matches an exact word or phrase.
     * @param value The word or phrase sought.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    matchExactly(value: string | number | boolean): Search<T>;
    /**
     * Adds a full-text search comparison to the query that matches an exact word or phrase.
     * @param value The word or phrase sought.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    matchesExactly(value: string | number | boolean): Search<T>;
    /**
     * Makes a call to {@link WhereField.match} a {@link WhereField.matchExact} call. Calling
     * this multiple times will have no effect.
     * @returns this.
     */
    readonly exact: WhereField<T>;
    /**
     * Makes a call to {@link WhereField.match} a {@link WhereField.matchExact} call. Calling
     * this multiple times will have no effect.
     * @returns this.
     */
    readonly exactly: WhereField<T>;
    /**
     * Adds a boolean match with a value of `true` to the query.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    true(): Search<T>;
    /**
     * Adds a boolean match with a value of `false` to the query.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    false(): Search<T>;
    /**
     * Adds a greater than comparison against a field to the search query.
     * @param value The value to compare against.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    gt(value: string | number | Date): Search<T>;
    /**
     * Adds a greater than comparison against a field to the search query.
     * @param value The value to compare against.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    greaterThan(value: string | number | Date): Search<T>;
    /**
     * Adds a greater than or equal to comparison against a field to the search query.
     * @param value The value to compare against.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    gte(value: string | number | Date): Search<T>;
    /**
     * Adds a greater than or equal to comparison against a field to the search query.
     * @param value The value to compare against.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    greaterThanOrEqualTo(value: string | number | Date): Search<T>;
    /**
     * Adds a less than comparison against a field to the search query.
     * @param value The value to compare against.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    lt(value: string | number | Date): Search<T>;
    /**
     * Adds a less than comparison against a field to the search query.
     * @param value The value to compare against.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    lessThan(value: string | number | Date): Search<T>;
    /**
     * Adds a less than or equal to comparison against a field to the search query.
     * @param value The value to compare against.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    lte(value: string | number | Date): Search<T>;
    /**
     * Adds a less than or equal to comparison against a field to the search query.
     * @param value The value to compare against.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    lessThanOrEqualTo(value: string | number | Date): Search<T>;
    /**
     * Adds an inclusive range comparison against a field to the search query.
     * @param lower The lower bound of the range.
     * @param upper The upper bound of the range.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    between(lower: string | number | Date, upper: string | number | Date): Search<T>;
    /**
     * Adds a whole-string match for a value within a string array to the search query.
     * @param value The string to be matched.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    contain(value: string): Search<T>;
    /**
     * Adds a whole-string match for a value within a string array to the search query.
     * @param value The string to be matched.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    contains(value: string): Search<T>;
    /**
     * Adds a whole-string match against a string array to the query. If any of the provided
     * strings in `value` is matched in the array, this matched.
     * @param value An array of strings that you want to match one of.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    containOneOf(...value: Array<string>): Search<T>;
    /**
     * Adds a whole-string match against a string array to the query. If any of the provided
     * strings in `value` is matched in the array, this matched.
     * @param value An array of strings that you want to match one of.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    containsOneOf(...value: Array<string>): Search<T>;
    /**
     * Adds a search for points that fall within a defined circle.
     * @param circleFn A function that returns a {@link Circle} instance defining the search area.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    inCircle(circleFn: CircleFunction): Search<T>;
    /**
     * Adds a search for points that fall within a defined radius.
     * @param circleFn A function that returns a {@link Circle} instance defining the search area.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    inRadius(circleFn: CircleFunction): Search<T>;
    /**
     * Add a search for an exact UTC datetime to the query.
     * @param value The datetime to match.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    on(value: string | number | Date): Search<T>;
    /**
     * Add a search that matches all datetimes *before* the provided UTC datetime to the query.
     * @param value The datetime to compare against.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    before(value: string | number | Date): Search<T>;
    /**
     * Add a search that matches all datetimes *after* the provided UTC datetime to the query.
     * @param value The datetime to compare against.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    after(value: string | number | Date): Search<T>;
    /**
     * Add a search that matches all datetimes *on or before* the provided UTC datetime to the query.
     * @param value The datetime to compare against.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    onOrBefore(value: string | number | Date): Search<T>;
    /**
     * Add a search that matches all datetimes *on or after* the provided UTC datetime to the query.
     * @param value The datetime to compare against.
     * @returns The {@link Search} that was called to create this {@link WhereField}.
     */
    onOrAfter(value: string | number | Date): Search<T>;
}
/**
 * Abstract base class that all fields you want to filter
 * with extend. When you call {@link Search.where}, a
 * subclass of this is returned.
 */
declare abstract class WhereField<T extends Entity> {
    private negated;
    /** @internal */
    protected search: Search<T>;
    /** @internal */
    protected field: Field;
    /** @internal */
    constructor(search: Search<T>, field: Field);
    /**
     * Returns the current instance. Syntactic sugar to make your code more fluent.
     * @returns this
     */
    get is(): this;
    /**
     * Returns the current instance. Syntactic sugar to make your code more fluent.
     * @returns this
     */
    get does(): this;
    /**
     * Negates the query on the field, cause it to match when the condition is
     * *not* met. Calling this multiple times will negate the negation.
     * @returns this
     */
    get not(): this;
    abstract toString(): string;
    /** @internal */
    protected negate(): void;
    /** @internal */
    protected buildQuery(valuePortion: string): string;
    /** @internal */
    protected escapePunctuation(value: string): string;
    /** @internal */
    protected escapePunctuationAndSpaces(value: string): string;
}

/**
 * A function that takes a {@link Search} and returns a {@link Search}. Used in nested queries.
 * @template TEntity The type of {@link Entity} being sought.
 */
type SubSearchFunction<T extends Entity> = (search: Search<T>) => Search<T>;
type SortOptions = {
    BY: string;
    DIRECTION: "ASC" | "DESC";
};
/**
 * Abstract base class for {@link Search} and {@link RawSearch} that
 * contains methods to return search results.
 * @template TEntity The type of {@link Entity} being sought.
 */
declare abstract class AbstractSearch<T extends Entity = Record<string, any>> {
    /** @internal */
    protected schema: Schema<T>;
    /** @internal */
    protected client: Client;
    /** @internal */
    protected sortOptions?: SortOptions;
    /** @internal */
    constructor(schema: Schema<T>, client: Client);
    /** @internal */
    abstract get query(): string;
    /**
     * Applies an ascending sort to the query.
     * @param field The field to sort by.
     * @returns this
     */
    sortAscending(field: EntityKeys<T>): AbstractSearch<T>;
    /**
     * Alias for {@link Search.sortDescending}.
     */
    sortDesc(field: EntityKeys<T>): AbstractSearch<T>;
    /**
     * Applies a descending sort to the query.
     * @param field The field to sort by.
     * @returns this
     */
    sortDescending(field: EntityKeys<T>): AbstractSearch<T>;
    /**
     * Alias for {@link Search.sortAscending}.
     */
    sortAsc(field: EntityKeys<T>): AbstractSearch<T>;
    /**
     * Applies sorting for the query.
     * @param fieldName The field to sort by.
     * @param order The order of returned {@link Entity | Entities} Defaults to `ASC` (ascending) if not specified
     * @returns this
     */
    sortBy(fieldName: EntityKeys<T>, order?: "ASC" | "DESC"): AbstractSearch<T>;
    /**
     * Finds the {@link Entity} with the minimal value for a field.
     * @param field The field with the minimal value.
     * @returns The {@link Entity} with the minimal value
     */
    min(field: EntityKeys<T>): Promise<T | null>;
    /**
     * Finds the entity ID with the minimal value for a field.
     * @param field The field with the minimal value.
     * @returns The entity ID with the minimal value
     */
    minId(field: EntityKeys<T>): Promise<string | null>;
    /**
     * Finds the key name in Redis with the minimal value for a field.
     * @param field The field with the minimal value.
     * @returns The key name with the minimal value
     */
    minKey(field: EntityKeys<T>): Promise<string | null>;
    /**
     * Finds the {@link Entity} with the maximal value for a field.
     * @param field The field with the maximal value.
     * @returns The entity ID {@link Entity} with the maximal value
     */
    max(field: EntityKeys<T>): Promise<T | null>;
    /**
     * Finds the entity ID with the maximal value for a field.
     * @param field The field with the maximal value.
     * @returns The entity ID with the maximal value
     */
    maxId(field: EntityKeys<T>): Promise<string | null>;
    /**
     * Finds the key name in Redis with the maximal value for a field.
     * @param field The field with the maximal value.
     * @returns The key name with the maximal value
     */
    maxKey(field: EntityKeys<T>): Promise<string | null>;
    /**
     * Returns the number of {@link Entity | Entities} that match this query.
     * @returns
     */
    count(): Promise<number>;
    /**
     * Returns a page of {@link Entity | Entities} that match this query.
     * @param offset The offset for where to start returning {@link Entity | Entities}.
     * @param count The number of {@link Entity | Entities} to return.
     * @returns An array of {@link Entity | Entities} matching the query.
     */
    page(offset: number, count: number): Promise<T[]>;
    /**
     * Returns a page of entity IDs that match this query.
     * @param offset The offset for where to start returning entity IDs.
     * @param count The number of entity IDs to return.
     * @returns An array of strings matching the query.
     */
    pageOfIds(offset: number, count: number): Promise<string[]>;
    /**
     * Returns a page of key names in Redis that match this query.
     * @param offset The offset for where to start returning key names.
     * @param count The number of key names to return.
     * @returns An array of strings matching the query.
     */
    pageOfKeys(offset: number, count: number): Promise<string[]>;
    /**
     * Returns the first {@link Entity} that matches this query.
     */
    first(): Promise<T | null>;
    /**
     * Returns the first entity ID that matches this query.
     */
    firstId(): Promise<string | null>;
    /**
     * Returns the first key name that matches this query.
     */
    firstKey(): Promise<string | null>;
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
    all(options?: {
        pageSize: number;
    }): Promise<T[]>;
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
    allIds(options?: {
        pageSize: number;
    }): Promise<string[]>;
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
    allKeys(options?: {
        pageSize: number;
    }): Promise<string[]>;
    /**
     * Returns the current instance. Syntactic sugar to make your code more fluent.
     * @returns this
     */
    get return(): AbstractSearch<T>;
    /**
     * Alias for {@link Search.min}.
     */
    returnMin(field: EntityKeys<T>): Promise<T | null>;
    /**
     * Alias for {@link Search.minId}.
     */
    returnMinId(field: EntityKeys<T>): Promise<string | null>;
    /**
     * Alias for {@link Search.minKey}.
     */
    returnMinKey(field: EntityKeys<T>): Promise<string | null>;
    /**
     * Alias for {@link Search.max}.
     */
    returnMax(field: EntityKeys<T>): Promise<T | null>;
    /**
     * Alias for {@link Search.maxId}.
     */
    returnMaxId(field: EntityKeys<T>): Promise<string | null>;
    /**
     * Alias for {@link Search.maxKey}.
     */
    returnMaxKey(field: EntityKeys<T>): Promise<string | null>;
    /**
     * Alias for {@link Search.count}.
     */
    returnCount(): Promise<number>;
    /**
     * Alias for {@link Search.page}.
     */
    returnPage(offset: number, count: number): Promise<T[]>;
    /**
     * Alias for {@link Search.pageOfIds}.
     */
    returnPageOfIds(offset: number, count: number): Promise<string[]>;
    /**
     * Alias for {@link Search.pageOfKeys}.
     */
    returnPageOfKeys(offset: number, count: number): Promise<string[]>;
    /**
     * Alias for {@link Search.first}.
     */
    returnFirst(): Promise<T | null>;
    /**
     * Alias for {@link Search.firstId}.
     */
    returnFirstId(): Promise<string | null>;
    /**
     * Alias for {@link Search.firstKey}.
     */
    returnFirstKey(): Promise<string | null>;
    /**
     * Alias for {@link Search.all}.
     */
    returnAll(options?: {
        pageSize: number;
    }): Promise<T[]>;
    /**
     * Alias for {@link Search.allIds}.
     */
    returnAllIds(options?: {
        pageSize: number;
    }): Promise<string[]>;
    /**
     * Alias for {@link Search.allKeys}.
     */
    returnAllKeys(options?: {
        pageSize: number;
    }): Promise<string[]>;
    private allThings;
    private callSearch;
}
/**
 * Entry point to raw search which allows using raw RediSearch queries
 * against Redis OM. Requires that RediSearch (and optionally RedisJSON) be
 * installed.
 * @template TEntity The type of {@link Entity} being sought.
 */
declare class RawSearch<T extends Entity = Record<string, any>> extends AbstractSearch<T> {
    private readonly rawQuery;
    /** @internal */
    constructor(schema: Schema<T>, client: Client, query?: string);
    /** @internal */
    get query(): string;
}
/**
 * Entry point to fluent search. This is the default Redis OM experience.
 * Requires that RediSearch (and optionally RedisJSON) be installed.
 * @template TEntity The type of {@link Entity} being sought.
 */
declare class Search<T extends Entity = Record<string, any>> extends AbstractSearch<T> {
    private rootWhere?;
    /** @internal */
    get query(): string;
    /**
     * Sets up a query matching a particular field. If there are multiple calls
     * to {@link Search.where}, they are treated logically as AND.
     * @param field The field to filter on.
     * @returns A subclass of {@link WhereField} matching the type of the field.
     */
    where(field: EntityKeys<T>): WhereField<T>;
    /**
     * Sets up a nested search. If there are multiple calls to {@link Search.where},
     * they are treated logically as AND.
     * @param subSearchFn A function that takes a {@link Search} and returns another {@link Search}.
     * @returns `this`.
     */
    where(subSearchFn: SubSearchFunction<T>): Search<T>;
    /**
     * Sets up a query matching a particular field as a logical AND.
     * @param field The field to filter on.
     * @returns A subclass of {@link WhereField} matching the type of the field.
     */
    and(field: EntityKeys<T>): WhereField<T>;
    /**
     * Sets up a nested search as a logical AND.
     * @param subSearchFn A function that takes a {@link Search} and returns another {@link Search}.
     * @returns `this`.
     */
    and(subSearchFn: SubSearchFunction<T>): Search<T>;
    /**
     * Sets up a query matching a particular field as a logical OR.
     * @param field The field to filter on.
     * @returns A subclass of {@link WhereField} matching the type of the field.
     */
    or(field: EntityKeys<T>): WhereField<T>;
    /**
     * Sets up a nested search as a logical OR.
     * @param subSearchFn A function that takes a {@link Search} and returns another {@link Search}.
     * @returns `this`.
     */
    or(subSearchFn: SubSearchFunction<T>): Search<T>;
    private anyWhere;
    private anyWhereForField;
    private anyWhereForFunction;
    private createWhere;
}

/**
 * A repository is the main interaction point for reading, writing, and
 * removing {@link Entity | Entities} from Redis. Create one by calling
 * {@link Client.fetchRepository} and passing in a {@link Schema}. Then
 * use the {@link Repository#fetch}, {@link Repository#save}, and
 * {@link Repository#remove} methods to manage your data:
 *
 * ```typescript
 * const repository = client.fetchRepository(schema)
 *
 * const foo = await repository.fetch('01FK6TCJBDK41RJ766A4SBWDJ9')
 * foo.aString = 'bar'
 * foo.aBoolean = false
 * await repository.save(foo)
 * ```
 *
 * Use the repository to create a new instance of an {@link Entity}
 * before you save it:
 *
 * ```typescript
 * const foo = await repository.createEntity()
 * foo.aString = 'bar'
 * foo.aBoolean = false
 * await repository.save(foo)
 * ```
 *
 * If you want to use the {@link Repository#search} method, you need to create an index
 * first, and you need RediSearch or RedisJSON installed on your instance of Redis:
 *
 * ```typescript
 * await repository.createIndex()
 * const entities = await repository.search()
 *   .where('aString').eq('bar')
 *   .and('aBoolean').is.false().returnAll()
 * ```
 */
declare class Repository<T extends Entity = Record<string, any>> {
    #private;
    private readonly client;
    /**
     * Creates a new {@link Repository}.
     *
     * @param schema The schema defining that data in the repository.
     * @param clientOrConnection A client to talk to Redis.
     */
    constructor(schema: Schema<T>, clientOrConnection: Client | RedisConnection);
    /**
     * Creates an index in Redis for use by the {@link Repository#search} method.
     * Does not create a new index if the index hasn't changed. Requires that
     * RediSearch and RedisJSON are installed on your instance of Redis.
     */
    createIndex(): Promise<void>;
    /**
     * Removes an existing index from Redis. Use this method if you want to swap out your index
     * because your {@link Entity} has changed. Requires that RediSearch and RedisJSON are installed
     * on your instance of Redis.
     */
    dropIndex(): Promise<void>;
    /**
     * Insert or update an {@link Entity} to Redis using its entityId property
     * if present. If it's not, one is generated.
     *
     * @param entity The Entity to save.
     * @returns A copy of the provided Entity with EntityId and EntityKeyName properties added.
     */
    save(entity: T): Promise<T>;
    /**
     * Insert or update the {@link Entity} to Redis using the provided entityId.
     *
     * @param id The id to save the Entity under.
     * @param entity The Entity to save.
     * @returns A copy of the provided Entity with EntityId and EntityKeyName properties added.
     */
    save(id: string, entity: T): Promise<T>;
    /**
     * Read and return an {@link Entity} from Redis for the given id. If
     * the {@link Entity} is not found, returns an empty {@link Entity}.
     *
     * @param id The ID of the {@link Entity} you seek.
     * @returns The matching Entity.
     */
    fetch(id: string): Promise<T>;
    /**
     * Read and return the {@link Entity | Entities} from Redis with the given IDs. If
     * a particular {@link Entity} is not found, returns that {@link Entity} as empty.
     *
     * @param ids The IDs of the {@link Entity | Entities} you seek.
     * @returns The matching Entities.
     */
    fetch(...ids: string[]): Promise<T[]>;
    /**
     * Read and return the {@link Entity | Entities} from Redis with the given IDs. If
     * a particular {@link Entity} is not found, returns that {@link Entity} as empty.
     *
     * @param ids The IDs of the {@link Entity | Entities} you seek.
     * @returns The matching Entities.
     */
    fetch(ids: string[]): Promise<T[]>;
    /**
     * Remove an {@link Entity} from Redis for the given id. If the {@link Entity} is
     * not found, does nothing.
     *
     * @param id The ID of the {@link Entity} you wish to delete.
     */
    remove(id: string): Promise<void>;
    /**
     * Remove the {@link Entity | Entities} from Redis for the given ids. If a
     * particular {@link Entity} is not found, does nothing.
     *
     * @param ids The IDs of the {@link Entity | Entities} you wish to delete.
     */
    remove(...ids: string[]): Promise<void>;
    /**
     * Remove the {@link Entity | Entities} from Redis for the given ids. If a
     * particular {@link Entity} is not found, does nothing.
     *
     * @param ids The IDs of the {@link Entity | Entities} you wish to delete.
     */
    remove(ids: string[]): Promise<void>;
    /**
     * Set the time to live of the {@link Entity}. If the {@link Entity} is not
     * found, does nothing.
     *
     * @param id The ID of the {@link Entity} to set and expiration for.
     * @param ttlInSeconds The time to live in seconds.
     */
    expire(id: string, ttlInSeconds: number): Promise<void>;
    /**
     * Set the time to live of the {@link Entity | Entities} in Redis with the given
     * ids. If a particular {@link Entity} is not found, does nothing.
     *
     * @param ids The IDs of the {@link Entity | Entities} you wish to delete.
     * @param ttlInSeconds The time to live in seconds.
     */
    expire(ids: string[], ttlInSeconds: number): Promise<void>;
    /**
     * Use Date object to set the {@link Entity}'s time to live. If the {@link Entity}
     * is not found, does nothing.
     *
     * @param id The ID of the {@link Entity} to set an expiration date for.
     * @param expirationDate The time the data should expire.
     */
    expireAt(id: string, expirationDate: Date): Promise<void>;
    /**
     * Use Date object to set the {@link Entity | Entities} in Redis with the given
     * ids. If a particular {@link Entity} is not found, does nothing.
     *
     * @param ids The IDs of the {@link Entity | Entities} to set an expiration date for.
     * @param expirationDate The time the data should expire.
     */
    expireAt(ids: string[], expirationDate: Date): Promise<void>;
    /**
     * Kicks off the process of building a query. Requires that RediSearch (and optionally
     * RedisJSON) be installed on your instance of Redis.
     *
     * @returns A {@link Search} object.
     */
    search(): Search<T>;
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
    searchRaw(query: string): RawSearch<T>;
    private writeEntity;
    private readEntities;
    private readEntitiesFromHash;
    private writeEntityToJson;
    private readEntitiesFromJson;
    private makeKeys;
    private makeKey;
}

/** A conventional Redis connection. */
type RedisClientConnection = ReturnType<typeof createClient>;
/** A clustered Redis connection. */
type RedisClusterConnection = ReturnType<typeof createCluster>;
/** A Redis connection, clustered or conventional. */
type RedisConnection = RedisClientConnection | RedisClusterConnection;
/** @internal This is a defintion for the type that calls to ft.search in Node Redis return.  */
type SearchResults = {
    total: number;
    documents: SearchDocument[];
};
/** @internal This is a defintion for the return type of calls to ft.search in Node Redis.  */
type SearchDocument = {
    id: string;
    value: {
        [key: string]: any;
    };
};
/** @internal */
type RedisHashData = {
    [key: string]: string;
};
/** @internal */
type RedisJsonData = {
    [key: string]: any;
};
/** @internal */
type SearchDataStructure = 'HASH' | 'JSON';
/**
 * @internal This is a simplified redefintion of the CreateOptions type that is not exported by Node Redis.
 * TODO: Remove this type once CreateOptions is exported by Node Redis.
 * https://github.com/redis/node-redis/blob/master/packages/search/lib/commands/CREATE.ts#L4
 */
type CreateOptions = {
    ON: SearchDataStructure;
    PREFIX: string;
    STOPWORDS?: string[];
};
/**
 * A Client is the starting point for working with Redis OM. Clients manage the
 * connection to Redis and provide limited functionality for executing Redis commands.
 * Create a client and open it before you use it:
 *
 * ```typescript
 * const client = new Client()
 * await client.open()
 * ```
 *
 * A Client is primarily used by a {@link Repository} which requires a client in
 * its constructor.
 *
 * @deprecated Just use Node Redis client directly and pass it to the Repository.
 */
declare class Client {
    #private;
    /** Returns the underlying Node Redis connection being used. */
    get redis(): RedisConnection | undefined;
    /**
     * Attaches an existing Node Redis connection to this Redis OM client. Closes
     * any existing connection.
     *
     * @param connection An existing Node Redis client.
     * @returns This {@link Client} instance.
     */
    use(connection: RedisConnection): Promise<Client>;
    /**
     * Attaches an existing Node Redis connection to this Redis OM client. Does
     * not close any existing connection.
     *
     * @param connection An existing Node Redis client.
     * @returns This {@link Client} instance.
     */
    useNoClose(connection: RedisConnection): Client;
    /**
     * Open a connection to Redis at the provided URL.
     *
     * @param url A URL to Redis as defined with the [IANA](https://www.iana.org/assignments/uri-schemes/prov/redis).
     * @returns This {@link Client} instance.
     */
    open(url?: string): Promise<Client>;
    /**
     * Creates a repository for the given schema.
     *
     * @param schema The schema.
     * @returns A repository for the provided schema.
     */
    fetchRepository<T extends Schema<any>>(schema: T): Repository<InferSchema<T>>;
    /**
     * Close the connection to Redis.
     */
    close(): Promise<void>;
    /** @internal */
    createIndex(indexName: string, schema: RediSearchSchema, options: CreateOptions): Promise<void>;
    /** @internal */
    dropIndex(indexName: string): Promise<void>;
    /** @internal */
    search(indexName: string, query: string, options?: SearchOptions): Promise<SearchResults>;
    /** @internal */
    unlink(...keys: string[]): Promise<void>;
    /** @internal */
    expire(key: string, ttl: number): Promise<void>;
    /** @internal */
    expireAt(key: string, timestamp: Date): Promise<void>;
    /** @internal */
    get(key: string): Promise<string | null>;
    /** @internal */
    set(key: string, value: string): Promise<void>;
    /** @internal */
    hgetall(key: string): Promise<RedisHashData>;
    /** @internal */
    hsetall(key: string, data: RedisHashData): Promise<void>;
    /** @internal */
    jsonget(key: string): Promise<RedisJsonData | null>;
    /** @internal */
    jsonset(key: string, data: RedisJsonData): Promise<void>;
    /**
     * @returns Whether a connection is already open.
     */
    isOpen(): boolean;
}

declare class RedisOmError extends Error {
}

declare class InvalidInput extends RedisOmError {
}
declare class NullJsonInput extends InvalidInput {
    #private;
    constructor(field: Field);
    get fieldName(): string;
    get fieldType(): FieldType;
    get jsonPath(): string;
}
declare class InvalidJsonInput extends InvalidInput {
    #private;
    constructor(field: Field);
    get fieldName(): string;
    get fieldType(): FieldType;
    get jsonPath(): string;
}
declare class InvalidHashInput extends InvalidInput {
    #private;
    constructor(field: Field);
    get fieldName(): string;
    get fieldType(): FieldType;
}
declare class NestedHashInput extends InvalidInput {
    #private;
    constructor(property: string);
    get field(): string;
}
declare class ArrayHashInput extends InvalidInput {
    #private;
    constructor(property: string);
    get field(): string;
}

declare class InvalidSchema extends RedisOmError {
}

declare class InvalidValue extends RedisOmError {
}
declare class NullJsonValue extends InvalidValue {
    #private;
    constructor(field: Field);
    get fieldName(): string;
    get fieldType(): FieldType;
    get jsonPath(): string;
}
declare class InvalidJsonValue extends InvalidValue {
    #private;
    constructor(field: Field);
    get fieldName(): string;
    get fieldType(): FieldType;
    get jsonPath(): string;
}
declare class InvalidHashValue extends InvalidValue {
    #private;
    constructor(field: Field);
    get fieldName(): string;
    get fieldType(): FieldType;
    get hashField(): string;
}

declare class PointOutOfRange extends RedisOmError {
    #private;
    constructor(point: Point);
    get point(): {
        longitude: number;
        latitude: number;
    };
}

declare class SearchError extends RedisOmError {
}
declare class SemanticSearchError extends SearchError {
}
declare class FieldNotInSchema extends SearchError {
    #private;
    constructor(fieldName: string);
    get field(): string;
}

export { AbstractSearch, AllFieldDefinition, ArrayHashInput, BooleanFieldDefinition, Circle, CircleFunction, Client, CommonFieldDefinition, DataStructure, DateFieldDefinition, Entity, EntityData, EntityDataValue, EntityId, EntityInternal, EntityKeyName, EntityKeys, Field, FieldDefinition, FieldNotInSchema, FieldType, IdStrategy, InferSchema, InvalidHashInput, InvalidHashValue, InvalidInput, InvalidJsonInput, InvalidJsonValue, InvalidSchema, InvalidValue, NestedHashInput, NullJsonInput, NullJsonValue, NumberArrayFieldDefinition, NumberFieldDefinition, Point, PointFieldDefinition, PointOutOfRange, RawSearch, RedisClientConnection, RedisClusterConnection, RedisConnection, RedisOmError, Repository, Schema, SchemaDefinition, SchemaOptions, Search, SearchError, SemanticSearchError, StopWordOptions, StringArrayFieldDefinition, StringFieldDefinition, SubSearchFunction, TextFieldDefinition, Where, WhereField };
