import type { SQL, SQLWrapper } from "drizzle-orm";
import type { QueryPromise, RunnableQuery, TypedQueryBuilder } from "drizzle-orm/query-promise";
import type {
  BuildSubquerySelection,
  ColumnsSelection,
  Join,
  JoinNullability,
  PgQueryResultHKT,
  PgQueryResultKind,
  PgSelectHKT,
  PgSelectQueryBuilderBase,
  PgTable,
  PgViewBase,
  SelectMode,
  SelectResult,
  Subquery,
} from "drizzle-orm/pg-core";

declare module "drizzle-orm/pg-core/query-builders/select" {
  interface PgSelectBase<
    TTableName extends string | undefined,
    TSelection extends ColumnsSelection,
    TSelectMode extends SelectMode,
    TNullabilityMap extends Record<string, JoinNullability> = TTableName extends string ? Record<TTableName, "not-null"> : {},
    TDynamic extends boolean = false,
    TExcludedMethods extends string = never,
    TResult extends any[] = SelectResult<TSelection, TSelectMode, TNullabilityMap>[],
    TSelectedFields extends ColumnsSelection = BuildSubquerySelection<TSelection, TNullabilityMap>,
  > extends PgSelectQueryBuilderBase<
      PgSelectHKT,
      TTableName,
      TSelection,
      TSelectMode,
      TNullabilityMap,
      TDynamic,
      TExcludedMethods,
      TResult,
      TSelectedFields
    >,
    QueryPromise<TResult>,
    SQLWrapper {
    get(): TResult[number] | undefined;
    all(): TResult;
  }
}

declare module "drizzle-orm/pg-core/query-builders/insert" {
  interface PgInsertBase<
    TTable extends PgTable,
    TQueryResult extends PgQueryResultHKT,
    TSelectedFields extends ColumnsSelection | undefined = undefined,
    TReturning extends Record<string, unknown> | undefined = undefined,
    TDynamic extends boolean = false,
    TExcludedMethods extends string = never,
  > extends TypedQueryBuilder<TSelectedFields, TReturning extends undefined ? PgQueryResultKind<TQueryResult, never> : TReturning[]>,
    QueryPromise<TReturning extends undefined ? PgQueryResultKind<TQueryResult, never> : TReturning[]>,
    RunnableQuery<TReturning extends undefined ? PgQueryResultKind<TQueryResult, never> : TReturning[], "pg">,
    SQLWrapper {
    run(): TReturning extends undefined ? PgQueryResultKind<TQueryResult, never> : TReturning[];
  }
}

declare module "drizzle-orm/pg-core/query-builders/update" {
  interface PgUpdateBase<
    TTable extends PgTable,
    TQueryResult extends PgQueryResultHKT,
    TFrom extends PgTable | Subquery | PgViewBase | SQL | undefined = undefined,
    TSelectedFields extends ColumnsSelection | undefined = undefined,
    TReturning extends Record<string, unknown> | undefined = undefined,
    TNullabilityMap extends Record<TTable["_"]["name"], "not-null"> = Record<TTable["_"]["name"], "not-null">,
    TJoins extends Join[] = [],
    TDynamic extends boolean = false,
    TExcludedMethods extends string = never,
  > extends TypedQueryBuilder<TSelectedFields, TReturning extends undefined ? PgQueryResultKind<TQueryResult, never> : TReturning[]>,
    QueryPromise<TReturning extends undefined ? PgQueryResultKind<TQueryResult, never> : TReturning[]>,
    RunnableQuery<TReturning extends undefined ? PgQueryResultKind<TQueryResult, never> : TReturning[], "pg">,
    SQLWrapper {
    run(): TReturning extends undefined ? PgQueryResultKind<TQueryResult, never> : TReturning[];
  }
}

declare module "drizzle-orm/pg-core/query-builders/delete" {
  interface PgDeleteBase<
    TTable extends PgTable,
    TQueryResult extends PgQueryResultHKT,
    TSelectedFields extends ColumnsSelection | undefined = undefined,
    TReturning extends Record<string, unknown> | undefined = undefined,
    TDynamic extends boolean = false,
    TExcludedMethods extends string = never,
  > extends TypedQueryBuilder<TSelectedFields, TReturning extends undefined ? PgQueryResultKind<TQueryResult, never> : TReturning[]>,
    QueryPromise<TReturning extends undefined ? PgQueryResultKind<TQueryResult, never> : TReturning[]>,
    RunnableQuery<TReturning extends undefined ? PgQueryResultKind<TQueryResult, never> : TReturning[], "pg">,
    SQLWrapper {
    run(): TReturning extends undefined ? PgQueryResultKind<TQueryResult, never> : TReturning[];
  }
}
