import { describe, expect, it } from "vitest";
import { rotateArrayLeft } from "./util";

describe("rotateArrayLeft", () => {
  it("rotates array by n", () => {
    const arr = [1, 2, 3, 4, 5];
    const rotated = rotateArrayLeft(arr, 2);
    expect(rotated).toEqual([3, 4, 5, 1, 2]);
  });

  it("rotates array by negative n", () => {
    const arr = [1, 2, 3, 4, 5];
    const rotated = rotateArrayLeft(arr, -2);
    expect(rotated).toEqual([4, 5, 1, 2, 3]);
  });

  it("works with empty array", () => {
    const arr: number[] = [];
    const rotated = rotateArrayLeft(arr, 2);
    expect(rotated).toEqual([]);
  });

  it("works with n greater than array length", () => {
    const arr = [1, 2, 3, 4, 5];
    const rotated = rotateArrayLeft(arr, 6);
    expect(rotated).toEqual([2, 3, 4, 5, 1]);
  });
});
