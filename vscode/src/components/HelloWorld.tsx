export namespace HelloWorld {
  export interface Props {
    name?: string;
  }
}

export function HelloWorld(props: HelloWorld.Props) {
  const { name = "World" } = props;

  return (
    <div className="p-4 bg-blue-50 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-blue-900 mb-2">Hello {name}!</h1>
      <p className="text-blue-700">
        Welcome to Mind Control Code with React and Tailwind CSS!
      </p>
    </div>
  );
}
