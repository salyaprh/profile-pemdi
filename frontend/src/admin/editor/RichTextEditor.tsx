import { useEffect, useMemo, useState } from 'react';
import Image from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extensions';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import EditorToolbar from './EditorToolbar';
import ImageDialog from './ImageDialog';
import LinkDialog from './LinkDialog';
import { isSafeHref } from './links';

interface RichTextEditorProps {
  /** id elemen yang dapat diedit (dipakai aria-controls toolbar). */
  id: string;
  /** id label yang menamai area isi (aria-labelledby). */
  labelledBy: string;
  describedBy?: string;
  /** HTML awal. Perubahan prop ini setelah mount tidak menimpa isi (editor tidak terkontrol). */
  initialHtml: string;
  /** Dipanggil setiap isi berubah; string kosong bila editor kosong. */
  onChange: (html: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}

/**
 * Editor WYSIWYG (TipTap) untuk isi artikel. Elemen yang tersedia sengaja sama dengan yang
 * diizinkan penyaring backend (App\Support\ArticleHtmlSanitizer): paragraf, judul H2/H3, tebal,
 * miring, garis bawah, coret, daftar, kutipan, garis pemisah, tautan, dan gambar unggahan.
 */
export default function RichTextEditor({
  id,
  labelledBy,
  describedBy,
  initialHtml,
  onChange,
  disabled = false,
  invalid = false,
}: RichTextEditorProps) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  // Elemen contenteditable diberi peran textbox bernama label kolom, agar terbaca pembaca layar.
  const attributes = useMemo(
    () => ({
      id,
      role: 'textbox',
      'aria-multiline': 'true',
      'aria-labelledby': labelledBy,
      ...(describedBy ? { 'aria-describedby': describedBy } : {}),
      ...(invalid ? { 'aria-invalid': 'true' } : {}),
      ...(disabled ? { 'aria-readonly': 'true' } : {}),
      class: 'article-body min-h-[320px] px-4 py-3 focus:outline-none',
    }),
    [id, labelledBy, describedBy, invalid, disabled],
  );

  const editor = useEditor({
    // CSP melarang <style> sisipan; CSS yang dibutuhkan ProseMirror ada di src/index.css.
    injectCSS: false,
    editable: !disabled,
    content: initialHtml,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
          HTMLAttributes: { rel: 'noopener noreferrer', target: null },
          isAllowedUri: (url) => isSafeHref(url),
        },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: 'Tulis isi artikel di sini…' }),
    ],
    editorProps: { attributes },
    onUpdate: ({ editor: current }) => onChange(current.isEmpty ? '' : current.getHTML()),
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  // Atribut ARIA yang berubah (mis. setelah validasi) diteruskan ke elemen contenteditable.
  useEffect(() => {
    editor?.setOptions({ editorProps: { attributes } });
  }, [editor, attributes]);

  if (!editor) return null;

  const closeLink = () => {
    setLinkOpen(false);
    editor.commands.focus();
  };

  return (
    <div
      className={`overflow-hidden rounded-lg border bg-background-primary ${
        invalid ? 'border-negative-600' : 'border-stroke-primary'
      } focus-within:ring-2 focus-within:ring-guide-500`}
    >
      <EditorToolbar
        editor={editor}
        editorId={id}
        disabled={disabled}
        onLink={() => setLinkOpen(true)}
        onImage={() => setImageOpen(true)}
      />
      <EditorContent editor={editor} />

      <LinkDialog
        open={linkOpen}
        editing={editor.isActive('link')}
        initialHref={(editor.getAttributes('link').href as string | undefined) ?? ''}
        onClose={closeLink}
        onRemove={() => {
          editor.chain().focus().extendMarkRange('link').unsetLink().run();
          setLinkOpen(false);
        }}
        onSubmit={(href) => {
          const chain = editor.chain().focus().extendMarkRange('link');
          if (editor.state.selection.empty && !editor.isActive('link')) {
            // Tanpa teks terpilih: alamatnya sendiri yang disisipkan sebagai teks tautan.
            chain
              .insertContent({
                type: 'text',
                text: href,
                marks: [{ type: 'link', attrs: { href } }],
              })
              .run();
          } else {
            chain.setLink({ href }).run();
          }
          setLinkOpen(false);
        }}
      />
      <ImageDialog
        open={imageOpen}
        onClose={() => {
          setImageOpen(false);
          editor.commands.focus();
        }}
        onInsert={({ src, alt }) => {
          editor.chain().focus().setImage({ src, alt }).run();
          setImageOpen(false);
        }}
      />
    </div>
  );
}
