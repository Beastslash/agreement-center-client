import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function CallbackPage() {

  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const [isReady, setIsReady] = useState<boolean>(false);
  const [areCookiesSet, setAreCookiesSet] = useState<boolean>(false);

  useEffect(() => {

    (async () => {

      if (code) {

        const response = await fetch(`https://localhost:3001/authentication?code=${code}`);
        if (!response.ok) {

          console.error(await response.json());
          setIsReady(true);
          return;

        }
        const jsonResponse = await response.json();
        const accessTokenExpireTime = new Date();
        accessTokenExpireTime.setSeconds(accessTokenExpireTime.getSeconds() + jsonResponse.expires_in);
        const refreshTokenExpireTime = new Date();
        refreshTokenExpireTime.setSeconds(accessTokenExpireTime.getSeconds() + jsonResponse.refresh_token_expires_in);
        document.cookie = `githubAccessToken=${jsonResponse.access_token}; Expires=${accessTokenExpireTime.toUTCString()}; SameSite=Strict; Secure; Path=/`;
        document.cookie = `githubRefreshToken=${jsonResponse.refresh_token}; Expires=${refreshTokenExpireTime.toUTCString()}; SameSite=Strict; Secure; Path=/`;
        setAreCookiesSet(true);

        const broadcastChannel = new BroadcastChannel("GitHubAccessTokenChange");
        broadcastChannel.postMessage(true);

        window.close();
        
      }

      setIsReady(true);

    })();

  }, [code]);

  return (
    <main>
      {
        isReady ? (
          areCookiesSet ? (
            <>
              <h1>You've been authenticated</h1>
              <p>You may now close this window.</p>
            </>
          ) : (
            <>
              <h1>We couldn't authenticate you</h1>
              <p>Try connecting your account again.</p>
            </>
          )
        ) : (
          <p>Authenticating...</p>
        )
      }
      
    </main>
  )

}