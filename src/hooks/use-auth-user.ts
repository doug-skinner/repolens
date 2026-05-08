import { useState, useEffect } from "react";
import { fetchAuthenticatedUser } from "../lib/gh.js";

export function useAuthUser() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    fetchAuthenticatedUser()
      .then(setUsername)
      .catch(() => {});
  }, []);

  return { username };
}
