import { useState } from 'react';

export function usePagination(initialSize = 20) {
  const [page, setPage] = useState(0);
  const [size, setSizeState] = useState(initialSize);

  const setSize = (next: number) => {
    setSizeState(next);
    setPage(0);
  };

  const resetPage = () => setPage(0);

  return { page, size, setPage, setSize, resetPage };
}
