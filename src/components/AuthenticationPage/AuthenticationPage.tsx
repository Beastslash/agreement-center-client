import React, { useEffect, useState } from "react";
import Input from "../Input/Input";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthenticationSection() {

  const [shouldSendCode, setShouldSendCode] = useState<boolean>(false);
  const [emailAddress, setEmailAddress] = useState<string>("");
  const [isCodeInputAvailable, setIsCodeInputAvailable] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  useEffect(() => {

    (async () => {

      if (shouldSendCode) {

        setIsCodeInputAvailable(true);

      }

    })();

  }, [shouldSendCode]);

  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect-path") ?? "/agreements";
  const navigate = useNavigate();

  useEffect(() => {

    (async () => {

      if (isVerifying) {

        const accessTokenExpireTime = new Date();
        accessTokenExpireTime.setSeconds(accessTokenExpireTime.getSeconds() + 60000);
        // accessTokenExpireTime.setSeconds(accessTokenExpireTime.getSeconds() + jsonResponse.expires_in);
        const refreshTokenExpireTime = new Date();
        refreshTokenExpireTime.setSeconds(refreshTokenExpireTime.getSeconds() + 600000);
        // refreshTokenExpireTime.setSeconds(accessTokenExpireTime.getSeconds() + jsonResponse.refresh_token_expires_in);
        document.cookie = `accessToken=${"test"}; Expires=${accessTokenExpireTime.toUTCString()}; SameSite=Strict; Secure; Path=/`;
        document.cookie = `refreshToken=${"test"}; Expires=${refreshTokenExpireTime.toUTCString()}; SameSite=Strict; Secure; Path=/`;

        const broadcastChannel = new BroadcastChannel("AccessTokenChange");
        broadcastChannel.postMessage(true);

        navigate(redirectPath, {replace: true});

      }

    })();

  }, [isVerifying]);

  return (
    <main>
      <form onSubmit={(event) => {
        event.preventDefault();
        setIsVerifying(true);
      }}>
        <p>Please enter an authorized email address. After we authenticate you, you can see the agreements that you have signed, along with any outstanding requests for your signature.</p>
        <Input type="email" required value={emailAddress} onChange={({target: {value}}) => setEmailAddress(value)} onKeyDown={(event) => {

          if (event.key === "Enter") setShouldSendCode(true);

        }}>
          Authorized email address
        </Input>
        <section>
          <button type="button" disabled={shouldSendCode} onClick={() => setShouldSendCode(true)}>
            Send code
          </button>
        </section>
        {
          isCodeInputAvailable ? (
            <>
              <p>If <b>{emailAddress}</b> is an authorized email address, a code from Beastslash Agreement Center should be in its inbox, spam, or trash folders. Enter that code below.</p>
              <Input type="text" helperText="The verification code you provided was incorrect." required value={verificationCode} onChange={({target: {value}}) => setVerificationCode(value)}>
                Verification code
              </Input>
              <section>
                <button type="submit">Confirm verification code</button>
              </section>
            </>
          ) : null
        }
      </form>
    </main>
  )

}