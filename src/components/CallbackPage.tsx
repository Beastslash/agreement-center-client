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

        const response = await fetch(`https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/web/fn-d7becceb-1566-414d-af00-363ce509f7bb/authentication/getUserAccessToken?code=${code}`);
        if (!response.ok) {

          console.error(await response.json());
          setIsReady(true);
          return;

        }
        const jsonResponse = await response.json();
        document.cookie = `githubAccessToken=${jsonResponse.access_token}`;
        document.cookie = `githubRefreshToken=${jsonResponse.refresh_token}`;
        setAreCookiesSet(true);
        
      }

      setIsReady(true);

    })();

  }, [code]);

  return isReady ? (
    <main>
      <h1>You've been authenticated</h1>
      <p>You may now close this window.</p>
    </main>
  ) : null;

}