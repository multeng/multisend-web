import { queryOptions } from '@tanstack/react-query';
import { getReadiness } from './readiness';

export const readinessQueryOptions = queryOptions({
  queryKey: ['api', 'readiness'],
  queryFn: ({ signal }) => getReadiness(signal),
  staleTime: 0,
  gcTime: 0,
  networkMode: 'always',
});
