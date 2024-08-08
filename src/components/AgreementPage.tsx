import React, { useState, useEffect, ReactElement } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Markdown from "react-markdown";

export default function AgreementPage() {

  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();

  const { projectName, agreementName } = useParams();
  const [markdownComponent, setMarkdownComponent] = useState<ReactElement | null>(null); 

  useEffect(() => {

    // Verify that the user is signed in and redirect them if they are unauthenticated.
    const value = `; ${document.cookie}`;
    const parts = value.split(`; githubAccessToken=`);
    const githubAccessToken = parts.length === 2 ? parts.pop()?.split(';').shift() : undefined;
    const agreementPath = `${projectName}/${agreementName}`;
    if (!githubAccessToken) {

      navigate(`/authenticate?redirect=/${agreementPath}`, {replace: true});
      return;

    }

    (async () => {

      // Get the agreement content string and parse it as Markdown.
      const agreementContentStringResponse = await fetch(`https://localhost:3001/agreements?agreement_path=${agreementPath}`, {
        headers: {
          "Content-Type": "application/json",
          "github-user-access-token": githubAccessToken
        }
      });

      const agreementContentStringJSON = await agreementContentStringResponse.json();
      const agreementContentString = agreementContentStringJSON.content;
      setMarkdownComponent(
        <Markdown>{agreementContentString}</Markdown>
      );
      setIsReady(true);

    })();

  }, []);

  return (
    <main>
      {
        isReady ? (
          markdownComponent
        ) : (
          <p>Getting agreement...</p>
        )
      }
    </main>
  );

}