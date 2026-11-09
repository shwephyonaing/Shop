import { getSession } from "@/src/lib/session";
import UserNavigationClient from "./user-nav-client";

async function UserNavigation() {
  const session = await getSession();
  return <UserNavigationClient user={session?.user} />;
}

export default UserNavigation;
