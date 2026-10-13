import { useState } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import RichTextEditor from './RichTextEditor';

function Harness({
  initialHtml = '',
  disabled = false,
}: {
  initialHtml?: string;
  disabled?: boolean;
}) {
  const [html, setHtml] = useState(initialHtml);
  return (
    <>
      <p id="label-isi">Isi artikel</p>
      <RichTextEditor
        id="isi"
        labelledBy="label-isi"
        initialHtml={initialHtml}
        onChange={setHtml}
        disabled={disabled}
      />
      <output data-testid="html">{html}</output>
    </>
  );
}

const editable = () => screen.getByRole('textbox', { name: 'Isi artikel' });

describe('RichTextEditor', () => {
  it('area isi bernama sesuai label dan bisa diedit', async () => {
    render(<Harness initialHtml="<p>Halo</p>" />);

    await waitFor(() => expect(editable()).toHaveAttribute('contenteditable', 'true'));
    expect(editable()).toHaveAttribute('aria-multiline', 'true');
    expect(editable()).toHaveTextContent('Halo');
  });

  it('tidak menyisipkan <style> (CSP ketat melarangnya)', () => {
    render(<Harness />);
    // Satu-satunya <style> yang ada milik IDDS (skeleton), sudah diizinkan CSP lewat hash.
    expect(document.querySelector('style[data-tiptap-style]')).toBeNull();
  });

  it('toolbar: satu tab stop, panah kiri/kanan berpindah tombol, Home/End ke ujung', async () => {
    const user = userEvent.setup();
    render(<Harness initialHtml="<p>Halo</p>" />);

    const toolbar = screen.getByRole('toolbar', { name: 'Format isi artikel' });
    expect(toolbar).toHaveAttribute('aria-controls', 'isi');
    const buttons = Array.from(toolbar.querySelectorAll('button'));
    expect(buttons.filter((button) => button.tabIndex === 0)).toHaveLength(1);

    act(() => buttons[0].focus());
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Judul bagian' })).toHaveFocus();
    // Melingkar dari awal ke akhir; tombol nonaktif ("Ulangi" belum bisa dipakai) tetap terfokus.
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    const redo = screen.getByRole('button', { name: 'Ulangi' });
    expect(redo).toHaveFocus();
    expect(redo).toHaveAttribute('aria-disabled', 'true');
    expect(redo).toHaveAttribute('tabindex', '0');
    await user.keyboard('{Home}');
    expect(screen.getByRole('button', { name: 'Paragraf' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(redo).toHaveFocus();
    expect(buttons.filter((button) => button.tabIndex === 0)).toHaveLength(1);
  });

  it('tombol format memakai aria-pressed sesuai format di posisi kursor', async () => {
    render(<Harness initialHtml="<h2>Judul</h2><p><strong>Tebal</strong></p>" />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Judul bagian' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    );
    expect(screen.getByRole('button', { name: 'Tebal' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Tebal' })).toHaveAttribute(
      'aria-keyshortcuts',
      'Control+B',
    );
    // Tombol aksi (bukan format) tidak memakai aria-pressed.
    expect(screen.getByRole('button', { name: 'Gambar' })).not.toHaveAttribute('aria-pressed');
  });

  it('mengubah blok menjadi judul lewat toolbar dan melaporkan HTML-nya', async () => {
    const user = userEvent.setup();
    render(<Harness initialHtml="<p>Latar belakang</p>" />);

    await user.click(screen.getByRole('button', { name: 'Judul bagian' }));

    await waitFor(() =>
      expect(screen.getByTestId('html')).toHaveTextContent('<h2>Latar belakang</h2>'),
    );
    expect(screen.getByRole('button', { name: 'Judul bagian' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('dalam mode baca saja, isi tidak dapat diedit dan toolbar nonaktif', async () => {
    render(<Harness initialHtml="<p>Terkunci</p>" disabled />);

    await waitFor(() => expect(editable()).toHaveAttribute('contenteditable', 'false'));
    expect(editable()).toHaveAttribute('aria-readonly', 'true');
    expect(screen.getByRole('button', { name: 'Tebal' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('dialog tautan menolak alamat berbahaya dan menerima https', async () => {
    const user = userEvent.setup();
    render(<Harness initialHtml="<p>PANRB</p>" />);

    await user.click(screen.getByRole('button', { name: 'Tautan' }));
    const dialog = await screen.findByRole('dialog', { name: 'Sisipkan tautan' });
    const input = screen.getByLabelText('Alamat tautan');

    await user.type(input, 'javascript:alert(1)');
    await user.click(screen.getByRole('button', { name: 'Simpan tautan' }));
    expect(dialog).toHaveTextContent(
      'Gunakan alamat https://, mailto:, atau path situs ini (diawali /)',
    );

    await user.clear(input);
    await user.type(input, 'www.menpan.go.id');
    await user.click(screen.getByRole('button', { name: 'Simpan tautan' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByTestId('html').textContent).toContain('href="https://www.menpan.go.id"');
  });
});
