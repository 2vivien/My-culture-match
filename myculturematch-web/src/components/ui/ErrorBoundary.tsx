import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Évite l'écran blanc : une erreur de rendu reste isolée et récupérable. */
export class ErrorBoundary extends Component<Props, State> {
  declare props: Props;
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950 px-6 text-center">
          <h1 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Une erreur est survenue</h1>
          <p className="max-w-md text-sm text-zinc-500">
            L’affichage a été interrompu. Rechargez la page pour reprendre votre session.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white cursor-pointer dark:bg-zinc-100 dark:text-zinc-900"
          >
            Recharger
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
