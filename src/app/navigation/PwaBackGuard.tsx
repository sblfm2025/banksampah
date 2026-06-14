import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ENTRY_STATE_KEY = '__peduliPinrangEntry';
const BOUNDARY_STATE_KEY = '__peduliPinrangBoundary';

function withBoundaryState(state: unknown) {
  return {
    ...(typeof state === 'object' && state !== null ? state : {}),
    [BOUNDARY_STATE_KEY]: true,
  };
}

function withEntryState(state: unknown) {
  return {
    ...(typeof state === 'object' && state !== null ? state : {}),
    [ENTRY_STATE_KEY]: true,
  };
}

export function PwaBackGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    const currentState = window.history.state;

    if (
      !currentState?.[ENTRY_STATE_KEY] &&
      !currentState?.[BOUNDARY_STATE_KEY]
    ) {
      window.history.replaceState(
        withEntryState(currentState),
        '',
        window.location.href,
      );
      window.history.pushState(
        withBoundaryState(currentState),
        '',
        window.location.href,
      );
    }

    function handlePopState(event: PopStateEvent) {
      if (!event.state?.[ENTRY_STATE_KEY]) {
        return;
      }

      window.history.pushState(
        withBoundaryState(event.state),
        '',
        window.location.href,
      );

      if (window.location.pathname !== '/') {
        navigate('/', { replace: true });
      }
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  return null;
}
