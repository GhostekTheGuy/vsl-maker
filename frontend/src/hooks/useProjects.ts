import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Project } from '../types';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('/projects'),
  });
}
