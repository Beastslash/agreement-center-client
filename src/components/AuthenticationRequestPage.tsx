import React from "react";

export default function AuthenticationRequestPage() {

  return (
    <main>
      <h1>Who are you?</h1>
      <p>We need you to authenticate yourself with GitHub so we can pull your agreements.</p>
      <a href="https://github.com/login/oauth/authorize?client_id=Iv23lidCcJbMz9ofTJTz&redirect_uri=https://localhost:3000/callback" target="_blank">Connect with GitHub</a>
    </main>
  );

}