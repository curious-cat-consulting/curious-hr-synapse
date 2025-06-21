import BasejumpLogo from "./basejump-logo";
import NextLogo from "./next-logo";
import SupabaseLogo from "./supabase-logo";

export default function Header() {
  return (
    <div className="flex flex-col items-center gap-16">
      <div className="flex flex-col items-center justify-center gap-8 md:flex-row">
        <a
          href="https://usebasejump.com?utm_source=create-next-app&utm_medium=template&utm_term=basejump"
          target="_blank"
          rel="noreferrer"
        >
          <BasejumpLogo />
        </a>
        <span className="h-6 rotate-45 border-l" />
        <a
          href="https://supabase.com?utm_source=create-next-app&utm_medium=template&utm_term=basejump"
          target="_blank"
          rel="noreferrer"
        >
          <SupabaseLogo />
        </a>
        <span className="h-6 rotate-45 border-l" />
        <a href="https://nextjs.org" target="_blank" rel="noreferrer">
          <NextLogo />
        </a>
      </div>
      <h1 className="sr-only">Basejump, Supabase and Next.js Starter Template</h1>
      <p className="mx-auto max-w-xl text-center text-3xl !leading-tight lg:text-4xl">
        The fastest way to ship using{" "}
        <a
          href="https://usebasejump.com?utm_source=create-next-app&utm_medium=template&utm_term=basejump"
          target="_blank"
          className="font-bold hover:underline"
          rel="noreferrer"
        >
          Basejump
        </a>
        {", "}
        <a
          href="https://supabase.com?utm_source=create-next-app&utm_medium=template&utm_term=basejump"
          target="_blank"
          className="font-bold hover:underline"
          rel="noreferrer"
        >
          Supabase
        </a>{" "}
        and{" "}
        <a
          href="https://nextjs.org"
          target="_blank"
          className="font-bold hover:underline"
          rel="noreferrer"
        >
          Next.js
        </a>
      </p>
      <div className="my-8 w-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent p-[1px]" />
    </div>
  );
}
