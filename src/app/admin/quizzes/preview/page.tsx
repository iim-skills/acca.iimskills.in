import PreviewClient from "./PreviewClient";

export default async function Page({ searchParams }: any) {
  const params = await searchParams; // ✅ NEXT 15 FIX

  return <PreviewClient id={params?.id} />;
}