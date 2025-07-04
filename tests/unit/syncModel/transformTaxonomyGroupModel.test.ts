import type { TaxonomyContracts } from "@kontent-ai/management-sdk";
import { describe, expect, it } from "vitest";

import { transformTaxonomyGroupsModel } from "../../../src/modules/sync/modelTransfomers/taxonomyGroups.ts";

const input = [
  {
    id: "taxonomyGroup1Id",
    last_modified: "groupModified1",
    name: "taxonomyGroup1",
    codename: "taxonomy_group1",
    external_id: "extId_taxonomy_group1",
    terms: [
      {
        id: "nestedTermId1",
        name: "nestedTerm",
        codename: "nested_term",
        last_modified: "nestedTermModofied",
        terms: [],
      },
    ],
  },
  {
    id: "taxonomyGroup2Id",
    last_modified: "groupModified2",
    name: "taxonomyGroup2",
    codename: "taxonomy_group2",
    external_id: "extId_taxonomy_group2",
    terms: [
      {
        id: "nestedTermId2",
        name: "nestedTerm2",
        codename: "nested_term2",
        last_modified: "nestedTermModofied2",
        external_id: "extId_nested_term2",
        terms: [],
      },
    ],
  },
] as const satisfies ReadonlyArray<TaxonomyContracts.ITaxonomyContract>;

const expectedOutput = [
  {
    ...input[0],
    id: undefined,
    last_modified: undefined,
    external_id: undefined,
    terms: [
      {
        ...input[0].terms[0],
        id: undefined,
        last_modified: undefined,
        external_id: undefined,
      },
    ],
  },
  {
    ...input[1],
    id: undefined,
    last_modified: undefined,
    external_id: undefined,
    terms: [
      {
        ...input[1].terms[0],
        id: undefined,
        last_modified: undefined,
        external_id: undefined,
      },
    ],
  },
];

describe("transformTaxonomyGroupsModel", () => {
  it("correctly transform taxonomy groups to model used for sync", () => {
    const result = transformTaxonomyGroupsModel(input);

    expect(result).toEqual(expectedOutput);
  });
});
