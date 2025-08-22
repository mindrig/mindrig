import React from "react";
import { HelloWorld } from "@/components";
import "@/styles.css";

export namespace App {
  export interface Props {}
}

export function App(props: App.Props) {
  const {} = props;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <HelloWorld name="VS Code Extension" />

      <div className="mt-4">
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          Click me!
        </button>
      </div>
    </div>
  );
}
