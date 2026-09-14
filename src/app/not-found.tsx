import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 text-center">
      <h1 className="font-serif text-3xl">没有找到这条记录</h1>
      <p className="mt-3 text-sm text-ink-soft">它可能已被删除，或地址不正确。</p>
      <Link href="/" className="mt-6 rounded-full bg-seal px-5 py-2.5 text-sm text-white">
        返回书目
      </Link>
    </div>
  );
}
