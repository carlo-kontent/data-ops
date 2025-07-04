import { config as dotenvConfig } from "dotenv";
import { describe, expect, it } from "vitest";

import { restoreEnvironment } from "../../../src/public.ts";
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

const { EXPORT_IMPORT_TEST_DATA_ENVIRONMENT_ID, API_KEY, EMPTY_TEST_ENVIRONMENT_ID } = process.env;

if (!EXPORT_IMPORT_TEST_DATA_ENVIRONMENT_ID) {
  throw new Error("EXPORT_IMPORT_TEST_DATA_ENVIRONMENT_ID environment variable is not defined.");
}
if (!EMPTY_TEST_ENVIRONMENT_ID) {
  throw new Error("EMPTY_TEST_ENVIRONMENT_ID env variable was not provided.");
}
if (!API_KEY) {
  throw new Error("API_KEY environment variable is not defined.");
}

describe("restore command", () => {
  it.concurrent(
    "Restores all entities properly into the target project",
    withTestEnvironment(EMPTY_TEST_ENVIRONMENT_ID, async (environmentId) => {
      const command = `environment restore -e=${environmentId} -f=tests/integration/backupRestore/data/backup.zip -k=${API_KEY} --verbose`;

      await runCommand(command);

      await expectSameEnvironments(environmentId, EXPORT_IMPORT_TEST_DATA_ENVIRONMENT_ID, {
        exclude: ["roles"],
      });
    }),
  );

  it.concurrent(
    "Restores only entities specified in the include parameter",
    withTestEnvironment(EMPTY_TEST_ENVIRONMENT_ID, async (environmentId) => {
      const command = `environment restore -e=${environmentId} -f=tests/integration/backupRestore/data/backup.zip -k=${API_KEY} --include collections languages taxonomies`;

      await runCommand(command);

      await expectSameEnvironments(environmentId, EXPORT_IMPORT_TEST_DATA_ENVIRONMENT_ID, {
        include: ["collections", "languages", "taxonomies"],
      });

      await expectNoAssetFolders(environmentId);
      await expectNoAssets(environmentId);
      await expectNoSpaces(environmentId);
      await expectNoSnippets(environmentId);
      await expectNoTypes(environmentId);
      await expectNoItems(environmentId);
      await expectNoWorkflows(environmentId);
      await expectNoPreviewUrls(environmentId);
      await expectNoWebhooks(environmentId);
    }),
  );

  it.concurrent(
    "Restores all entities except those specified in the exclude parameter using API",
    withTestEnvironment(EMPTY_TEST_ENVIRONMENT_ID, async (environmentId) => {
      await restoreEnvironment({
        environmentId: environmentId,
        fileName: "tests/integration/backupRestore/data/backup.zip",
        apiKey: API_KEY,
        exclude: [
          "assets",
          "spaces",
          "webSpotlight",
          "contentTypes",
          "contentTypeSnippets",
          "taxonomies",
          "contentItems",
          "languageVariants",
          "workflows",
          "previewUrls",
          "webhooks",
        ],
      });

      await expectSameEnvironments(environmentId, EXPORT_IMPORT_TEST_DATA_ENVIRONMENT_ID, {
        exclude: [
          "assets",
          "spaces",
          "roles",
          "types",
          "snippets",
          "taxonomies",
          "items",
          "variants",
          "workflows",
          "previewUrls",
          "webhooks",
          "webSpotlight",
        ],
      });

      await expectNoAssets(environmentId);
      await expectNoTypes(environmentId);
      await expectNoSnippets(environmentId);
      await expectNoSpaces(environmentId);
      await expectNoTaxonomies(environmentId);
      await expectNoItems(environmentId);
      await expectNoWorkflows(environmentId);
      await expectNoPreviewUrls(environmentId);
      await expectNoWebhooks(environmentId);
    }),
  );

  it.concurrent(
    "Restores only active languages when excludeInactiveLanguages is set to true",
    withTestEnvironment(EMPTY_TEST_ENVIRONMENT_ID, async (environmentId) => {
      await restoreEnvironment({
        environmentId: environmentId,
        fileName: "tests/integration/backupRestore/data/backup.zip",
        apiKey: API_KEY,
        include: ["languages"],
        options: { excludeInactiveLanguages: true },
      });

      await expectSameEnvironments(
        environmentId,
        EXPORT_IMPORT_TEST_DATA_ENVIRONMENT_ID,
        { include: ["languages"] },
        { excludeInactiveLanguages: true },
      );

      await expectNoAssets(environmentId);
      await expectNoTypes(environmentId);
      await expectNoSnippets(environmentId);
      await expectNoSpaces(environmentId);
      await expectNoTaxonomies(environmentId);
      await expectNoItems(environmentId);
      await expectNoWorkflows(environmentId);
      await expectNoPreviewUrls(environmentId);
      await expectNoWebhooks(environmentId);
    }),
  );

  it.concurrent("Errors with help when both include and exclude are provided", async () => {
    const command =
      "environment restore --include collections contentTypes --exclude contentTypes -f test -k test -e test";

    const result = await runCommand(command).catch((err) => err as CommandError);

    expect(result.stdout).toBe("");
    await expectHelpText(result.stderr, "environment restore");
    expect(result.stderr).toContain("Arguments include and exclude are mutually exclusive");
  });

  it.concurrent("Errors with help when include contains invalid entity names", async () => {
    const command =
      "environment restore --include collections invalidEntity -f test -k test -e test";

    const result = await runCommand(command).catch((err) => err as CommandError);

    expect(result.stdout).toBe("");
    await expectHelpText(result.stderr, "environment restore");
    expect(result.stderr).toContain("Invalid values");
    expect(result.stderr).toContain('include, Given: "invalidEntity", Choices: ');
  });

  it.concurrent("Errors with help when exclude contains invalid entity names", async () => {
    const command =
      "environment restore --exclude collections invalidEntity -f test -k test -e test";

    const result = await runCommand(command).catch((err) => err as CommandError);

    expect(result.stdout).toBe("");
    await expectHelpText(result.stderr, "environment restore");
    expect(result.stderr).toContain("Invalid values");
    expect(result.stderr).toContain('exclude, Given: "invalidEntity", Choices: ');
  });
});
