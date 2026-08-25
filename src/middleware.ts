import { NextRequest, NextResponse } from "next/server";

// 全站共用密碼保護（HTTP Basic Auth）。瀏覽器原生登入框，輸入一次後
// 瀏覽器會記住，不需要每次都重新輸入。
//
// 沒有設定 SITE_PASSWORD 這個環境變數時（例如本機開發環境），完全不擋，
// 避免忘記設定反而把自己鎖在外面。正式環境（Vercel）記得要設定這個變數。
export function middleware(request: NextRequest) {
  const expectedPassword = process.env.SITE_PASSWORD;
  if (!expectedPassword) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice("Basic ".length));
    const password = decoded.slice(decoded.indexOf(":") + 1);
    if (password === expectedPassword) {
      return NextResponse.next();
    }
  }

  // WWW-Authenticate 的值只能是 ASCII（HTTP header 規範），中文字放在這裡
  // 會讓 Edge Runtime 直接丟出 ByteString 轉換錯誤，realm 只能用英文。
  return new NextResponse("需要密碼才能繼續（帳號欄位可隨意填寫）", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Training Timeline"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
