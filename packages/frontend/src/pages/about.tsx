export async function clientLoader() {
  return {
    title: 'About page',
  };
}

export default function Component({
  loaderData,
}: {
  loaderData: { title: string };
}) {
  return <h1>{loaderData.title}</h1>;
}
