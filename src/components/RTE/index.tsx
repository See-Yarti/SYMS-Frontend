import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Toolbar from './Toolbar';
import { cn } from '@/lib/utils';
import HardBreak from '@tiptap/extension-hard-break';

const editorClassNames =
  'min-h-[150px] w-full rounded  border border-input bg-transparent px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 overflow-auto prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc';

const HTMLAttributesClassNames = 'list-disc pl-4';

export type RichTextEditorProps = {
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  editorClassNames?: string;
  HTMLAttributesClassNames?: string;
  toolBarPosition?: 'top' | 'bottom';
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  toolBarPosition = 'bottom',
  ...props
}) => {
  const editor = useEditor({
    editorProps: {
      attributes: {
        class: cn(editorClassNames, props.editorClassNames),
      },
    },
    extensions: [
      StarterKit.configure({
        orderedList: {
          HTMLAttributes: {
            class: cn(HTMLAttributesClassNames, props.HTMLAttributesClassNames),
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: cn(HTMLAttributesClassNames, props.HTMLAttributesClassNames),
          },
        },
      }),
      HardBreak.extend({
        addKeyboardShortcuts() {
            return {
              Enter: () => {
                return this.editor.commands.setHardBreak();
              },
            };
        },
      }),
    ],
    content: props.value,
    onUpdate: ({ editor }) => {
      props.onChange(editor.getHTML());
    },
  });

  return (
    <React.Fragment>
      {toolBarPosition === 'top' ? (
        <React.Fragment>
          {editor ? <Toolbar editor={editor} /> : null}
        </React.Fragment>
      ) : null}
      <EditorContent placeholder={props.placeholder} editor={editor} />
      {toolBarPosition === 'bottom' ? (
        <React.Fragment>
          {editor ? <Toolbar editor={editor} /> : null}
        </React.Fragment>
      ) : null}
    </React.Fragment>
  );
};

export default RichTextEditor;
