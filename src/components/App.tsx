import { useEffect, useState } from 'react';

import { ReauthNeeded, authStore } from '@/api/auth';
import { InvalidOrigin } from '@/api/client';
import { LLClient } from '@/api/ll';
import { Resort, loadResort } from '@/api/resort';
import ClientsContext, { createClients } from '@/contexts/ClientsContext';
import ResortContext from '@/contexts/ResortContext';
import { DateTime } from '@/datetime';
import useDisclaimer from '@/hooks/useDisclaimer';
import useNews from '@/hooks/useNews';
import { navigate } from '@/navigate';
import onVisible from '@/onVisible';

import LoginForm from './LoginForm';
import Merlock from './ll/Merlock';

export const NEWS_VERSION = 0;

/** Where anyone who ran the bookmarklet on a page it cannot use is sent. */
const START_PAGE = 'https://mbs1234.github.io/AutoLL-2/start.html';

function disableDoubleTapZoom() {
  document.body.addEventListener('click', () => null);
}

export default function App() {
  const [resort, setResort] = useState<Resort>();
  const [content, setContent] = useState(<div />);
  const disclaimer = useDisclaimer();
  const news = useNews(NEWS_VERSION);
  const [loginRequired, requireLogin] = useState(() => {
    try {
      authStore.getData();
    } catch (e) {
      if (!(e instanceof ReauthNeeded)) throw e;
      return true;
    }
    return false;
  });

  useEffect(() => {
    disableDoubleTapZoom();
    authStore.onUnauthorized = () => requireLogin(true);
    (async () => {
      // One resort and one product: Walt Disney World Lightning Lane. Any
      // other Disney page the bookmarklet was run from -- Disneyland, a
      // virtual-queue host -- goes back to the start page, which offers the
      // one destination there is.
      let resort: Resort;
      try {
        resort = await loadResort(LLClient.originToResortId(origin));
      } catch (error) {
        if (!(error instanceof InvalidOrigin)) throw error;
        navigate(START_PAGE);
        return;
      }
      setResort(resort);
      DateTime.setTimeZone('America/New_York');
      setContent(
        <ResortContext value={resort}>
          <ClientsContext value={createClients(resort)}>
            <Merlock />
          </ClientsContext>
        </ResortContext>
      );
    })();
  }, []);

  useEffect(() => {
    function checkAuth() {
      if (loginRequired) return;
      try {
        authStore.getData();
        requireLogin(false);
      } catch {
        requireLogin(true);
      }
    }
    checkAuth();
    return onVisible(checkAuth);
  }, [loginRequired]);

  return (
    disclaimer ||
    news ||
    (loginRequired && resort && (
      <LoginForm
        resort={resort}
        onLogin={data => {
          authStore.setData(data);
          requireLogin(false);
        }}
      />
    )) ||
    content
  );
}
