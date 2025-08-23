import { HelloWorld } from "@/components";
import "@/styles.css";

export function App() {
  return (
    <div className="h-full bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Mind Control Code
        </h1>
        <p className="text-gray-600 text-sm">Secondary Side Bar React View</p>
      </div>

      <HelloWorld name="VS Code Extension" />

      <div className="mt-6 space-y-4">
        <button className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg">
          Primary Action
        </button>

        <button className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm">
          Secondary Action
        </button>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-2">Status</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">
              React + Tailwind Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
