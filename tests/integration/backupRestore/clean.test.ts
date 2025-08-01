import { config as dotenvConfig } from "dotenv";
import { describe, expect, it } from "vitest";

import { cleanEnvironment } from "../../../src/public.ts";
import { expectHelpText } from "../utils/expectations.ts";
import { type CommandError, runCommand } from "../utils/runCommand.ts";
import { withTestEnvironment } from "../utils/setup.ts";
import { expectSameEnvironments } from "./utils/compare.ts";
import {
  expectNoAssetFolders,
  expectNoAssets,
  expectNoItems,
  expectNoPreviewUrls,
  expectNoSnippets,
  expectNoSpaces,
  expectNoTaxonomies,
  expectNoTypes,
  expectNoWebhooks,
  expectNoWorkflows,
} from "./utils/isEmpty.ts";

dotenvConfig();

const { API_KEY, EXPORT_IMPORT_TEST_DATA_ENVIRONMENT_ID } = process.env;

if (!EXPORT_IMPORT_TEST_DATA_ENVIRONMENT_ID) {
  throw new Error("EXPORT_IMPORT_TEST_DATA_ENVIRONMENT_ID environment variable is not defined.");
}

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not defined.");
}

describe("clean command", () => {
  it.concurrent(
    "Cleans all entities in the target environment.",
    withTestEnvironment(EXPORT_IMPORT_TEST_DATA_ENVIRONMENT_ID, async (environmentId) => {
      const command = `environment clean -e=${environmentId} -k=${API_KEY} -s`;

      await runCommand(command);

      await expectNoAssetFolders(environmentId);
      await expectNoAssets(environmentId);
      await expectNoSnippets(environmentId);
      await expectNoTypes(environmentId);
      await expectNoItems(environmentId);
      await expectNoWorkflows(environmentId);
      await expectNoPreviewUrls(environmentId);
      await expectNoTaxonomies(environmentId);
      await expectNoWebhooks(environmentId);
    }),
  );

  it.concurrent(
    "Cleans only entities specified in the include parameter.",
    withTestEnvironment(EXPORT_IMPORT_TEST_DATA_ENVIRONMENT_ID, async (environmentId) => {
      const command = `environment clean -e=${environmentId} -k=${API_KEY} --include spaces contentItems previewUrls webSpotlight contentTypes contentTypeSnippets webhooks -s`;

      await runCommand(command);

      await expectSameEnvironments(environmentId, EXPORT_IMPORT_TEST_DATA_ENVIRONMENT_ID, {
        exclude: [
          "spaces",
          "items",
          "types",
          "snippets",
          "previewUrls",
          "variants",
          "webhooks",
          "webSpotlight",
          "workflows", // workflows are dependent on types, so when types are deleted, invalid id references preserves to types in workflows.
        ],
      });

      await expectNoItems(environmentId);
      await expectNoPreviewUrls(environmentId);
      await expectNoSnippets(environmentId);
      await expectNoTypes(environmentId);
      await expectNoSpaces(environmentId);
      await expectNoWebhooks(environmentId);
    }),
  );

  it.concurrent(
    "Cleans only entities not specified in the exclude parameter.",
    withTestEnvironment(EXPORT_IMPORT_TEST_DATA_ENVIRONMENT_ID, async (environmentId) => {
      await cleanEnvironment({
        environmentId,
        apiKey: API_KEY,
        exclude: ["languages", "collections"],
      });

      await expectSameEnvironments(environmentId, EXPORT_IMPORT_TEST_DATA_ENVIRONMENT_ID, {
        include: ["languages", "collections"],
      });

      await expectNoPreviewUrls(environmentId);
      await expectNoItems(environmentId);
      await expectNoTaxonomies(environmentId);
      await expectNoAssets(environmentId);
      await expectNoAssetFolders(environmentId);
      await expectNoSnippets(environmentId);
      await expectNoTypes(environmentId);
      await expectNoWebhooks(environmentId);
      await expectNoSpaces(environmentId);
      await expectNoWorkflows(environmentId);
    }),
  );

  it.concurrent("Errors when removing types with existing items, prints message.", () => {
    withTestEnvironment(EXPORT_IMPORT_TEST_DATA_ENVIRONMENT_ID, async (environmentId) => {
      const command = `environment clean -e=${environmentId} -k=${API_KEY} --include contentTypes -s`;

      const result = await runCommand(command).catch((err) => err as CommandError);

      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("is still used and cannot be deleted.");
    });
  });

  it.concurrent("Errors with help when both include and exclude are provided", async () => {
    const command =
      "environment clean --include collections contentTypes --exclude contentTypes -e test -k test -s";

    const result = await runCommand(command).catch((err) => err as CommandError);

    expect(result.stdout).toBe("");
    await expectHelpText(result.stderr, "environment clean");
    expect(result.stderr).toContain("Arguments include and exclude are mutually exclusive");
  });

  it.concurrent("Errors with help when include contains invalid entity names", async () => {
    const command = "environment clean --include collections invalidEntity -k test -e test -s";

    const result = await runCommand(command).catch((err) => err as CommandError);

    expect(result.stdout).toBe("");
    await expectHelpText(result.stderr, "environment clean");
    expect(result.stderr).toContain("Invalid values");
    expect(result.stderr).toContain('include, Given: "invalidEntity", Choices: ');
  });

  it.concurrent("Errors with help when exclude contains invalid entity names", async () => {
    const command = "environment clean --exclude collections invalidEntity -k test -e test -s";

    const result = await runCommand(command).catch((err) => err as CommandError);

    expect(result.stdout).toBe("");
    await expectHelpText(result.stderr, "environment clean");
    expect(result.stderr).toContain("Invalid values");
    expect(result.stderr).toContain('exclude, Given: "invalidEntity", Choices: ');
  });
});
