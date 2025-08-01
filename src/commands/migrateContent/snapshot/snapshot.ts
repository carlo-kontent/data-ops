import { match, P } from "ts-pattern";

import { type LogOptions, logError } from "../../../log.js";
import {
  type MigrateContentSnapshotParams,
  migrateContentSnapshotInternal,
} from "../../../modules/migrateContent/migrateContentSnapshot.js";
import type { RegisterCommand } from "../../../types/yargs.js";
import { simplifyErrors } from "../../../utils/error.js";

const commandName = "snapshot";
const itemsFilterParams = ["items", "filter", "last", "byTypesCodenames"] as const;

export const register: RegisterCommand = (yargs) =>
  yargs.command({
    command: commandName,
    describe: "Generates snapshot .zip file for migrate-content from Kontent.ai environment.",
    builder: (yargs) =>
      yargs
        .option("sourceEnvironmentId", {
          type: "string",
          describe: "Id of Kontent.ai environment containing source content.",
          demandOption: "You need to provide the environmentId for source Kontent.ai environment.",
          alias: "s",
        })
        .option("sourceApiKey", {
          type: "string",
          describe: "Management Api key of Kontent.ai environment containing source content.",
          demandOption:
            "You need to provide a Management API key for source Kontent.ai environment.",
          alias: "sk",
        })
        .option("sourceDeliveryPreviewKey", {
          type: "string",
          describe:
            "Delivery Preview Api key of Kontent.ai environment containing source content. Use only when you want obtain codenames via delivery client.",
          alias: "sd",
        })
        .option("language", {
          type: "string",
          describe: "Defines language, for which content items will be migrated.",
          demandOption: "You need to provide language.",
          alias: "l",
        })
        .option("items", {
          type: "array",
          string: true,
          describe: "Array of content items codenames to be migrated.",
          alias: "i",
          conflicts: itemsFilterParams.filter((p) => p !== "items"),
        })
        .option("filename", {
          type: "string",
          describe: "Filename where items should be stored.",
          alias: "f",
        })
        .option("last", {
          type: "number",
          describe: "Migrate x lastly modified items",
          conflicts: itemsFilterParams.filter((p) => p !== "last"),
        })
        .option("byTypesCodenames", {
          type: "array",
          string: true,
          describe: "Migrate items of specified content types",
          conflicts: itemsFilterParams.filter((p) => p !== "byTypesCodenames"),
        })
        .option("depth", {
          type: "number",
          describe:
            "Determines the level of linked items in Delivery API response. We encourage using with --limit to prevent hitting upper response limit.",
          conflicts: ["filter"],
        })
        .option("limit", {
          type: "number",
          describe:
            "Updates the limit for number of content items in one Delivery API response. For more information read the Delivery API docs.",
          conflicts: ["filter"],
        })
        .option("filter", {
          type: "string",
          describe:
            "A filter to obtain a subset of items codenames. See Delivery API documentation for more information.",
          conflicts: itemsFilterParams.filter((p) => p !== "filter"),
        })
        .option("skipConfirmation", {
          type: "boolean",
          describe: "Skip confirmation message.",
        })
        .option("kontentUrl", {
          type: "string",
          describe: 'Custom URL for Kontent.ai endpoints. Defaults to "kontent.ai".',
        }),
    handler: (args) => migrateContentSnapshotCli(args).catch(simplifyErrors),
  });

type MigrateContentSnapshotCliParams = Readonly<{
  sourceEnvironmentId: string;
  sourceApiKey: string;
  sourceDeliveryPreviewKey?: string;
  language: string;
  filename: string | undefined;
  items: ReadonlyArray<string> | undefined;
  last: number | undefined;
  depth: number | undefined;
  limit: number | undefined;
  byTypesCodenames: ReadonlyArray<string> | undefined;
  filter: string | undefined;
  skipConfirmation: boolean | undefined;
  kontentUrl: string | undefined;
}> &
  LogOptions;

const migrateContentSnapshotCli = async (params: MigrateContentSnapshotCliParams) => {
  const resolvedParams = resolveParams(params);

  await migrateContentSnapshotInternal(resolvedParams, "migrate-content-snapshot");
};

const resolveParams = (params: MigrateContentSnapshotCliParams): MigrateContentSnapshotParams =>
  match(params)
    .returnType<MigrateContentSnapshotParams>()
    .with(
      { items: P.nonNullable, depth: P.nonNullable, sourceDeliveryPreviewKey: P.nonNullable },
      ({ items, depth, sourceDeliveryPreviewKey }) => ({
        ...params,
        items,
        depth,
        sourceDeliveryPreviewKey,
      }),
    )
    .with({ items: P.nonNullable }, ({ items }) => ({ ...params, items }))
    .with(
      { byTypesCodenames: P.nonNullable, sourceDeliveryPreviewKey: P.nonNullable },
      ({ byTypesCodenames, sourceDeliveryPreviewKey }) => ({
        ...params,
        byTypesCodenames,
        sourceDeliveryPreviewKey,
      }),
    )
    .with(
      { filter: P.nonNullable, sourceDeliveryPreviewKey: P.nonNullable },
      ({ filter, sourceDeliveryPreviewKey }) => ({ ...params, filter, sourceDeliveryPreviewKey }),
    )
    .with(
      { last: P.nonNullable, sourceDeliveryPreviewKey: P.nonNullable },
      ({ last, sourceDeliveryPreviewKey }) => ({ ...params, last, sourceDeliveryPreviewKey }),
    )
    .otherwise(() => {
      logError(
        params,
        "You need to provide exactly one from parameters: --items or --items with --depth, --filter, --byTypesCodenames, --last with --sourceDeliveryPreviewKey",
      );
      process.exit(1);
    });
