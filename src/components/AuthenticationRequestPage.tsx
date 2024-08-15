import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthenticationRequestPage() {

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect");

  const value = `; ${document.cookie}`;
  const parts = value.split(`; githubAccessToken=`);
  const githubAccessToken = parts.length === 2 ? parts.pop()?.split(';').shift() : undefined;

  useEffect(() => {

    console.log(githubAccessToken)
    if (githubAccessToken) {

      navigate(redirectPath ?? "/", {replace: true});

    }
    const broadcastChannel = new BroadcastChannel("GitHubAccessTokenChange");
    broadcastChannel.onmessage = () => navigate(redirectPath ?? "/", {replace: true});

  }, []);

  return (
    <main>
      <h1>Who are you?</h1>
      <p>We need you to authenticate yourself with GitHub so we can pull your agreements.</p>
      <a href={`https://github.com/login/oauth/authorize?client_id=Iv23lidCcJbMz9ofTJTz&redirect_uri=https://${location.hostname}:${location.port}/accounts/callback`} target="_blank">Connect with GitHub</a>
    </main>
  );

}