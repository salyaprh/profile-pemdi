import { Fragment, useRef, useState, type KeyboardEvent } from 'react';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBlockquote,
  IconBold,
  IconH2,
  IconH3,
  IconItalic,
  IconLink,
  IconList,
  IconListNumbers,
  IconPhoto,
  IconPilcrow,
  IconSeparatorHorizontal,
  IconStrikethrough,
  IconUnderline,
  type Icon,
} from '@tabler/icons-react';

interface ToolbarButton {
  id: string;
  label: string;
  icon: Icon;
  /** Pintasan keyboard (format aria-keyshortcuts). */
  shortcut?: string;
  /** Tombol format yang bisa aktif/nonaktif (aria-pressed). */
  isActive?: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
  canRun?: (editor: Editor) => boolean;
}

interface EditorToolbarProps {
  editor: Editor;
  editorId: string;
  disabled: boolean;
  onLink: () => void;
  onImage: () => void;
}

/**
 * Toolbar editor mengikuti pola WAI-ARIA Toolbar: satu tab stop, panah kiri/kanan (serta Home/End)
 * berpindah antar tombol, dan tombol format memakai aria-pressed.
 */
export default function EditorToolbar({
  editor,
  editorId,
  disabled,
  onLink,
  onImage,
}: EditorToolbarProps) {
  const groups: ToolbarButton[][] = [
    [
      {
        id: 'paragraph',
        label: 'Paragraf',
        icon: IconPilcrow,
        isActive: (e) => e.isActive('paragraph'),
        run: (e) => e.chain().focus().setParagraph().run(),
      },
      {
        id: 'h2',
        label: 'Judul bagian',
        icon: IconH2,
        isActive: (e) => e.isActive('heading', { level: 2 }),
        run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        id: 'h3',
        label: 'Subjudul',
        icon: IconH3,
        isActive: (e) => e.isActive('heading', { level: 3 }),
        run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
      },
    ],
    [
      {
        id: 'bold',
        label: 'Tebal',
        icon: IconBold,
        shortcut: 'Control+B',
        isActive: (e) => e.isActive('bold'),
        run: (e) => e.chain().focus().toggleBold().run(),
      },
      {
        id: 'italic',
        label: 'Miring',
        icon: IconItalic,
        shortcut: 'Control+I',
        isActive: (e) => e.isActive('italic'),
        run: (e) => e.chain().focus().toggleItalic().run(),
      },
      {
        id: 'underline',
        label: 'Garis bawah',
        icon: IconUnderline,
        shortcut: 'Control+U',
        isActive: (e) => e.isActive('underline'),
        run: (e) => e.chain().focus().toggleUnderline().run(),
      },
      {
        id: 'strike',
        label: 'Coret',
        icon: IconStrikethrough,
        isActive: (e) => e.isActive('strike'),
        run: (e) => e.chain().focus().toggleStrike().run(),
      },
    ],
    [
      {
        id: 'bulletList',
        label: 'Daftar berpoin',
        icon: IconList,
        isActive: (e) => e.isActive('bulletList'),
        run: (e) => e.chain().focus().toggleBulletList().run(),
      },
      {
        id: 'orderedList',
        label: 'Daftar bernomor',
        icon: IconListNumbers,
        isActive: (e) => e.isActive('orderedList'),
        run: (e) => e.chain().focus().toggleOrderedList().run(),
      },
      {
        id: 'blockquote',
        label: 'Kutipan',
        icon: IconBlockquote,
        isActive: (e) => e.isActive('blockquote'),
        run: (e) => e.chain().focus().toggleBlockquote().run(),
      },
      {
        id: 'horizontalRule',
        label: 'Garis pemisah',
        icon: IconSeparatorHorizontal,
        run: (e) => e.chain().focus().setHorizontalRule().run(),
      },
    ],
    [
      {
        id: 'link',
        label: 'Tautan',
        icon: IconLink,
        isActive: (e) => e.isActive('link'),
        run: () => onLink(),
      },
      { id: 'image', label: 'Gambar', icon: IconPhoto, run: () => onImage() },
    ],
    [
      {
        id: 'undo',
        label: 'Urungkan',
        icon: IconArrowBackUp,
        shortcut: 'Control+Z',
        run: (e) => e.chain().focus().undo().run(),
        canRun: (e) => e.can().undo(),
      },
      {
        id: 'redo',
        label: 'Ulangi',
        icon: IconArrowForwardUp,
        shortcut: 'Control+Shift+Z',
        run: (e) => e.chain().focus().redo().run(),
        canRun: (e) => e.can().redo(),
      },
    ],
  ];
  const buttons = groups.flat();

  // Status aktif/tersedia dibaca ulang setiap transaksi editor (TipTap 3 tidak me-render ulang sendiri).
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      Object.fromEntries(
        buttons.map((button) => [
          button.id,
          {
            active: button.isActive?.(current) ?? false,
            enabled: button.canRun?.(current) ?? true,
          },
        ]),
      ),
  });

  const [focusIndex, setFocusIndex] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const moveFocus = (index: number) => {
    const count = buttons.length;
    const next = (index + count) % count;
    setFocusIndex(next);
    refs.current[next]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, () => void> = {
      ArrowRight: () => moveFocus(focusIndex + 1),
      ArrowLeft: () => moveFocus(focusIndex - 1),
      Home: () => moveFocus(0),
      End: () => moveFocus(buttons.length - 1),
    };
    const action = keys[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  };

  let index = -1;

  return (
    <div
      role="toolbar"
      aria-label="Format isi artikel"
      aria-controls={editorId}
      aria-disabled={disabled || undefined}
      onKeyDown={handleKeyDown}
      className="flex flex-wrap items-center gap-1 border-b border-stroke-primary bg-background-secondary p-1.5"
    >
      {groups.map((group, groupIndex) => (
        <Fragment key={group[0].id}>
          {groupIndex > 0 && (
            <span aria-hidden="true" className="mx-1 h-6 w-px bg-stroke-primary" />
          )}
          {group.map((button) => {
            index += 1;
            const buttonIndex = index;
            const { active, enabled } = state[button.id] ?? { active: false, enabled: true };
            const unavailable = disabled || !enabled;
            const ButtonIcon = button.icon;
            return (
              <button
                key={button.id}
                ref={(element) => {
                  refs.current[buttonIndex] = element;
                }}
                type="button"
                tabIndex={buttonIndex === focusIndex ? 0 : -1}
                onFocus={() => setFocusIndex(buttonIndex)}
                onClick={() => {
                  if (!unavailable) button.run(editor);
                }}
                // aria-disabled (bukan disabled): tombol nonaktif tetap bisa difokus dengan panah,
                // sesuai pola WAI-ARIA Toolbar, sehingga pengguna keyboard tahu tombol itu ada.
                aria-disabled={unavailable || undefined}
                aria-label={button.label}
                aria-pressed={button.isActive ? active : undefined}
                aria-keyshortcuts={button.shortcut}
                title={
                  button.shortcut
                    ? `${button.label} (${button.shortcut.replace('Control', 'Ctrl')})`
                    : button.label
                }
                className={`inline-flex size-9 items-center justify-center rounded-md transition-colors aria-disabled:cursor-not-allowed aria-disabled:opacity-40 ${
                  active
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-content-primary hover:aria-[disabled]:bg-transparent hover:bg-background-tertiary'
                }`}
              >
                <ButtonIcon size={18} aria-hidden="true" />
              </button>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}
