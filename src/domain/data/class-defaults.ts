import { createClassId, type ClassItem } from "../types";

/**
 * Standard class time-slots used as defaults.
 */
export const classDefaults: readonly ClassItem[] = [
  { id: createClassId("class-7-8"), name: "7-8" },
  { id: createClassId("class-8-9"), name: "8-9" },
  { id: createClassId("class-9-10"), name: "9-10" },
  { id: createClassId("class-10-11"), name: "10-11" },
];
