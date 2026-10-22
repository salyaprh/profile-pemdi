import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { services } from '../data/siteContent';
import { renderPublic as render, setUrl } from '../test/utils';
import Services from './Services';

describe('Services', () => {
  it('menampilkan satu kartu per layanan dengan tautan ke platformnya di tab baru', () => {
    render(<Services />);
    expect(screen.getByRole('heading', { level: 1, name: 'Layanan' })).toBeInTheDocument();

    for (const service of services) {
      const card = screen.getByRole('region', { name: service.title });
      expect(card).toHaveAttribute('id', service.id);
      const link = within(card).getByRole('link', {
        name: `Buka ${service.name} (membuka tab baru)`,
      });
      expect(link).toHaveAttribute('href', service.url);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('layanan tanpa alamat (Survei Kepuasan) belum ditampilkan', () => {
    render(<Services />);
    expect(screen.getAllByRole('region')).toHaveLength(services.length);
    expect(screen.queryByRole('heading', { name: 'Survei Kepuasan' })).toBeNull();
  });

  it('dibuka dengan #jangkar: kartunya digulir ke tampilan dan difokus', async () => {
    setUrl('/layanan#ega');
    render(<Services />);

    const card = screen.getByRole('region', { name: 'Evaluasi Anggaran (EGA) Pemdi' });
    await waitFor(() => expect(card).toHaveFocus());
    expect(card.scrollIntoView).toHaveBeenCalled();
  });

  it('mengatur judul halaman', () => {
    render(<Services />);
    expect(document.title).toBe('Layanan | PEMDI PANRB');
  });
});
