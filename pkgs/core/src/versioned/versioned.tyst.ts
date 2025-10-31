import { $ } from "tdollar";
import { ty } from "tyst";
import { Versioned } from "./versioned";

// Versioned.Only
{
  type NonVersionedType = { a: number; b: $.Branded<string, typeof brand> };
  type VersionedType = NonVersionedType & { v: 1 };

  // Basic
  ty<Versioned.Only<NonVersionedType>>().is.not(ty<NonVersionedType>());
  ty<Versioned.Only<VersionedType>>().is(ty<VersionedType>());

  // Nested
  type NestedNonVersionedType = VersionedType & {
    nested: NonVersionedType;
  };
  type NestedVersionedType = VersionedType & {
    nested: VersionedType;
  };
  ty<Versioned.Only<NestedNonVersionedType>>().is.not(
    ty<NestedNonVersionedType>(),
  );
  ty<Versioned.Only<NestedVersionedType>>().is(ty<NestedVersionedType>());

  // Optional
  type OptionalNonVersionedType = VersionedType & {
    optional?: NonVersionedType;
  };
  type OptionalVersionedType = VersionedType & {
    optional?: VersionedType;
  };
  ty<Versioned.Only<OptionalNonVersionedType>>().is.not(
    ty<OptionalNonVersionedType>(),
  );
  ty<Versioned.Only<OptionalVersionedType>>().is(ty<OptionalVersionedType>());

  // Records
  type RecordNonVersionedType = VersionedType & {
    record: Record<string, NonVersionedType>;
  };
  type RecordVersionedType = VersionedType & {
    record: Record<string, VersionedType>;
  };
  ty<Versioned.Only<RecordNonVersionedType>>().is.not(
    ty<RecordNonVersionedType>(),
  );
  ty<Versioned.Only<RecordVersionedType>>().is(ty<RecordVersionedType>());

  // Readonly Arrays
  type ReadonlyArrayNonVersionedType = VersionedType & {
    array: readonly NonVersionedType[];
  };
  type ReadonlyArrayVersionedType = VersionedType & {
    array: readonly VersionedType[];
  };
  ty<Versioned.Only<ReadonlyArrayNonVersionedType>>().is.not(
    ty<ReadonlyArrayNonVersionedType>(),
  );
  ty<Versioned.Only<ReadonlyArrayVersionedType>>().is(
    ty<ReadonlyArrayVersionedType>(),
  );
}

const brand = Symbol();
