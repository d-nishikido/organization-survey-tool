declare module 'react-query' {
  export class QueryClient {
    constructor(config?: any);
  }
  export function QueryClientProvider(props: { client: any; children: React.ReactNode }): JSX.Element;
}