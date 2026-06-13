import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { TicketsPage } from './TicketsPage';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TicketsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TicketsPage', () => {
  it('mencari permintaan berdasarkan nama warga', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Ibu Sari')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Cari permintaan'), 'Toko Berkah');

    expect(await screen.findByText('Toko Berkah')).toBeInTheDocument();
    expect(screen.queryByText('Ibu Sari')).not.toBeInTheDocument();
  });

  it('memfilter permintaan berdasarkan status', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Ibu Sari');
    await user.selectOptions(
      screen.getByLabelText('Filter status'),
      'NEEDS_INFO',
    );

    expect(await screen.findByText('Pak Rahman')).toBeInTheDocument();
    expect(screen.queryByText('Ibu Sari')).not.toBeInTheDocument();
  });
});
