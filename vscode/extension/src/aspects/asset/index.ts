export type AssetResolver = AssetResolverManifest | AssetResolverBase;

export interface AssetResolverManifest {
  type: "manifest";
  manifest: AssetsManifest;
}

export type AssetsManifest = Record<string, string>;

export interface AssetResolverBase {
  type: "base";
  base: string;
}
