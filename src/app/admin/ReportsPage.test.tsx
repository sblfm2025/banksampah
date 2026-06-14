import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReportsPage } from './ReportsPage';

describe('ReportsPage', () => {
  it('menampilkan total pickup dan tren harian', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <ReportsPage />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Permintaan Masuk')).toBeInTheDocument();
    expect(screen.getByText('Tren Harian')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Export CSV' }),
    ).toBeEnabled();
  });
});
