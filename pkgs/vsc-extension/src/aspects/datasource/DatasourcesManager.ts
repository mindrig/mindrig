import { Datasource, DatasourceManual } from "@wrkspc/core/datasource";
import { DatasetsManager } from "../dataset/DatasetsManager";
import { Manager } from "../manager/Manager";

export class DatasourcesManager extends Manager {
  #datasets: DatasetsManager;

  constructor(parent: Manager, props: { datasets: DatasetsManager }) {
    super(parent);
    this.#datasets = props.datasets;
  }

  async datasourcesToInputMatrix(
    datasources: Datasource[],
  ): Promise<Datasource.Input[][]> {
    const referenceDatasource = datasources.find((ds) => ds.type === "dataset");
    const referenceInput =
      referenceDatasource &&
      (await this.#datasets.datasourceToInput(referenceDatasource));

    let input: Datasource.Input[][];

    if (referenceInput) {
      input = referenceInput.map((input) =>
        datasources.map((ds) => {
          if (ds === referenceDatasource) return input;
          if (ds.type !== "manual")
            throw new DatasourceError("Can't run with mixed datasources");
          return this.#manualDatasourceToInput(ds);
        }),
      );
    } else {
      input = await Promise.all(
        datasources.map(this.#datasourceToInput.bind(this)),
      );
    }

    // If no datasources are provided, or the reference datasource is not loaded
    // or empty (i.e. blank csv file), return a single empty input set to always
    // show at least one result.
    if (!input.length) return [[]];

    return input;
  }

  async #datasourceToInput(
    datasource: Datasource,
  ): Promise<Datasource.Input[]> {
    switch (datasource.type) {
      case "manual":
        return [this.#manualDatasourceToInput(datasource)];

      case "dataset":
        return this.#datasets.datasourceToInput(datasource);
    }
  }

  #manualDatasourceToInput(datasource: DatasourceManual): Datasource.Input {
    return {
      type: "manual",
      datasourceId: datasource.id,
      values: datasource.values,
    };
  }
}

export class DatasourceError extends Error {
  constructor(message: string) {
    super(message);
  }
}
