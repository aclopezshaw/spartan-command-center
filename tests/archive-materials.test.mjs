import assert from "node:assert/strict";
import test from "node:test";
import {
  ARCHIVE_RECOMMENDATION_STATUSES,
  formatLastReadDate,
  selectArchiveMaterials,
} from "../src/lib/archive-materials.ts";

function material(overrides) {
  return {
    id: overrides.id,
    title: overrides.title,
    author: "Archive Author",
    status: "Medium Priority",
    priorityBand: null,
    fitScore: 80,
    currentPage: 0,
    totalPages: 400,
    lastReadAt: null,
    ...overrides,
  };
}

test("Archive recommendation contract includes priority and wishlist statuses", () => {
  assert.deepEqual(
    [...ARCHIVE_RECOMMENDATION_STATUSES],
    ["Low Priority", "Medium Priority", "High Priority", "Wishlist"]
  );
});

test("Active and Complete materials never appear in recommendations", () => {
  const result = selectArchiveMaterials([
    material({
      id: "active",
      title: "Active Material",
      status: "Active",
      currentPage: 100,
    }),
    material({
      id: "complete",
      title: "Complete Material",
      status: "Complete",
      fitScore: 100,
    }),
    material({
      id: "eligible",
      title: "Eligible Material",
      status: "Wishlist",
      fitScore: 90,
    }),
  ]);

  assert.deepEqual(result.books.map((book) => book.id), ["active"]);
  assert.deepEqual(
    result.recommendations.map((book) => book.id),
    ["eligible"]
  );
});

test("recommendations rank every eligible record before selecting the top five", () => {
  const result = selectArchiveMaterials([
    material({ id: "six", title: "Six", fitScore: 60 }),
    material({ id: "one", title: "One", fitScore: 100 }),
    material({ id: "four", title: "Four", fitScore: 70 }),
    material({ id: "two", title: "Two", fitScore: 90 }),
    material({ id: "seven", title: "Seven", fitScore: 50 }),
    material({ id: "three", title: "Three", fitScore: 80 }),
    material({ id: "five", title: "Five", fitScore: 65 }),
  ]);

  assert.deepEqual(
    result.recommendations.map((book) => book.id),
    ["one", "two", "three", "four", "five"]
  );
});

test("every eligible Priority Band material remains visible outside the Fit Score top five", () => {
  const result = selectArchiveMaterials([
    material({ id: "one", title: "One", fitScore: 100 }),
    material({ id: "two", title: "Two", fitScore: 99 }),
    material({ id: "three", title: "Three", fitScore: 98 }),
    material({ id: "four", title: "Four", fitScore: 97 }),
    material({ id: "five", title: "Five", fitScore: 96 }),
    material({
      id: "banded",
      title: "Banded",
      fitScore: 10,
      priorityBand: "Alpha",
    }),
  ]);

  assert.deepEqual(
    result.recommendations.map((book) => book.id),
    ["one", "two", "three", "four", "five", "banded"]
  );
});

test("activating a Priority Band material moves it out of recommendations", () => {
  const result = selectArchiveMaterials([
    material({
      id: "active-banded",
      title: "Active Banded",
      status: "Active",
      priorityBand: "Alpha",
      fitScore: 100,
      currentPage: 20,
    }),
    material({
      id: "eligible",
      title: "Eligible",
      status: "Low Priority",
      fitScore: 80,
    }),
  ]);

  assert.deepEqual(result.books.map((book) => book.id), [
    "active-banded",
  ]);
  assert.deepEqual(
    result.recommendations.map((book) => book.id),
    ["eligible"]
  );
});

test("Priority Band and Fit Score selection is deduplicated", () => {
  const result = selectArchiveMaterials([
    material({
      id: "both",
      title: "Both",
      priorityBand: "Bravo",
      fitScore: 100,
    }),
  ]);

  assert.equal(result.recommendations.length, 1);
  assert.equal(result.recommendations[0].id, "both");
});

test("recommendation score ties use title and preserve Archive metadata", () => {
  const result = selectArchiveMaterials([
    material({
      id: "zulu",
      title: "Zulu",
      status: "High Priority",
      priorityBand: "Alpha",
      fitScore: 95,
    }),
    material({
      id: "alpha",
      title: "Alpha",
      status: "Wishlist",
      priorityBand: null,
      fitScore: 95,
    }),
  ]);

  assert.deepEqual(result.recommendations, [
    {
      id: "alpha",
      title: "Alpha",
      status: "Wishlist",
      priorityBand: null,
      fitScore: 95,
    },
    {
      id: "zulu",
      title: "Zulu",
      status: "High Priority",
      priorityBand: "Alpha",
      fitScore: 95,
    },
  ]);
});

test("Active Materials preserve and format the latest Reading Report date", () => {
  const result = selectArchiveMaterials([
    material({
      id: "active",
      title: "Active Material",
      status: "Active",
      currentPage: 100,
      lastReadAt: "2026-07-27T18:30:00.000Z",
    }),
  ]);

  assert.equal(
    result.books[0].lastReadAt,
    "2026-07-27T18:30:00.000Z"
  );
  assert.equal(
    formatLastReadDate(result.books[0].lastReadAt),
    "Jul 27, 2026"
  );
  assert.equal(
    formatLastReadDate("2026-07-01"),
    "Jul 1, 2026"
  );
  assert.equal(formatLastReadDate(null), "No reports yet");
});
