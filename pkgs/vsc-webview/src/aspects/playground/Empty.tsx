export function PlaygroundEmpty() {
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-center text-gray-500">
        <div className="mb-2">📄</div>
        <p className="text-sm">No supported file open</p>

        <p className="text-xs text-gray-400 mt-1">
          Open a .ts, .tsx, .js, .jsx, .mjs, .mjsx, .cjs, or .cjsx file
        </p>
      </div>
    </div>
  );
}
