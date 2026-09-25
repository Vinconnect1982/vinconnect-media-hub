import { requireChatGPTUser, chatGPTSignOutPath } from "./chatgpt-auth";
import { MediaHub } from "./media-hub";
import { isOwnerEmail } from "../lib/article-workflow";
export const dynamic = "force-dynamic";
export default async function Home() {
  const user = await requireChatGPTUser("/");
  if(!isOwnerEmail(user.email)) return <main className="public-article"><h1>Private VINCONNECT workspace</h1><p>Your account is not authorised to access these drafts.</p><a href={chatGPTSignOutPath("/")}>Sign out</a></main>;
  return <MediaHub user={{ name: user.displayName, email: user.email }} signOutPath={chatGPTSignOutPath("/")} />;
}
