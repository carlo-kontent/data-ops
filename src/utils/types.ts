import type { SharedContracts } from "@kontent-ai/management-sdk";
import type { z } from "zod";

export type MapValues<Map extends ReadonlyMap<unknown, unknown>> = Map extends ReadonlyMap<
  unknown,
  infer Res
>
  ? Res
  : never;

export type IdReference = Readonly<{ id: string }>;
export type CodenameReference = Readonly<{ codename: string }>;

/**
 * Use this to replace inaccurate references for better ones in SDK types returned from MAPI.
 *
 * @example ReplaceReferences<LanguageVariantContracts.ILanguageVariantModel>
 *
 * @example ReplaceReferences<LanguageVariantContracts.ILanguageVariantModel, MyBetterReference>
 */
export type ReplaceReferences<
  T,
  R extends IdReference | CodenameReference = IdReference,
> = T extends object
  ? {
      [K in keyof T]: T[K] extends SharedContracts.IReferenceObjectContract
        ? SharedContracts.IReferenceObjectContract extends T[K]
          ? R
          : ReplaceReferences<T[K], R>
        : ReplaceReferences<T[K], R>;
    }
  : T;

export type RequiredId<T extends { [key in "id"]?: string }> = Replace<T, { id: string }>;
export type RequiredCodename<T extends { [key in "codename"]?: string }> = Replace<
  T,
  { codename: string }
>;

export type Replace<T, NewValues extends { [key in keyof T]?: unknown }> = T extends unknown
  ? Omit<T, keyof NewValues> & Readonly<NewValues>
  : never;

/**
 * Original Pick type extended to work on Union type objects
 */
export type SuperiorPick<T, K extends keyof T> = T extends unknown
  ? {
      [P in K]: T[P];
    }
  : never;

/**
 * Original Omit type extended to work on Union type objects
 */
export type SuperiorOmit<T, K extends keyof T> = T extends unknown
  ? SuperiorPick<T, Exclude<keyof T, K>>
  : never;

/**
 * A utility type that takes an object type and returns an union type representing
 * objects with one property from the `Obj` with all other properties set to `undefined`.
 *
 * The type ensures that only one property of the object can be defined at a time,
 * with all other properties explicitly set to `undefined` or omitted. This is useful
 * for cases where only one field is allowed to be set, commonly used in discriminated unions.
 *
 * @example
 * // Given an object type
 * type User = {
 *   id: number;
 *   name: string;
 *   email: string;
 * };
 *
 * // `AnyOnePropertyOf<User>` will be equivalent to:
 * // { id: number; name?: undefined; email?: undefined } |
 * // { id?: undefined; name: string; email?: undefined } |
 * // { id?: undefined; name?: undefined; email: string; }
 */
export type AnyOnePropertyOf<Obj extends object> = [keyof Obj, keyof Obj] extends [
  infer Key,
  infer AllKeys extends keyof Obj,
]
  ? Key extends keyof Obj
    ? { [K in Key]: Obj[K] } & { [K in Exclude<AllKeys, Key>]?: undefined }
    : never
  : never;

export type Expect<T, U extends T> = U;

/**
 * Adds a new property type to each object in a tuple of objects.
 *
 * @template Tuple - A tuple type consisting of objects.
 * @template ToAdd - An object type representing the properties to be added to each object in the tuple.
 *
 * @example
 * // If given a tuple of objects and an object to add:
 * type OriginalTuple = [{ name: string }, { age: number }];
 * type AdditionalProps = { id: number };
 * type Result = AddPropToObjectTuple<OriginalTuple, AdditionalProps>;
 * // Result: [{ id: number; name: string }, { id: number; age: number }]
 *
 * @example
 * // If the input tuple is not a tuple of objects, it results in `never`:
 * type Invalid = AddPropToObjectTuple<ReadonlyArray<number>, { id: number }>;
 * // Result: never
 *
 * @description
 * - If `Tuple` extends `ReadonlyArray<Object>`, meaning it is not a fixed-length tuple of objects,
 *   the resulting type is `never`.
 */
export type AddPropToObjectTuple<
  Tuple extends ReadonlyArray<unknown>,
  ToAdd extends object,
> = ReadonlyArray<unknown> extends Tuple ? never : { [Key in keyof Tuple]: ToAdd & Tuple[Key] };

/**
 * Maps a tuple of key-value pairs to an object type.
 *
 * @example
 * // For the following tuple type:
 * type Tuple = [['name', string], ['age', number]];
 *
 * // The resulting type will be:
 * type Result = ObjectFromTuple<Tuple>;
 * // {
 * //   name: string;
 * //   age: number;
 * // }
 */
export type ObjectFromTuple<T extends readonly (readonly [string, unknown])[]> = {
  [K in T[number][0]]: Extract<T[number], readonly [K, unknown]>[1];
};

export type IsSubset<A, B extends A> = B;
export type IsFullEnum<
  ActualEnum extends string,
  FullEnum extends ActualEnum,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _ActualEnum2 extends FullEnum,
> = ReadonlyArray<unknown>;

export type RequiredZodObject<T> = Readonly<{ [K in keyof T]-?: z.ZodType<T[K]> }>;
